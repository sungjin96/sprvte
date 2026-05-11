import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { pixelateImage, pixelateImageRaw } from '../pixelate';

async function makePNG(width: number, height: number, fillRGBA: [number, number, number, number] = [128, 64, 200, 255]): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    raw[i * 4]     = fillRGBA[0];
    raw[i * 4 + 1] = fillRGBA[1];
    raw[i * 4 + 2] = fillRGBA[2];
    raw[i * 4 + 3] = fillRGBA[3];
  }
  return sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

async function makeGradientPNG(width: number, height: number): Promise<Buffer> {
  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = x / Math.max(1, width - 1);
      const i = (y * width + x) * 4;
      raw[i]     = Math.round(255 * (1 - t));
      raw[i + 1] = 0;
      raw[i + 2] = Math.round(255 * t);
      raw[i + 3] = 255;
    }
  }
  return sharp(raw, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

describe('pixelateImage — REGRESSION', () => {
  // CRITICAL: existing API consumers (KonvaComposite, composition-seed) must keep working.
  it('returns PNG buffer at targetSize × upscale', async () => {
    const input = await makePNG(128, 128);
    const result = await pixelateImage(input, { targetSize: 64, upscale: 8 });
    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
    // PNG magic bytes
    expect(result.buffer[0]).toBe(0x89);
    expect(result.buffer[1]).toBe(0x50);
    expect(result.buffer[2]).toBe(0x4e);
    expect(result.buffer[3]).toBe(0x47);
  });

  it('default upscale=8 (legacy behaviour)', async () => {
    const input = await makePNG(64, 64);
    const result = await pixelateImage(input, { targetSize: 32 });
    expect(result.width).toBe(256); // 32 × 8
  });

  it('pixelateImageRaw returns small image at targetSize', async () => {
    const input = await makePNG(64, 64);
    const result = await pixelateImageRaw(input, { targetSize: 32 });
    expect(result.width).toBe(32);
    expect(result.height).toBe(32);
  });
});

describe('pixelateImage — validation', () => {
  it('rejects empty buffer', async () => {
    await expect(pixelateImage(Buffer.alloc(0), { targetSize: 32 }))
      .rejects.toThrow(/empty/);
  });

  it('rejects targetSize out of range', async () => {
    const input = await makePNG(32, 32);
    await expect(pixelateImage(input, { targetSize: 2 })).rejects.toThrow(/targetSize/);
    await expect(pixelateImage(input, { targetSize: 2048 })).rejects.toThrow(/targetSize/);
  });

  it('rejects paletteSize out of range', async () => {
    const input = await makePNG(32, 32);
    await expect(pixelateImage(input, { targetSize: 32, paletteSize: 1 }))
      .rejects.toThrow(/paletteSize/);
    await expect(pixelateImage(input, { targetSize: 32, paletteSize: 257 }))
      .rejects.toThrow(/paletteSize/);
  });

  it('rejects unsupported provider', async () => {
    const input = await makePNG(32, 32);
    await expect(pixelateImage(input, { targetSize: 32, provider: 'replicate' }))
      .rejects.toThrow(/replicate/);
  });
});

describe('pixelateImage — quality', () => {
  it('reduces colour count for gradient input', async () => {
    const input = await makeGradientPNG(64, 16);
    const result = await pixelateImageRaw(input, { targetSize: 16, paletteSize: 4 });

    // Decode result and count unique RGB
    const { data } = await sharp(result.buffer).raw().toBuffer({ resolveWithObject: true });
    const set = new Set<number>();
    for (let i = 0; i < data.length; i += 3) {
      // If raw output channels=3 (no alpha after PNG roundtrip), use stride 3
    }
    // Use a more robust approach: open as RGBA
    const { data: rgba } = await sharp(result.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < rgba.length; i += 4) {
      set.add((rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2]);
    }
    expect(set.size).toBeLessThanOrEqual(8);
  });

  it('handles transparent input', async () => {
    const input = await makePNG(32, 32, [0, 0, 0, 0]); // fully transparent
    const result = await pixelateImage(input, { targetSize: 16 });
    expect(result.width).toBeGreaterThan(0);
  });

  it('disables bilateral when option false', async () => {
    const input = await makeGradientPNG(64, 16);
    const a = await pixelateImage(input, { targetSize: 16, bilateral: true });
    const b = await pixelateImage(input, { targetSize: 16, bilateral: false });
    // Both produce valid PNG; we don't compare bytes (algorithm change),
    // just confirm the option path doesn't throw and produces output.
    expect(a.buffer.length).toBeGreaterThan(0);
    expect(b.buffer.length).toBeGreaterThan(0);
  });

  it('honors maxSaturation=1 (no clamp)', async () => {
    const input = await makePNG(16, 16, [255, 0, 0, 255]); // pure red
    const result = await pixelateImage(input, {
      targetSize: 8,
      maxSaturation: 1,
      paletteSize: 4,
      dithering: 'none',
    });
    expect(result.width).toBe(64);
  });
});
