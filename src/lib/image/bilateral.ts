/**
 * Naive bilateral filter for small-to-medium RGBA buffers.
 *
 * Bilateral = spatial Gaussian × range Gaussian. Smooths flat regions
 * while preserving edges (where range Gaussian falloff dominates).
 *
 * This impl is O(N × K²) where K = kernel size. For K=5, that's 25
 * weight computations per pixel. JS V8 handles ~10M ops/sec for the
 * inner loop, so:
 *   - 256×256 (~65K px): ~6ms
 *   - 1024×1024 (~1M px): ~250ms
 *   - 2048×2048 (~4M px): ~1s — too slow, use sharp.median fallback
 *
 * Caller is responsible for applying the size threshold; see pixelate.ts.
 *
 * Alpha channel is passed through unchanged (no spatial blending of alpha).
 */

export interface BilateralOptions {
  /** Spatial kernel size (must be odd). Default 5. */
  kernel?: number;
  /** Spatial standard deviation. Default = kernel / 3. */
  sigmaSpace?: number;
  /** Range (color) standard deviation. Default 30 (intensity 0..255). */
  sigmaRange?: number;
}

export function bilateralFilter(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  options: BilateralOptions = {},
): Uint8ClampedArray {
  const kernel = options.kernel ?? 5;
  if (kernel % 2 === 0) {
    throw new Error(`kernel must be odd, got ${kernel}`);
  }
  const half = (kernel - 1) / 2;
  const sigmaSpace = options.sigmaSpace ?? kernel / 3;
  const sigmaRange = options.sigmaRange ?? 30;

  // Pre-compute spatial weights (kernel × kernel)
  const spatial = new Float32Array(kernel * kernel);
  const ssTwoSigSq = 2 * sigmaSpace * sigmaSpace;
  for (let dy = -half; dy <= half; dy++) {
    for (let dx = -half; dx <= half; dx++) {
      spatial[(dy + half) * kernel + (dx + half)] = Math.exp(-(dx * dx + dy * dy) / ssTwoSigSq);
    }
  }
  const srTwoSigSq = 2 * sigmaRange * sigmaRange;

  const out = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const ci = (y * width + x) * 4;
      const cr = rgba[ci];
      const cg = rgba[ci + 1];
      const cb = rgba[ci + 2];

      let sumR = 0, sumG = 0, sumB = 0, sumW = 0;

      for (let dy = -half; dy <= half; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -half; dx <= half; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          const ni = (yy * width + xx) * 4;
          const nr = rgba[ni];
          const ng = rgba[ni + 1];
          const nb = rgba[ni + 2];

          const dr = nr - cr;
          const dg = ng - cg;
          const db = nb - cb;
          const range = Math.exp(-(dr * dr + dg * dg + db * db) / srTwoSigSq);
          const w = spatial[(dy + half) * kernel + (dx + half)] * range;

          sumR += nr * w;
          sumG += ng * w;
          sumB += nb * w;
          sumW += w;
        }
      }

      out[ci]     = sumR / sumW;
      out[ci + 1] = sumG / sumW;
      out[ci + 2] = sumB / sumW;
      out[ci + 3] = rgba[ci + 3]; // pass-through alpha
    }
  }
  return out;
}
