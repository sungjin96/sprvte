/**
 * Color quantization wrapper around image-q.
 *
 * Why image-q:
 *   - One library, server + client (no native deps)
 *   - Same algorithm both sides → preview matches server output
 *     (kills the "preview ≠ result" surprise)
 *   - Includes Floyd-Steinberg, Atkinson, Bayer, Stucki, Sierra dithers
 *   - LAB-aware color distance (better than RGB euclidean for palette fit)
 *
 * Why default `wuquant` not k-means:
 *   wuquant is ~5x faster than rgbquant (k-means hybrid) at 32 colors,
 *   visually indistinguishable for game pixel art. k-means wins only
 *   for paletteSize < 8 (think Game Boy 4-color), which is a TODO.
 *
 * Why default `floyd-steinberg`:
 *   Best detail preservation for AI-generated input where smooth gradients
 *   are common. For sharp-line sprite art the user may want 'nearest'
 *   (no dither) — exposed as option.
 */

import {
  applyPaletteSync,
  buildPaletteSync,
  utils,
  type PaletteQuantization,
  type ImageQuantization,
} from 'image-q';

export type QuantizerKind = 'wuquant' | 'rgbquant' | 'neuquant';
export type DitherKind = 'none' | 'floyd-steinberg' | 'atkinson' | 'stucki' | 'sierra' | 'bayer';

export interface QuantizeOptions {
  /** Number of colors in output palette. 2..256. Default 32. */
  paletteSize?: number;
  /** Quantizer algorithm. Default 'wuquant'. */
  quantizer?: QuantizerKind;
  /** Dithering. Default 'floyd-steinberg'. */
  dithering?: DitherKind;
}

const DEFAULTS: Required<QuantizeOptions> = {
  paletteSize: 32,
  quantizer: 'wuquant',
  dithering: 'floyd-steinberg',
};

// Dither kind → image-q ImageQuantization. 'bayer' isn't directly supported
// by image-q — fall back to 'sierra-lite' as nearest equivalent. None → 'nearest'.
function ditherToImageQ(d: DitherKind): ImageQuantization {
  if (d === 'none') return 'nearest';
  if (d === 'bayer') return 'sierra-lite';
  return d;
}

function quantizerToImageQ(q: QuantizerKind): PaletteQuantization {
  return q;
}

/**
 * Quantize an RGBA buffer to a palette.
 *
 * Deterministic for the same (input, options) — required for
 * server/client cross-impl parity tests.
 *
 * @param rgba — RGBA pixels (length = w * h * 4)
 * @param width
 * @param height
 * @param options
 * @returns new Uint8ClampedArray (input not mutated)
 */
export function quantizeRGBA(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: QuantizeOptions = {},
): Uint8ClampedArray {
  const opts = { ...DEFAULTS, ...options };
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `RGBA length (${rgba.length}) doesn't match width*height*4 (${width * height * 4})`,
    );
  }
  if (opts.paletteSize < 2 || opts.paletteSize > 256) {
    throw new Error(`paletteSize must be 2..256, got ${opts.paletteSize}`);
  }

  // Convert to image-q PointContainer (Uint8 input)
  const u8 = rgba instanceof Uint8Array ? rgba : new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.length);
  const container = utils.PointContainer.fromUint8Array(u8, width, height);

  let palette;
  try {
    palette = buildPaletteSync([container], {
      paletteQuantization: quantizerToImageQ(opts.quantizer),
      colors: opts.paletteSize,
      colorDistanceFormula: 'euclidean-bt709',
    });
  } catch (err) {
    // Fallback: copy input as-is. Caller can detect via comparison.
    console.warn('[quantize] buildPaletteSync failed, returning input unchanged:', err);
    return new Uint8ClampedArray(rgba);
  }

  let quantized;
  try {
    quantized = applyPaletteSync(container, palette, {
      imageQuantization: ditherToImageQ(opts.dithering),
      colorDistanceFormula: 'euclidean-bt709',
    });
  } catch (err) {
    console.warn('[quantize] applyPaletteSync failed, returning input unchanged:', err);
    return new Uint8ClampedArray(rgba);
  }

  return new Uint8ClampedArray(quantized.toUint8Array());
}
