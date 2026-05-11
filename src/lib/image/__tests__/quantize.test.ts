import { describe, it, expect } from 'vitest';
import { quantizeRGBA } from '../quantize';

function gradient(w: number, h: number): Uint8ClampedArray {
  // Smooth red→blue gradient
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = x / Math.max(1, w - 1);
      const i = (y * w + x) * 4;
      out[i]     = Math.round(255 * (1 - t));
      out[i + 1] = 0;
      out[i + 2] = Math.round(255 * t);
      out[i + 3] = 255;
    }
  }
  return out;
}

function uniqueRGBs(rgba: Uint8ClampedArray): number {
  const set = new Set<number>();
  for (let i = 0; i < rgba.length; i += 4) {
    set.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
  }
  return set.size;
}

describe('quantizeRGBA', () => {
  it('throws on length mismatch', () => {
    const buf = new Uint8ClampedArray(15);
    expect(() => quantizeRGBA(buf, 4, 4)).toThrow(/length/);
  });

  it('throws on paletteSize out of range', () => {
    const buf = gradient(4, 4);
    expect(() => quantizeRGBA(buf, 4, 4, { paletteSize: 1 })).toThrow();
    expect(() => quantizeRGBA(buf, 4, 4, { paletteSize: 257 })).toThrow();
  });

  it('reduces unique colors to ~paletteSize for gradient', () => {
    const w = 32, h = 8;
    const px = gradient(w, h);
    const before = uniqueRGBs(px);
    const after = quantizeRGBA(px, w, h, { paletteSize: 8, dithering: 'none' });
    const afterUnique = uniqueRGBs(after);
    expect(before).toBeGreaterThan(20);
    expect(afterUnique).toBeLessThanOrEqual(8);
  });

  it('does not mutate input', () => {
    const px = gradient(8, 8);
    const before = Array.from(px);
    quantizeRGBA(px, 8, 8);
    for (let i = 0; i < px.length; i++) expect(px[i]).toBe(before[i]);
  });

  it('preserves alpha channel', () => {
    const w = 8, h = 8;
    const px = gradient(w, h);
    for (let i = 3; i < px.length; i += 4) px[i] = 200; // alpha=200 everywhere
    const out = quantizeRGBA(px, w, h, { paletteSize: 16, dithering: 'none' });
    // Alpha should be preserved (or close — image-q may quantize it slightly)
    for (let i = 3; i < out.length; i += 4) {
      expect(Math.abs(out[i] - 200)).toBeLessThanOrEqual(40);
    }
  });

  it('is deterministic for the same input + options', () => {
    const px = gradient(16, 16);
    const a = quantizeRGBA(px, 16, 16, { paletteSize: 8, dithering: 'none', quantizer: 'wuquant' });
    const b = quantizeRGBA(px, 16, 16, { paletteSize: 8, dithering: 'none', quantizer: 'wuquant' });
    for (let i = 0; i < a.length; i++) expect(a[i]).toBe(b[i]);
  });

  it.each(['wuquant', 'rgbquant', 'neuquant'] as const)(
    'works with %s quantizer',
    (q) => {
      const px = gradient(16, 16);
      const out = quantizeRGBA(px, 16, 16, { paletteSize: 8, quantizer: q, dithering: 'none' });
      expect(out.length).toBe(px.length);
      expect(uniqueRGBs(out)).toBeLessThanOrEqual(8);
    },
  );

  it.each(['none', 'floyd-steinberg', 'atkinson', 'stucki', 'sierra', 'bayer'] as const)(
    'works with %s dithering',
    (d) => {
      const px = gradient(16, 16);
      const out = quantizeRGBA(px, 16, 16, { paletteSize: 4, dithering: d });
      expect(out.length).toBe(px.length);
    },
  );

  it('paletteSize=2 produces near-binary output', () => {
    const px = gradient(16, 16);
    const out = quantizeRGBA(px, 16, 16, { paletteSize: 2, dithering: 'none' });
    expect(uniqueRGBs(out)).toBeLessThanOrEqual(2);
  });

  it('paletteSize=256 keeps near-original colors', () => {
    const px = gradient(16, 4);
    const out = quantizeRGBA(px, 16, 4, { paletteSize: 256, dithering: 'none' });
    expect(out.length).toBe(px.length);
  });
});
