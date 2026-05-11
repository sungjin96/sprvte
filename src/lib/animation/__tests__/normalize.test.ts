import { describe, it, expect } from 'vitest';
import { normalizeAnimationMeta, readAnimationMeta } from '../normalize';

describe('normalizeAnimationMeta', () => {
  it('returns sane defaults when given empty input', () => {
    const s = normalizeAnimationMeta({});
    expect(s.gridCols).toBeGreaterThan(0);
    expect(s.gridRows).toBeGreaterThan(0);
    expect(s.frameCount).toBeGreaterThanOrEqual(1);
    expect(s.frameOrder.length).toBe(s.frameCount);
    expect(s.frameDurations.length).toBe(s.frameCount);
    expect(s.fps).toBeGreaterThan(0);
    expect(s.loop).toBe('loop');
  });

  it('handles null/undefined/non-object input', () => {
    expect(() => normalizeAnimationMeta(null)).not.toThrow();
    expect(() => normalizeAnimationMeta(undefined)).not.toThrow();
    expect(() => normalizeAnimationMeta(42)).not.toThrow();
    expect(() => normalizeAnimationMeta('string')).not.toThrow();
  });

  it('clamps frameCount to gridCols*gridRows', () => {
    const s = normalizeAnimationMeta({ gridCols: 2, gridRows: 2, frameCount: 99 });
    expect(s.frameCount).toBe(4);
    expect(s.frameOrder.length).toBe(4);
  });

  it('filters out-of-range frameOrder indices', () => {
    const s = normalizeAnimationMeta({
      gridCols: 2,
      gridRows: 2,
      frameCount: 3,
      frameOrder: [0, 999, 2, -5, 1],
    });
    expect(s.frameOrder.every((i) => i >= 0 && i < 4)).toBe(true);
    expect(s.frameOrder.length).toBe(3);
  });

  it('pads frameOrder when too short', () => {
    const s = normalizeAnimationMeta({
      gridCols: 4, gridRows: 1, frameCount: 4,
      frameOrder: [2],
    });
    expect(s.frameOrder.length).toBe(4);
    expect(s.frameOrder[0]).toBe(2);
    expect(new Set(s.frameOrder).size).toBe(4); // unique
  });

  it('trims frameOrder when too long', () => {
    const s = normalizeAnimationMeta({
      gridCols: 4, gridRows: 1, frameCount: 2,
      frameOrder: [0, 1, 2, 3],
    });
    expect(s.frameOrder).toEqual([0, 1]);
  });

  it('pads frameDurations with default 1000/fps', () => {
    const s = normalizeAnimationMeta({
      gridCols: 4, gridRows: 1, frameCount: 4, fps: 10,
      frameDurations: [50],
    });
    expect(s.frameDurations.length).toBe(4);
    expect(s.frameDurations[0]).toBe(50);
    expect(s.frameDurations[1]).toBe(100); // 1000/10
  });

  it('clamps fps to [1, 60]', () => {
    expect(normalizeAnimationMeta({ fps: 0 }).fps).toBe(1);
    expect(normalizeAnimationMeta({ fps: 200 }).fps).toBe(60);
    expect(normalizeAnimationMeta({ fps: -5 }).fps).toBe(1);
    expect(normalizeAnimationMeta({ fps: NaN }).fps).toBeGreaterThan(0);
  });

  it('falls back to "loop" for invalid loop mode', () => {
    expect(normalizeAnimationMeta({ loop: 'banana' }).loop).toBe('loop');
    expect(normalizeAnimationMeta({ loop: 'pingpong' }).loop).toBe('pingpong');
    expect(normalizeAnimationMeta({ loop: 'once' }).loop).toBe('once');
  });

  it('handles legacy data with no animation fields', () => {
    const s = normalizeAnimationMeta({ unrelated: 'data' });
    expect(s.frameCount).toBeGreaterThanOrEqual(1);
    expect(s.frameOrder.length).toBe(s.frameCount);
  });

  it('clamps frame durations to reasonable range', () => {
    const s = normalizeAnimationMeta({
      gridCols: 2, gridRows: 1, frameCount: 2,
      frameDurations: [-100, 999_999],
    });
    expect(s.frameDurations[0]).toBeGreaterThanOrEqual(16);
    expect(s.frameDurations[1]).toBeLessThanOrEqual(10_000);
  });
});

describe('readAnimationMeta', () => {
  it('extracts from Asset.metadata.animation', () => {
    const meta = { animation: { gridCols: 8, gridRows: 1, frameCount: 8, fps: 24 } };
    const s = readAnimationMeta(meta);
    expect(s.gridCols).toBe(8);
    expect(s.fps).toBe(24);
  });

  it('returns defaults when metadata is absent', () => {
    const s = readAnimationMeta(null);
    expect(s.frameCount).toBeGreaterThanOrEqual(1);
  });
});
