import type { RGBA } from './pixelData';

/**
 * Patch-based undo/redo for pixel edits.
 *
 * Each stroke (mouse-down → up) becomes a single patch that records
 * every changed pixel's (idx, prev, next). Undo applies prev, redo
 * applies next.
 *
 * Memory: 50 strokes × ~1024 pixels max × ~24 bytes/entry ≈ 1.2MB worst.
 * Typical use ~50KB. No concern at this scale.
 */

export interface PixelChange {
  idx: number;       // 1D pixel index (y * width + x)
  prev: RGBA;
  next: RGBA;
}

export interface StrokePatch {
  pixels: PixelChange[];
}

export interface HistoryState {
  undoStack: StrokePatch[];
  redoStack: StrokePatch[];
  maxSize: number;
}

export function createHistory(maxSize = 50): HistoryState {
  return { undoStack: [], redoStack: [], maxSize };
}

/**
 * Push a finished stroke onto the undo stack. Clears the redo stack
 * (standard editor behaviour: any new edit invalidates redo future).
 *
 * Empty patches are ignored.
 */
export function pushStroke(state: HistoryState, patch: StrokePatch): HistoryState {
  if (patch.pixels.length === 0) return state;
  let undoStack = [...state.undoStack, patch];
  if (undoStack.length > state.maxSize) {
    undoStack = undoStack.slice(undoStack.length - state.maxSize);
  }
  return { ...state, undoStack, redoStack: [] };
}

/**
 * Pop the latest stroke off undoStack and onto redoStack.
 * Returns null if undo is empty.
 */
export function undo(state: HistoryState): { state: HistoryState; patch: StrokePatch } | null {
  if (state.undoStack.length === 0) return null;
  const undoStack = state.undoStack.slice(0, -1);
  const patch = state.undoStack[state.undoStack.length - 1];
  const redoStack = [...state.redoStack, patch];
  return { state: { ...state, undoStack, redoStack }, patch };
}

/**
 * Pop redoStack onto undoStack. Returns null if redo is empty.
 */
export function redo(state: HistoryState): { state: HistoryState; patch: StrokePatch } | null {
  if (state.redoStack.length === 0) return null;
  const redoStack = state.redoStack.slice(0, -1);
  const patch = state.redoStack[state.redoStack.length - 1];
  const undoStack = [...state.undoStack, patch];
  return { state: { ...state, undoStack, redoStack }, patch };
}

/**
 * Build a stroke patch from a Map<idx, {prev, next}>.
 * Map dedupes pixels that the cursor crossed multiple times within
 * the same stroke (only the FIRST prev and the LAST next survive,
 * which is correct semantically).
 */
export function buildStrokePatch(changes: Map<number, { prev: RGBA; next: RGBA }>): StrokePatch {
  const pixels: PixelChange[] = [];
  for (const [idx, change] of changes) {
    pixels.push({ idx, prev: change.prev, next: change.next });
  }
  return { pixels };
}

/** Convenience predicates. */
export function canUndo(state: HistoryState): boolean {
  return state.undoStack.length > 0;
}
export function canRedo(state: HistoryState): boolean {
  return state.redoStack.length > 0;
}
