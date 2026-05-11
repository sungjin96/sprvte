import type { RGBA } from './pixelData';

/**
 * Palette extraction + management for the pixel touch-up editor.
 *
 * We extract the set of unique RGB(A) colours from a quantized result
 * image (typically ≤32 colours after image-q). The palette is what the
 * user sees in the left panel — clicking a swatch picks that colour.
 *
 * Free picker (HSL slider) operates outside the palette but can push
 * a new colour into it via addColor.
 */

export type PaletteColor = RGBA;

const RGBA_KEY = (c: PaletteColor) => `${c[0]},${c[1]},${c[2]},${c[3]}`;

/**
 * Extract up to `max` unique non-transparent colours from an ImageData.
 * Sorted by frequency (most-used first) — matches what humans expect
 * the "palette" to be.
 */
export function extractPalette(image: ImageData, max = 16): PaletteColor[] {
  const counts = new Map<string, { color: PaletteColor; count: number }>();
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // skip fully transparent
    const color: PaletteColor = [data[i], data[i + 1], data[i + 2], a];
    const key = RGBA_KEY(color);
    const entry = counts.get(key);
    if (entry) entry.count++;
    else counts.set(key, { color, count: 1 });
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
  return sorted.slice(0, max).map((e) => e.color);
}

/** Add a colour to the palette. Dedupes; returns the new array. */
export function addColor(palette: PaletteColor[], color: PaletteColor): PaletteColor[] {
  const key = RGBA_KEY(color);
  if (palette.some((c) => RGBA_KEY(c) === key)) return palette;
  return [...palette, color];
}

/** Remove a colour from the palette by exact RGBA match. */
export function removeColor(palette: PaletteColor[], color: PaletteColor): PaletteColor[] {
  const key = RGBA_KEY(color);
  return palette.filter((c) => RGBA_KEY(c) !== key);
}

/** Compare two RGBA tuples by exact value. */
export function colorsEqual(a: PaletteColor, b: PaletteColor): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/** Convert RGBA tuple to CSS string. */
export function rgbaToCss(c: PaletteColor): string {
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3] / 255})`;
}

/** Convert RGBA to short HEX (#RRGGBB) — alpha ignored. */
export function rgbaToHex(c: PaletteColor): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`.toUpperCase();
}
