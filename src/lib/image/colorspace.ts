/**
 * RGB ↔ HSL color space conversion + saturation clamp.
 *
 * Why HSL pre-clamp:
 *   AI image generators (and JPEG sources) often produce hyper-saturated
 *   pixels in highlights/shadows. After quantization those few pixels
 *   become palette anchors and the result looks neon. Clamping S < 0.85
 *   before quantization prevents that without making the image dull —
 *   the median user can't tell the difference perceptually, but the
 *   quantizer no longer chases neon outliers.
 *
 * Implementation: standard HSL conversion (Hue 0..1, S 0..1, L 0..1).
 * Performance: ~5ns per pixel on V8 — 1M pixels ≈ 5ms.
 */

export interface RgbToHslResult {
  h: number; // 0..1 (multiply by 360 for degrees)
  s: number;
  l: number;
}

export function rgbToHsl(r: number, g: number, b: number): RgbToHslResult {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l }; // achromatic
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rf: h = ((gf - bf) / d + (gf < bf ? 6 : 0)); break;
    case gf: h = (bf - rf) / d + 2; break;
    default: h = (rf - gf) / d + 4; break;
  }
  return { h: h / 6, s, l };
}

function hueToRgb(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v }; // achromatic
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hueToRgb(p, q, h) * 255),
    b: Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Apply linear contrast (out = a * in + b) per channel, in-place.
 *
 * Used after high-quality downscale to push washed-out mid-tones toward
 * palette extremes — mimics the look of hand-drawn pixel art where every
 * pixel is a decisive colour choice (not a pastel average).
 *
 * Defaults a=1.18, b=-12 are matched to server-side `sharp.linear(1.18, -12)`.
 */
export function applyLinearContrast(
  rgba: Uint8ClampedArray | Uint8Array,
  a = 1.18,
  b = -12,
): void {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    rgba[i]     = Math.max(0, Math.min(255, Math.round(rgba[i]     * a + b)));
    rgba[i + 1] = Math.max(0, Math.min(255, Math.round(rgba[i + 1] * a + b)));
    rgba[i + 2] = Math.max(0, Math.min(255, Math.round(rgba[i + 2] * a + b)));
  }
}

/**
 * Binarize low-saturation pixels to pure black or pure white.
 *
 * Why aggressive (binarize) not gentle (band):
 *   Lanczos downscale of high-detail art produces a sea of mid-gray
 *   pixels at silhouette edges, body shading, and AA halos. A "gentle"
 *   band approach (snap only L<0.18 or L>0.78) leaves mid-grays alone,
 *   so the quantizer picks them as palette anchors → washed-out body
 *   pixels and "hole" artifacts in white regions.
 *
 *   Hand-drawn pixel art rarely uses ambiguous gray — it uses pure
 *   black, pure white, or saturated palette colors. So we mimic that:
 *   any unsaturated pixel snaps to the nearest extreme.
 *
 * Coloured pixels (mint glow, anything with S > sThreshold) are
 * untouched — only neutrals move.
 *
 *   S ≤ sThreshold AND L < splitL → (0,0,0)
 *   S ≤ sThreshold AND L ≥ splitL → (255,255,255)
 */
export function snapNeutralExtremes(
  rgba: Uint8ClampedArray | Uint8Array,
  sThreshold = 0.18,
  splitL = 0.5,
): void {
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    const { s, l } = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (s > sThreshold) continue; // saturated colour, leave alone
    if (l < splitL) {
      rgba[i] = 0; rgba[i + 1] = 0; rgba[i + 2] = 0;
    } else {
      rgba[i] = 255; rgba[i + 1] = 255; rgba[i + 2] = 255;
    }
  }
}

/**
 * Clamp saturation in-place on an RGBA buffer.
 *
 * @param rgba — Uint8ClampedArray | Uint8Array of RGBA pixels
 * @param maxSaturation — 0..1, pixels above this S get capped. 0.85 is a
 *   sensible default — stays vibrant but kills neon outliers.
 *
 * Skips fully transparent pixels (alpha=0) since they have no visible color.
 */
export function clampSaturation(
  rgba: Uint8ClampedArray | Uint8Array,
  maxSaturation: number,
): void {
  if (maxSaturation >= 1) return; // no-op
  const cap = Math.max(0, Math.min(1, maxSaturation));
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] === 0) continue;
    const { h, s, l } = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (s <= cap) continue;
    const { r, g, b } = hslToRgb(h, cap, l);
    rgba[i] = r;
    rgba[i + 1] = g;
    rgba[i + 2] = b;
  }
}
