import sharp from 'sharp';
import { clampSaturation, snapNeutralExtremes } from './colorspace';
import { bilateralFilter } from './bilateral';
import { quantizeRGBA, type DitherKind, type QuantizerKind } from './quantize';

/**
 * Server-side pixelation pipeline.
 *
 * ┌─────────────┐
 * │ input Buffer│
 * └──────┬──────┘
 *        │ sharp.raw().toBuffer()  → RGBA Uint8Array
 *        │
 *        │ if (W*H ≤ BILATERAL_MAX_PIXELS) bilateralFilter
 *        │ else sharp.median(2) fallback
 *        │
 *        │ clampSaturation(maxSaturation)  in HSL
 *        │
 *        │ sharp.resize(targetSize, NN, contain)  → downscale
 *        │
 *        │ quantizeRGBA(targetSize × targetSize, opts)
 *        │
 *        │ sharp.resize(targetSize × upscale, NN, fill)  → display upscale
 *        ▼
 * ┌─────────────┐
 * │ output PNG  │
 * └─────────────┘
 *
 * Why this order:
 *   - bilateral BEFORE downscale: preserves edges in the larger image
 *     before resolution loss. Hard limit at BILATERAL_MAX_PIXELS to
 *     keep CPU bounded.
 *   - saturation clamp BEFORE quantization: prevents the quantizer
 *     from picking neon outliers as palette anchors.
 *   - quantization AFTER downscale: smaller pixel count = faster +
 *     sharper palette boundaries.
 *
 * For input larger than INPUT_MAX_PIXELS, we pre-resize to that limit
 * to bound memory (RGBA at 4096² is ~67MB).
 */

export type { DitherKind, QuantizerKind } from './quantize';

export type PixelateProvider = 'local' | 'replicate';

export interface PixelateOptions {
  /** Target small-image edge in pixels (e.g. 64 = 64×64). */
  targetSize: number;
  /** Palette colour count, 2..256. Default 32. */
  paletteSize?: number;
  /** Display upscale factor (output edge = targetSize × upscale). Default 8. */
  upscale?: number;
  /** Max saturation 0..1 in HSL space. Default 0.85. Set 1 to disable. */
  maxSaturation?: number;
  /** Quantizer algorithm. Default 'wuquant'. */
  quantizer?: QuantizerKind;
  /** Dithering. Default 'floyd-steinberg'. */
  dithering?: DitherKind;
  /** Bilateral edge-preserving smoothing before downscale. Default true. */
  bilateral?: boolean;
  /** AI provider (placeholder, only 'local' implemented in v5). */
  provider?: PixelateProvider;
}

// Defaults tuned for SHARP / BLOCKY game pixel art look.
//   dithering 'none'   → sharp colour transitions, no diffusion noise
//   bilateral false    → preserve original detail, no pre-smoothing
//   maxSaturation 0.85 → still kills neon outliers (the AI artifact problem)
// For "smooth-AI-to-pixel" style results, callers can opt into
// { dithering: 'floyd-steinberg', bilateral: true }.
const DEFAULTS: Required<Omit<PixelateOptions, 'targetSize'>> = {
  paletteSize: 32,
  upscale: 8,
  maxSaturation: 0.85,
  quantizer: 'wuquant',
  dithering: 'none',
  bilateral: false,
  provider: 'local',
};

const INPUT_MAX_PIXELS = 2048 * 2048;
const BILATERAL_MAX_PIXELS = 1024 * 1024;

export interface PixelateResult {
  buffer: Buffer;
  width: number;
  height: number;
}

