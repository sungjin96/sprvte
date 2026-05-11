import { describe, it, expect } from 'vitest';
import { rgbToHsl, hslToRgb, clampSaturation } from '../colorspace';

describe('rgbToHsl', () => {
  it('returns S=0 for grays', () => {
    expect(rgbToHsl(128, 128, 128).s).toBe(0);
    expect(rgbToHsl(0, 0, 0).s).toBe(0);
    expect(rgbToHsl(255, 255, 255).s).toBe(0);
  });

  it('detects pure red/green/blue with S=1', () => {
    expect(rgbToHsl(255, 0, 0).s).toBe(1);
    expect(rgbToHsl(0, 255, 0).s).toBe(1);
    expect(rgbToHsl(0, 0, 255).s).toBe(1);
  });

  it('returns L=0 for black, L=1 for white', () => {
    expect(rgbToHsl(0, 0, 0).l).toBe(0);
    expect(rgbToHsl(255, 255, 255).l).toBe(1);
  });

  it('returns H = 0 for red, ~1/3 for green, ~2/3 for blue', () => {
    expect(rgbToHsl(255, 0, 0).h).toBe(0);
    expect(rgbToHsl(0, 255, 0).h).toBeCloseTo(1 / 3, 5);
    expect(rgbToHsl(0, 0, 255).h).toBeCloseTo(2 / 3, 5);
  });
});

describe('hslToRgb', () => {
  it('round-trips primaries within 1 unit', () => {
    const cases = [
      [255, 0, 0], [0, 255, 0], [0, 0, 255],
      [128, 64, 200], [200, 100, 50], [50, 200, 100],
    ] as const;
    for (const [r, g, b] of cases) {
      const { h, s, l } = rgbToHsl(r, g, b);
      const back = hslToRgb(h, s, l);
      expect(Math.abs(back.r - r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - b)).toBeLessThanOrEqual(1);
    }
  });

  it('returns gray for s=0', () => {
    expect(hslToRgb(0.5, 0, 0.5)).toEqual({ r: 128, g: 128, b: 128 });
  });
});

describe('clampSaturation', () => {
  function makePixel(r: number, g: number, b: number, a = 255): Uint8ClampedArray {
    return new Uint8ClampedArray([r, g, b, a]);
  }

  it('caps saturation above threshold', () => {
    const px = makePixel(255, 0, 0); // S=1
    clampSaturation(px, 0.5);
    const { s } = rgbToHsl(px[0], px[1], px[2]);
    expect(s).toBeCloseTo(0.5, 1);
  });

  it('leaves S below threshold unchanged', () => {
    const px = makePixel(150, 100, 100); // moderate saturation
    const before = [px[0], px[1], px[2]];
    clampSaturation(px, 0.85);
    expect(px[0]).toBe(before[0]);
    expect(px[1]).toBe(before[1]);
    expect(px[2]).toBe(before[2]);
  });

  it('leaves grays unchanged', () => {
    const px = makePixel(128, 128, 128);
    clampSaturation(px, 0.5);
    expect(px[0]).toBe(128);
    expect(px[1]).toBe(128);
    expect(px[2]).toBe(128);
  });

  it('skips fully transparent pixels', () => {
    const px = makePixel(255, 0, 0, 0);
    clampSaturation(px, 0.5);
    expect(px[0]).toBe(255); // untouched
  });

  it('preserves alpha', () => {
    const px = makePixel(255, 0, 0, 200);
    clampSaturation(px, 0.5);
    expect(px[3]).toBe(200);
  });

  it('no-op when maxSaturation >= 1', () => {
    const px = makePixel(255, 0, 0);
    clampSaturation(px, 1);
    expect(px[0]).toBe(255);
    expect(px[1]).toBe(0);
    expect(px[2]).toBe(0);
  });
});
