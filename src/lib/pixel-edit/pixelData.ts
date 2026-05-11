/**
 * Pixel-level helpers around HTMLCanvasElement / ImageData.
 *
 * Single source of truth for the editor: ImageData. The Canvas hosting
 * that ImageData is what Konva.Image renders, so mutating the bytes +
 * calling Konva.Image.draw() is enough — no React state churn.
 *
 * All helpers are pure or in-place (clearly marked). Functional API
 * keeps unit tests easy.
 */

export type RGBA = [number, number, number, number];

export interface Point {
  x: number;
  y: number;
}

/**
 * Read RGBA at (x, y). Returns null if out of bounds.
 */
export function getPixel(image: ImageData, x: number, y: number): RGBA | null {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return null;
  const i = (y * image.width + x) * 4;
  return [image.data[i], image.data[i + 1], image.data[i + 2], image.data[i + 3]];
}

/**
 * Write RGBA at (x, y) IN-PLACE. No-op if out of bounds.
 * Returns true if a pixel was actually written.
 */
export function setPixel(image: ImageData, x: number, y: number, rgba: RGBA): boolean {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return false;
  const i = (y * image.width + x) * 4;
  image.data[i] = rgba[0];
  image.data[i + 1] = rgba[1];
  image.data[i + 2] = rgba[2];
  image.data[i + 3] = rgba[3];
  return true;
}

/** Convert (x, y) to flat 1D index (for use as Map key in stroke patches). */
export function pixelIndex(image: ImageData, x: number, y: number): number {
  return y * image.width + x;
}

/** Inverse of pixelIndex. */
export function indexToXY(image: ImageData, idx: number): Point {
  return { x: idx % image.width, y: Math.floor(idx / image.width) };
}

/** Deep copy ImageData (since the constructor doesn't accept ImageData directly). */
export function cloneImageData(image: ImageData): ImageData {
  const copy = new ImageData(image.width, image.height);
  copy.data.set(image.data);
  return copy;
}

/**
 * Load a dataURL into a fresh ImageData via offscreen canvas.
 * Rejects on CORS / decode errors / empty input.
 */
export function fromDataURL(url: string): Promise<ImageData> {
  if (!url) return Promise.reject(new Error('empty dataURL'));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('canvas 2d context unavailable'));
        return;
      }
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
      try {
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      } catch (err) {
        reject(err); // CORS taint
      }
    };
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = url;
  });
}

/** Encode ImageData → PNG dataURL via offscreen canvas. */
export function toDataURL(image: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Bresenham's line algorithm — list of integer (x, y) points from a to b.
 *
 * Used to fill in pixels between fast mouse-move events. Without it,
 * a quick drag from (0, 0) to (10, 10) would only paint two endpoints.
 *
 * Includes both endpoints.
 */
export function bresenhamLine(a: Point, b: Point): Point[] {
  const points: Point[] = [];
  let x0 = a.x, y0 = a.y;
  const x1 = b.x, y1 = b.y;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  // Safety cap to avoid pathological loops
  let safety = (dx + Math.abs(dy)) * 2 + 4;
  while (safety-- > 0) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return points;
}
