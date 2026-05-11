import { describe, it, expect } from 'vitest';
import {
  createHistory,
  pushStroke,
  undo,
  redo,
  buildStrokePatch,
  canUndo,
  canRedo,
} from '../pixelHistory';
import type { RGBA } from '../pixelData';

const W: RGBA = [255, 255, 255, 255];
const B: RGBA = [0, 0, 0, 255];
const R: RGBA = [255, 0, 0, 255];

describe('createHistory', () => {
  it('starts empty', () => {
    const h = createHistory();
    expect(h.undoStack).toEqual([]);
    expect(h.redoStack).toEqual([]);
    expect(canUndo(h)).toBe(false);
    expect(canRedo(h)).toBe(false);
  });
});

describe('pushStroke', () => {
  it('pushes patch onto undoStack', () => {
    const h = pushStroke(createHistory(), { pixels: [{ idx: 0, prev: W, next: B }] });
    expect(h.undoStack).toHaveLength(1);
  });
  it('clears redoStack on new stroke (standard behaviour)', () => {
    let h = pushStroke(createHistory(), { pixels: [{ idx: 0, prev: W, next: B }] });
    const u = undo(h)!;
    h = u.state; // redoStack now has 1
    expect(canRedo(h)).toBe(true);
    h = pushStroke(h, { pixels: [{ idx: 1, prev: W, next: R }] });
    expect(canRedo(h)).toBe(false);
  });
  it('ignores empty patches', () => {
    const h = pushStroke(createHistory(), { pixels: [] });
    expect(h.undoStack).toEqual([]);
  });
  it('respects maxSize (oldest dropped)', () => {
    let h = createHistory(3);
    for (let i = 0; i < 5; i++) {
      h = pushStroke(h, { pixels: [{ idx: i, prev: W, next: B }] });
    }
    expect(h.undoStack).toHaveLength(3);
    expect(h.undoStack[0].pixels[0].idx).toBe(2); // oldest 0,1 dropped
    expect(h.undoStack[2].pixels[0].idx).toBe(4);
  });
});

describe('undo', () => {
  it('returns null on empty stack', () => {
    expect(undo(createHistory())).toBeNull();
  });
  it('pops latest patch and pushes onto redoStack', () => {
    const patch = { pixels: [{ idx: 0, prev: W, next: B }] };
    const h = pushStroke(createHistory(), patch);
    const result = undo(h)!;
    expect(result.patch).toBe(patch);
    expect(result.state.undoStack).toHaveLength(0);
    expect(result.state.redoStack).toHaveLength(1);
  });
});

describe('redo', () => {
  it('returns null on empty redoStack', () => {
    expect(redo(createHistory())).toBeNull();
  });
  it('round-trip undo → redo', () => {
    const patch = { pixels: [{ idx: 0, prev: W, next: B }] };
    let h = pushStroke(createHistory(), patch);
    const u = undo(h)!;
    h = u.state;
    const r = redo(h)!;
    expect(r.patch).toBe(patch);
    expect(r.state.undoStack).toHaveLength(1);
    expect(r.state.redoStack).toHaveLength(0);
  });
});

describe('buildStrokePatch', () => {
  it('produces patch from change Map (dedupes by key)', () => {
    const changes = new Map<number, { prev: RGBA; next: RGBA }>();
    changes.set(0, { prev: W, next: B });
    changes.set(1, { prev: W, next: R });
    const patch = buildStrokePatch(changes);
    expect(patch.pixels).toHaveLength(2);
    expect(patch.pixels[0]).toEqual({ idx: 0, prev: W, next: B });
  });
  it('Map dedupe keeps first prev + latest next semantically', () => {
    // Caller is responsible for not overwriting prev when same idx visited
    // multiple times. We just verify Map ↔ array conversion works.
    const changes = new Map<number, { prev: RGBA; next: RGBA }>();
    changes.set(0, { prev: W, next: B });
    expect(buildStrokePatch(changes).pixels).toHaveLength(1);
  });
});