export async function pixelateImage(
  input: Buffer,
  options: PixelateOptions,
): Promise<PixelateResult> {
  // Use ?? not spread — explicit undefined in options must fall through to DEFAULTS.
  const targetSize = options.targetSize;
  const paletteSize = options.paletteSize ?? DEFAULTS.paletteSize;
  const upscale = options.upscale ?? DEFAULTS.upscale;
  const maxSaturation = options.maxSaturation ?? DEFAULTS.maxSaturation;
  const quantizer = options.quantizer ?? DEFAULTS.quantizer;
  const dithering = options.dithering ?? DEFAULTS.dithering;
  const bilateral = options.bilateral ?? DEFAULTS.bilateral;
  const provider = options.provider ?? DEFAULTS.provider;

  if (!input || input.length === 0) {
    throw new Error('input buffer is empty');
  }
  if (targetSize < 4 || targetSize > 1024) {
    throw new Error(`targetSize must be 4..1024, got ${targetSize}`);
  }
  if (paletteSize < 2 || paletteSize > 256) {
    throw new Error(`paletteSize must be 2..256, got ${paletteSize}`);
  }
  if (upscale < 1 || upscale > 32) {
    throw new Error(`upscale must be 1..32, got ${upscale}`);
  }
  if (provider !== 'local') {
    throw new Error(`provider '${provider}' not implemented yet (v6)`);
  }

  // 1. Decode + cap input size to bound memory.
  const meta = await sharp(input).metadata();
  const inW = meta.width ?? 0;
  const inH = meta.height ?? 0;
  if (inW === 0 || inH === 0) {
    throw new Error('input has zero dimensions');
  }

  let prep = sharp(input).ensureAlpha();
  if (inW * inH > INPUT_MAX_PIXELS) {
    const scale = Math.sqrt(INPUT_MAX_PIXELS / (inW * inH));
    prep = prep.resize(Math.round(inW * scale), Math.round(inH * scale), {
      kernel: sharp.kernel.lanczos3,
      fit: 'inside',
    });
  }

  // 2. Bilateral or median fallback.
  let prepBuffer: Buffer;
  let prepInfo: { width: number; height: number };
  if (bilateral) {
    const { data, info } = await prep.raw().toBuffer({ resolveWithObject: true });
    if (info.width * info.height <= BILATERAL_MAX_PIXELS) {
      const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
      const filtered = bilateralFilter(rgba, info.width, info.height, {
        kernel: 5,
        sigmaSpace: 1.5,
        sigmaRange: 30,
      });
      // 3. saturation clamp on filtered
      clampSaturation(filtered, maxSaturation);
      prepBuffer = Buffer.from(filtered.buffer, 0, filtered.byteLength);
      prepInfo = { width: info.width, height: info.height };
    } else {
      // Too big for bilateral — sharp median + saturation clamp on raw
      const med = sharp(input).median(2);
      const { data: medData, info: medInfo } = await med
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const rgba = new Uint8ClampedArray(medData.buffer, medData.byteOffset, medData.length);
      clampSaturation(rgba, maxSaturation);
      prepBuffer = Buffer.from(rgba.buffer, 0, rgba.byteLength);
      prepInfo = { width: medInfo.width, height: medInfo.height };
    }
  } else {
    const { data, info } = await prep.raw().toBuffer({ resolveWithObject: true });
    const rgba = new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    clampSaturation(rgba, maxSaturation);
    prepBuffer = Buffer.from(rgba.buffer, 0, rgba.byteLength);
    prepInfo = { width: info.width, height: info.height };
  }

  // 4. Downscale to targetSize with HIGH-QUALITY filter, then push contrast.
  //
  // NN downscale at large ratios (1254→32 = 39x) throws away detail randomly:
  // it samples 1 pixel per 39×39 source block, so silhouettes vanish.
  // Lanczos3 averages each block → form preserved → quantizer has signal.
  //
  // BUT averaging produces lots of mid-tones at edges (washed-out look).
  // Hand-drawn pixel art uses decisive colors — we mimic that by:
  //   (a) strong sharpen (sigma 1.2) to define edges crisply
  //   (b) gentle linear contrast boost (linear 1.18, -12) to push mid-tones
  //       toward palette extremes — quantizer then snaps to fewer, bolder colors
  //
  // The blocky "pixel art look" comes from the DISPLAY upscale (step 6),
  // the SHARP look comes from this contrast push.
  const downBuffer = await sharp(prepBuffer, {
    raw: { width: prepInfo.width, height: prepInfo.height, channels: 4 },
  })
    .resize(targetSize, targetSize, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .sharpen({ sigma: 1.2, m1: 1, m2: 2 })
    .linear(1.18, -12)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const dW = downBuffer.info.width;
  const dH = downBuffer.info.height;
  const dRGBA = new Uint8ClampedArray(downBuffer.data.buffer, downBuffer.data.byteOffset, downBuffer.data.length);

  // 4b. Collapse silhouette-edge gray halftones to pure black/white.
  // Lanczos averaging produces washed gray rings at character edges; the
  // quantizer would otherwise pick those grays as palette anchors.
  // Saturated pixels (mint glow, anything with hue) survive untouched.
  snapNeutralExtremes(dRGBA);

  // 5. Quantize + dither.
  const quantized = quantizeRGBA(dRGBA, dW, dH, {
    paletteSize,
    quantizer,
    dithering,
  });

  // 6. NN upscale to display size.
  const displaySize = targetSize * upscale;
  const final = await sharp(Buffer.from(quantized.buffer, 0, quantized.byteLength), {
    raw: { width: dW, height: dH, channels: 4 },
  })
    .resize(displaySize, displaySize, {
      kernel: sharp.kernel.nearest,
      fit: 'fill',
    })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return { buffer: final, width: displaySize, height: displaySize };
}

/**
 * Variant: only return the small (targetSize) version, no display upscale.
 * Use this for asset storage — keep the canonical small file, upscale at render.
 */
export async function pixelateImageRaw(
  input: Buffer,
  options: Omit<PixelateOptions, 'upscale'>,
): Promise<PixelateResult> {
  return pixelateImage(input, { ...options, upscale: 1 });
}
