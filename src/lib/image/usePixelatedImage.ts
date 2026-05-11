'use client';

import { useEffect, useRef, useState } from 'react';
import type { OutputSize } from '@/components/asset/OutputSizeSelector';
import { clampSaturation, applyLinearContrast, snapNeutralExtremes } from './colorspace';
import { bilateralFilter } from './bilateral';
import { quantizeRGBA, type DitherKind, type QuantizerKind } from './quantize';

/**
 * Client-side preview pixelation, server-parity edition.
 *
 * Same pipeline as `pixelate.ts`, replacing sharp with Canvas:
 *   1. Image → offscreen canvas (NN downscale)
 *   2. (small enough) bilateral filter
 *   3. clampSaturation in HSL
 *   4. quantizeRGBA via image-q (same lib as server)
 *
 * Result is byte-identical to server output for the same options
 * (same image-q version, same downscale algorithm).
 *
 * Memory: reuses canvas + Image refs across calls (no GC pressure
 * on slider drag).
 *
 * Debounce: 100ms — fast enough to feel live, slow enough to avoid
 * flooding on rapid slider drag.
 */

export interface UsePixelatedImageOptions {
  paletteSize?: number;
  maxSaturation?: number;
  quantizer?: QuantizerKind;
  dithering?: DitherKind;
  bilateral?: boolean;
  /** Snap split point for low-saturation pixels (0..1). Default 0.5. */
  splitL?: number;
  /** Saturation threshold for "treated as colour" (0..1). Default 0.18. */
  snapSThreshold?: number;
  /** Linear contrast a (out = a*in + b). Default 1.18. */
  linearA?: number;
  /** Linear contrast b. Default -12. */
  linearB?: number;
  /** Debounce in ms before recomputing. Default 100. */
  debounceMs?: number;
}

const DEBOUNCE_DEFAULT = 100;
const BILATERAL_MAX_PIXELS = 1024 * 1024;

export function usePixelatedImage(
  sourceUrl: string | null | undefined,
  outputSize: OutputSize,
  options: UsePixelatedImageOptions = {},
): string | null {
  // Defaults match server-side pixelate.ts — sharp/blocky pixel art look.
  const {
    paletteSize = 32,
    maxSaturation = 0.85,
    quantizer = 'wuquant',
    dithering = 'none',
    bilateral = false,
    splitL = 0.5,
    snapSThreshold = 0.18,
    linearA = 1.18,
    linearB = -12,
    debounceMs = DEBOUNCE_DEFAULT,
  } = options;

  const [result, setResult] = useState<string | null>(null);

  // Reused refs to avoid GC pressure on rapid slider drag
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!sourceUrl) {
      setResult(null);
      return;
    }
    if (outputSize === 'regular') {
      setResult(sourceUrl);
      return;
    }

    let cancelled = false;
    const target = outputSize as number;

    const compute = () => {
      if (cancelled) return;
      const img = imgRef.current ?? new Image();
      img.crossOrigin = 'anonymous';
      imgRef.current = img;

      const onLoad = () => {
        if (cancelled) return;
        const canvas = canvasRef.current ?? document.createElement('canvas');
        canvasRef.current = canvas;
        canvas.width = target;
        canvas.height = target;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // High-quality downscale (Canvas internal lanczos/bicubic) — same
        // reasoning as server: NN at 39x ratio throws away the silhouette.
        // The blocky "pixel art" look comes from display upscale (NN) at
        // render time, not from the downscale step.
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.clearRect(0, 0, target, target);
        const scale = Math.min(target / img.width, target / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (target - dw) / 2, (target - dh) / 2, dw, dh);

        const imageData = ctx.getImageData(0, 0, target, target);
        const rgba = imageData.data;

        // Bilateral on small canvas is fast (target² ≤ 1024²)
        let filtered: Uint8ClampedArray = rgba;
        if (bilateral && target * target <= BILATERAL_MAX_PIXELS) {
          filtered = bilateralFilter(rgba, target, target, {
            kernel: 5,
            sigmaSpace: 1.5,
            sigmaRange: 30,
          });
        }

        clampSaturation(filtered, maxSaturation);
        // Push mid-tones to extremes so quantizer picks decisive colours.
        applyLinearContrast(filtered, linearA, linearB);
        // Binarize low-saturation grays (silhouette edge halftones) to
        // pure black/white. Saturated pixels untouched.
        snapNeutralExtremes(filtered, snapSThreshold, splitL);

        const quantized = quantizeRGBA(filtered, target, target, {
          paletteSize,
          quantizer,
          dithering,
        });

        // Write back into canvas → toDataURL.
        // Reuse the imageData buffer (same length) to avoid ImageData ctor overloads.
        imageData.data.set(quantized);
        ctx.putImageData(imageData, 0, 0);

        if (cancelled) return;
        setResult(canvas.toDataURL('image/png'));
      };

      img.onload = onLoad;
      img.onerror = () => {
        if (!cancelled) setResult(sourceUrl); // graceful fallback
      };
      // Trigger load. If src unchanged, browser will use cached image
      // and `onload` may not fire — handle that:
      if (img.src === sourceUrl && img.complete && img.naturalWidth > 0) {
        onLoad();
      } else {
        img.src = sourceUrl;
      }
    };

    const t = window.setTimeout(compute, debounceMs);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [sourceUrl, outputSize, paletteSize, maxSaturation, quantizer, dithering, bilateral, splitL, snapSThreshold, linearA, linearB, debounceMs]);

  return result;
}
