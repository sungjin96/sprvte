import { describe, it, expect } from 'vitest';
import {
  getPixel,
  setPixel,
  pixelIndex,
  indexToXY,
  cloneImageData,
  bresenhamLine,
  type RGBA,
} from '../pixelData';

// vitest's node env doesn't have ImageData; polyfill a minimal one.
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
// @ts-expect-error — install global polyfill for tests
globalThis.ImageData = MockImageData;

function makeImage(w: number, h: number): ImageData {
  return new ImageData(w, h);
}

describe('getPixel', () => {
  it('returns RGBA tuple for in-bounds', () => {
    const img = makeImage(2, 2);
    img.data[0] = 10; img.data[1] = 20; img.data[2] = 30; img.data[3] = 255;
    expect(getPixel(img, 0, 0)).toEqual([10, 20, 30, 255]);
  });
  it('returns null for out-of-bounds', () => {
    const img = makeImage(2, 2);
    expect(getPixel(img, -1, 0)).toBeNull();
    expect(getPixel(img, 0, -1)).toBeNull();
    expect(getPixel(img, 2, 0)).toBeNull();
    expect(getPixel(img, 0, 2)).toBeNull();
  });
});

describe('setPixel', () => {
  it('writes RGBA in-place and returns true', () => {
    const img = makeImage(2, 2);
    expect(setPixel(img, 1, 1, [50, 60, 70, 80])).toBe(true);
    expect(getPixel(img, 1, 1)).toEqual([50, 60, 70, 80]);
  });
  it('no-ops out of bounds and returns false', () => {
    const img = makeImage(2, 2);
    expect(setPixel(img, -1, 0, [1, 1, 1, 1])).toBe(false);
    expect(setPixel(img, 5, 5, [1, 1, 1, 1])).toBe(false);
  });
  it('handles eraser (alpha=0)', () => {
    const img = makeImage(2, 2);
    setPixel(img, 0, 0, [255, 255, 255, 255]);
    setPixel(img, 0, 0, [0, 0, 0, 0]);
    expect(getPixel(img, 0, 0)).toEqual([0, 0, 0, 0]);
  });
});

describe('pixelIndex / indexToXY', () => {
  it('round-trips coordinates', () => {
    const img = makeImage(8, 4);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 8; x++) {
        const idx = pixelIndex(img, x, y);
        expect(indexToXY(img, idx)).toEqual({ x, y });
      }
    }
  });
});

describe('cloneImageData', () => {
  it('produces an independent copy', () => {
    const img = makeImage(3, 3);
    setPixel(img, 1, 1, [100, 100, 100, 255]);
    const copy = cloneImageData(img);
    expect(copy.width).toBe(img.width);
    expect(getPixel(copy, 1, 1)).toEqual([100, 100, 100, 255]);
    setPixel(img, 1, 1, [0, 0, 0, 255]);
    expect(getPixel(copy, 1, 1)).toEqual([100, 100, 100, 255]); // unchanged
  });
});

describe('bresenhamLine', () => {
  it('returns single point when start = end', () => {
    expect(bresenhamLine({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual([{ x: 5, y: 5 }]);
  });
  it('horizontal line includes both endpoints', () => {
    const line = bresenhamLine({ x: 0, y: 0 }, { x: 4, y: 0 });
    expect(line).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
    ]);
  });
  it('vertical line includes both endpoints', () => {
    const line = bresenhamLine({ x: 0, y: 0 }, { x: 0, y: 3 });
    expect(line).toHaveLength(4);
    expect(line[0]).toEqual({ x: 0, y: 0 });
    expect(line[3]).toEqual({ x: 0, y: 3 });
  });
  it('diagonal line includes both endpoints, no gaps', () => {
    const line = bresenhamLine({ x: 0, y: 0 }, { x: 3, y: 3 });
    expect(line).toHaveLength(4);
    expect(line[0]).toEqual({ x: 0, y: 0 });
    expect(line[3]).toEqual({ x: 3, y: 3 });
  });
  it('handles reversed direction', () => {
    const line = bresenhamLine({ x: 5, y: 0 }, { x: 0, y: 0 });
    expect(line[0]).toEqual({ x: 5, y: 0 });
    expect(line[5]).toEqual({ x: 0, y: 0 });
  });
});
