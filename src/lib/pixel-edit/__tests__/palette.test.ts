import { describe, it, expect, beforeAll } from 'vitest';
import {
  extractPalette,
  addColor,
  removeColor,
  colorsEqual,
  rgbaToCss,
  rgbaToHex,
  type PaletteColor,
} from '../palette';

class MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
beforeAll(() => {
  // @ts-expect-error polyfill
  globalThis.ImageData = MockImageData;
});

function img(pixels: PaletteColor[]): ImageData {
  // 1×N flat row
  const im = new ImageData(pixels.length, 1);
  pixels.forEach((p, i) => {
    im.data[i * 4]     = p[0];
    im.data[i * 4 + 1] = p[1];
    im.data[i * 4 + 2] = p[2];
    im.data[i * 4 + 3] = p[3];
  });
  return im;
}

describe('extractPalette', () => {
  it('returns unique non-transparent colours', () => {
    const palette = extractPalette(img([
      [255, 0, 0, 255], [255, 0, 0, 255], [0, 255, 0, 255], [0, 0, 0, 0],
    ]));
    expect(palette).toHaveLength(2);
  });
  it('skips fully transparent (alpha=0)', () => {
    const palette = extractPalette(img([[255, 0, 0, 0], [0, 0, 0, 0]]));
    expect(palette).toEqual([]);
  });
  it('sorts by frequency (most-used first)', () => {
    const palette = extractPalette(img([
      [255, 0, 0, 255], // 1
      [0, 255, 0, 255], [0, 255, 0, 255], [0, 255, 0, 255], // 3
      [0, 0, 255, 255], [0, 0, 255, 255], // 2
    ]));
    expect(palette[0]).toEqual([0, 255, 0, 255]); // green
    expect(palette[1]).toEqual([0, 0, 255, 255]); // blue
    expect(palette[2]).toEqual([255, 0, 0, 255]); // red
  });
  it('respects max', () => {
    const pixels: PaletteColor[] = Array.from({ length: 30 }, (_, i) => [i, i, i, 255]);
    const palette = extractPalette(img(pixels), 8);
    expect(palette).toHaveLength(8);
  });
});

describe('addColor', () => {
  it('adds new colour', () => {
    const next = addColor([], [10, 20, 30, 255]);
    expect(next).toEqual([[10, 20, 30, 255]]);
  });
  it('dedupes', () => {
    const start = [[10, 20, 30, 255]] as PaletteColor[];
    const next = addColor(start, [10, 20, 30, 255]);
    expect(next).toBe(start); // same reference (no change)
  });
});

describe('removeColor', () => {
  it('removes by exact RGBA', () => {
    const start = [[1, 1, 1, 255], [2, 2, 2, 255]] as PaletteColor[];
    const next = removeColor(start, [1, 1, 1, 255]);
    expect(next).toEqual([[2, 2, 2, 255]]);
  });
  it('no-op on missing', () => {
    const start = [[1, 1, 1, 255]] as PaletteColor[];
    const next = removeColor(start, [9, 9, 9, 255]);
    expect(next).toHaveLength(1);
  });
});

describe('colorsEqual', () => {
  it('matches exact', () => {
    expect(colorsEqual([1, 2, 3, 4], [1, 2, 3, 4])).toBe(true);
    expect(colorsEqual([1, 2, 3, 4], [1, 2, 3, 5])).toBe(false);
  });
});

describe('rgbaToCss / rgbaToHex', () => {
  it('rgbaToCss formats correctly', () => {
    expect(rgbaToCss([255, 0, 0, 255])).toBe('rgba(255, 0, 0, 1)');
    expect(rgbaToCss([0, 0, 0, 128])).toMatch(/^rgba\(0, 0, 0, 0\.50/);
  });
  it('rgbaToHex uppercase', () => {
    expect(rgbaToHex([255, 0, 0, 255])).toBe('#FF0000');
    expect(rgbaToHex([0, 229, 160, 255])).toBe('#00E5A0');
  });
});
