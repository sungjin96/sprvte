import { AnimationSettings, MAX_FRAME_COUNT, MIN_FRAME_COUNT } from '@/types/asset';

/**
 * Pure operations over AnimationSettings. Each returns a new object
 * (no mutation). Callers replace state with the result.
 */

function gridCapacity(s: Pick<AnimationSettings, 'gridCols' | 'gridRows'>): number {
  return s.gridCols * s.gridRows;
}

/**
 * Add a frame after `afterIndex` in display order, defaulting to end.
 * Strategy: duplicate the last frame's grid index. If we've reached grid
 * capacity, expand grid (add a column) so the user can keep going.
 */
export function addFrame(
  settings: AnimationSettings,
  afterIndex?: number,
): AnimationSettings {
  if (settings.frameCount >= MAX_FRAME_COUNT) return settings;

  let next = settings;
  // Auto-expand grid if needed so frameCount can grow.
  if (next.frameCount + 1 > gridCapacity(next)) {
    next = { ...next, gridCols: next.gridCols + 1 };
  }

  const insertAt = typeof afterIndex === 'number'
    ? Math.max(0, Math.min(next.frameCount, afterIndex + 1))
    : next.frameCount;

  // Pick a grid index not yet in frameOrder; fall back to duplicate of last.
  const used = new Set(next.frameOrder);
  let newGridIdx = -1;
  for (let i = 0; i < gridCapacity(next); i++) {
    if (!used.has(i)) { newGridIdx = i; break; }
  }
  if (newGridIdx < 0) {
    newGridIdx = next.frameOrder[next.frameOrder.length - 1] ?? 0;
  }

  const dur = next.frameDurations[insertAt - 1] ?? Math.round(1000 / next.fps);
  const frameOrder = [
    ...next.frameOrder.slice(0, insertAt),
    newGridIdx,
    ...next.frameOrder.slice(insertAt),
  ];
  const frameDurations = [
    ...next.frameDurations.slice(0, insertAt),
    dur,
    ...next.frameDurations.slice(insertAt),
  ];

  return { ...next, frameCount: next.frameCount + 1, frameOrder, frameDurations };
}

/** Remove the frame at `index` (display order). Protects MIN_FRAME_COUNT. */
export function removeFrame(settings: AnimationSettings, index: number): AnimationSettings {
  if (settings.frameCount <= MIN_FRAME_COUNT) return settings;
  if (index < 0 || index >= settings.frameCount) return settings;

  const frameOrder = settings.frameOrder.filter((_, i) => i !== index);
  const frameDurations = settings.frameDurations.filter((_, i) => i !== index);
  return { ...settings, frameCount: settings.frameCount - 1, frameOrder, frameDurations };
}

/**
 * Duplicate the frame at `index`. Inserts a new entry right after it,
 * pointing at a fresh grid slot if available, else duplicating the same slot.
 */
export function duplicateFrame(settings: AnimationSettings, index: number): AnimationSettings {
  if (index < 0 || index >= settings.frameCount) return settings;
  if (settings.frameCount >= MAX_FRAME_COUNT) return settings;

  let next = settings;
  if (next.frameCount + 1 > gridCapacity(next)) {
    next = { ...next, gridCols: next.gridCols + 1 };
  }

  const sourceGridIdx = next.frameOrder[index];
  const used = new Set(next.frameOrder);
  let newGridIdx = sourceGridIdx;
  for (let i = 0; i < gridCapacity(next); i++) {
    if (!used.has(i)) { newGridIdx = i; break; }
  }

  const sourceDur = next.frameDurations[index];
  const insertAt = index + 1;
  const frameOrder = [
    ...next.frameOrder.slice(0, insertAt),
    newGridIdx,
    ...next.frameOrder.slice(insertAt),
  ];
  const frameDurations = [
    ...next.frameDurations.slice(0, insertAt),
    sourceDur,
    ...next.frameDurations.slice(insertAt),
  ];
  return { ...next, frameCount: next.frameCount + 1, frameOrder, frameDurations };
}

/**
 * Move the frame at `from` to position `to` in display order.
 * Other frames shift; grid indices unchanged.
 */
export function reorderFrame(
  settings: AnimationSettings,
  from: number,
  to: number,
): AnimationSettings {
  if (from === to) return settings;
  if (from < 0 || from >= settings.frameCount) return settings;
  if (to < 0 || to >= settings.frameCount) return settings;

  const frameOrder = [...settings.frameOrder];
  const frameDurations = [...settings.frameDurations];
  const [movedOrder] = frameOrder.splice(from, 1);
  const [movedDur] = frameDurations.splice(from, 1);
  frameOrder.splice(to, 0, movedOrder);
  frameDurations.splice(to, 0, movedDur);
  return { ...settings, frameOrder, frameDurations };
}

/** Set duration (ms) for a single frame. */
export function setFrameDuration(
  settings: AnimationSettings,
  index: number,
  durationMs: number,
): AnimationSettings {
  if (index < 0 || index >= settings.frameCount) return settings;
  const clamped = Math.max(16, Math.min(10_000, Math.round(durationMs)));
  const frameDurations = [...settings.frameDurations];
  frameDurations[index] = clamped;
  return { ...settings, frameDurations };
}

/** Update fps and reset durations to uniform default. */
export function setFps(settings: AnimationSettings, fps: number): AnimationSettings {
  const f = Math.max(1, Math.min(60, Math.round(fps)));
  const dur = Math.round(1000 / f);
  return {
    ...settings,
    fps: f,
    frameDurations: settings.frameDurations.map(() => dur),
  };
}
