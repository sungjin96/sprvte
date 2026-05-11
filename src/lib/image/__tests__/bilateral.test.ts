import { describe, it, expect } from 'vitest';
import { bilateralFilter } from '../bilateral';

function uniform(w: number, h: number, r: number, g: number, b: number, a = 255): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = r;
    out[i * 4 + 1] = g;
    out[i * 4 + 2] = b;
    out[i * 4 + 3] = a;
  }
  return out;
}

describe('bilateralFilter', () => {
  it('throws on even kernel', () => {
    const px = uniform(4, 4, 100, 100, 100);
    expect(() => bilateralFilter(px, 4, 4, { kernel: 4 })).toThrow();
  });

  it('uniform color → output identical', () => {
    const px = uniform(8, 8, 120, 60, 200, 255);
    const out = bilateralFilter(px, 8, 8, { kernel: 5 });
    for (let i = 0; i < px.length; i += 4) {
      expect(Math.abs(out[i] - 120)).toBeLessThanOrEqual(1);
      expect(Math.abs(out[i + 1] - 60)).toBeLessThanOrEqual(1);
      expect(Math.abs(out[i + 2] - 200)).toBeLessThanOrEqual(1);
    }
  });

  it('preserves alpha channel exactly', () => {
    const px = uniform(4, 4, 50, 50, 50, 128);
    const out = bilateralFilter(px, 4, 4);
    for (let i = 3; i < out.length; i += 4) {
      expect(out[i]).toBe(128);
    }
  });

  it('reduces noise in flat region', () => {
    // 8×8 with random ±20 noise around 128
    const w = 8, h = 8;
    const px = new Uint8ClampedArray(w * h * 4);
    let seed = 1234;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return (seed % 41) - 20; // -20..20
    };
    for (let i = 0; i < w * h; i++) {
      px[i * 4]     = 128 + rand();
      px[i * 4 + 1] = 128 + rand();
      px[i * 4 + 2] = 128 + rand();
      px[i * 4 + 3] = 255;
    }

    const inVar = pixelVariance(px);
    const out = bilateralFilter(px, w, h, { kernel: 5, sigmaRange: 50 });
    const outVar = pixelVariance(out);
    expect(outVar).toBeLessThan(inVar);
  });

  it('preserves a sharp vertical edge', () => {
    // 8×4 with left half black, right half white
    const w = 8, h = 4;
    const px = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const v = x < w / 2 ? 0 : 255;
        px[i] = v;
        px[i + 1] = v;
        px[i + 2] = v;
        px[i + 3] = 255;
      }
    }

    const out = bilateralFilter(px, w, h, { kernel: 5, sigmaRange: 30 });
    // Center-left pixel should still be near-black, center-right near-white
    const left = out[(2 * w + 1) * 4];
    const right = out[(2 * w + 6) * 4];
    expect(left).toBeLessThan(60);
    expect(right).toBeGreaterThan(195);
  });
});

function pixelVariance(rgba: Uint8ClampedArray): number {
  const n = rgba.length / 4;
  let mean = 0;
  for (let i = 0; i < rgba.length; i += 4) mean += rgba[i];
  mean /= n;
  let sq = 0;
  for (let i = 0; i < rgba.length; i += 4) sq += (rgba[i] - mean) ** 2;
  return sq / n;
}
