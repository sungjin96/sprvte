import { describe, it, expect } from 'vitest';
import { AnimationSettings } from '@/types/asset';
import {
  addFrame,
  removeFrame,
  duplicateFrame,
  reorderFrame,
  setFrameDuration,
  setFps,
} from '../operations';

const base = (): AnimationSettings => ({
  gridCols: 4,
  gridRows: 1,
  frameCount: 4,
  fps: 12,
  loop: 'loop',
  frameOrder: [0, 1, 2, 3],
  frameDurations: [83, 83, 83, 83],
});

describe('addFrame', () => {
  it('appends a new frame at end by default', () => {
    const s = addFrame(base());
    expect(s.frameCount).toBe(5);
    expect(s.frameOrder.length).toBe(5);
    expect(s.frameDurations.length).toBe(5);
  });

  it('inserts after specified index', () => {
    const s = addFrame(base(), 1);
    expect(s.frameOrder.slice(0, 2)).toEqual([0, 1]);
    expect(s.frameOrder.length).toBe(5);
  });

  it('expands grid when at capacity', () => {
    const s = addFrame(base()); // cap was 4, now 5 frames → grid expanded
    expect(s.gridCols).toBe(5);
    expect(s.gridRows).toBe(1);
  });

  it('respects MAX_FRAME_COUNT', () => {
    let s = base();
    for (let i = 0; i < 100; i++) s = addFrame(s);
    expect(s.frameCount).toBeLessThanOrEqual(64);
  });
});

describe('removeFrame', () => {
  it('removes the frame at index', () => {
    const s = removeFrame(base(), 1);
    expect(s.frameCount).toBe(3);
    expect(s.frameOrder).toEqual([0, 2, 3]);
    expect(s.frameDurations.length).toBe(3);
  });

  it('refuses to go below MIN_FRAME_COUNT', () => {
    let s = base();
    for (let i = 0; i < 10; i++) s = removeFrame(s, 0);
    expect(s.frameCount).toBe(1);
  });

  it('no-ops on out-of-range index', () => {
    const s = removeFrame(base(), 99);
    expect(s).toEqual(base());
  });
});

describe('duplicateFrame', () => {
  it('inserts a copy right after the source', () => {
    const s = duplicateFrame(base(), 1);
    expect(s.frameCount).toBe(5);
    expect(s.frameDurations[1]).toBe(s.frameDurations[2]);
  });

  it('expands grid when at capacity', () => {
    const s = duplicateFrame(base(), 0);
    expect(s.gridCols).toBeGreaterThanOrEqual(5);
  });
});

describe('reorderFrame', () => {
  it('moves a frame from one position to another', () => {
    const s = reorderFrame(base(), 0, 3);
    expect(s.frameOrder).toEqual([1, 2, 3, 0]);
  });

  it('handles to=from as no-op', () => {
    const s = reorderFrame(base(), 2, 2);
    expect(s).toEqual(base());
  });

  it('moves backward correctly', () => {
    const s = reorderFrame(base(), 3, 0);
    expect(s.frameOrder).toEqual([3, 0, 1, 2]);
  });

  it('moves durations alongside the frame', () => {
    const start = { ...base(), frameDurations: [10, 20, 30, 40] };
    const s = reorderFrame(start, 0, 3);
    expect(s.frameDurations).toEqual([20, 30, 40, 10]);
  });

  it('no-ops on out-of-range', () => {
    expect(reorderFrame(base(), -1, 2)).toEqual(base());
    expect(reorderFrame(base(), 0, 99)).toEqual(base());
  });
});

describe('setFrameDuration', () => {
  it('updates the duration at index', () => {
    const s = setFrameDuration(base(), 2, 200);
    expect(s.frameDurations[2]).toBe(200);
  });

  it('clamps duration to safe range', () => {
    const s = setFrameDuration(base(), 0, 0);
    expect(s.frameDurations[0]).toBeGreaterThanOrEqual(16);
    const s2 = setFrameDuration(base(), 0, 999_999);
    expect(s2.frameDurations[0]).toBeLessThanOrEqual(10_000);
  });
});

describe('setFps', () => {
  it('updates fps and resets durations to uniform', () => {
    const s = setFps(base(), 24);
    expect(s.fps).toBe(24);
    expect(new Set(s.frameDurations).size).toBe(1);
    expect(s.frameDurations[0]).toBe(Math.round(1000 / 24));
  });

  it('clamps fps to [1, 60]', () => {
    expect(setFps(base(), 0).fps).toBe(1);
    expect(setFps(base(), 200).fps).toBe(60);
  });
});
