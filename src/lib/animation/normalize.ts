import {
  AnimationSettings,
  AnimationLoopMode,
  ANIMATION_LOOP_MODES,
  MIN_FRAME_COUNT,
  MAX_FRAME_COUNT,
} from '@/types/asset';

const DEFAULT_GRID_COLS = 4;
const DEFAULT_GRID_ROWS = 1;
const DEFAULT_FPS = 12;
const DEFAULT_LOOP: AnimationLoopMode = 'loop';

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.max(min, Math.min(max, v));
}

function clampFloat(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, v));
}

/**
 * Normalize raw animation metadata (potentially malformed/legacy) into
 * a guaranteed-valid AnimationSettings object.
 *
 * Invariants after normalization:
 *   frameOrder.length === frameCount
 *   frameDurations.length === frameCount
 *   every frameOrder[i] in [0, gridCols*gridRows)
 *   frameCount in [MIN_FRAME_COUNT, gridCols*gridRows]
 */
export function normalizeAnimationMeta(raw: unknown): AnimationSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const gridCols = clampInt(r.gridCols, 1, 32, DEFAULT_GRID_COLS);
  const gridRows = clampInt(r.gridRows, 1, 32, DEFAULT_GRID_ROWS);
  const gridCapacity = gridCols * gridRows;

  const frameCount = clampInt(
    r.frameCount,
    MIN_FRAME_COUNT,
    Math.min(MAX_FRAME_COUNT, gridCapacity),
    Math.min(gridCapacity, DEFAULT_GRID_COLS),
  );

  const fps = clampFloat(r.fps, 1, 60, DEFAULT_FPS);

  const loop: AnimationLoopMode = ANIMATION_LOOP_MODES.includes(r.loop as AnimationLoopMode)
    ? (r.loop as AnimationLoopMode)
    : DEFAULT_LOOP;

  // Normalize frameOrder: keep only valid indices, then pad/trim to frameCount.
  const rawOrder = Array.isArray(r.frameOrder) ? r.frameOrder : null;
  const validIndices: number[] = [];
  if (rawOrder) {
    for (const x of rawOrder) {
      const i = typeof x === 'number' && Number.isFinite(x) ? Math.floor(x) : -1;
      if (i >= 0 && i < gridCapacity) validIndices.push(i);
    }
  }
  // Pad with sequential indices (skipping ones already used) until length === frameCount.
  const usedSet = new Set(validIndices);
  for (let i = 0; i < gridCapacity && validIndices.length < frameCount; i++) {
    if (!usedSet.has(i)) validIndices.push(i);
  }
  const frameOrder = validIndices.slice(0, frameCount);

  // Normalize frameDurations to frameCount length, default 1000/fps.
  const defaultDur = Math.round(1000 / fps);
  const rawDur = Array.isArray(r.frameDurations) ? r.frameDurations : null;
  const frameDurations: number[] = [];
  for (let i = 0; i < frameCount; i++) {
    const d = rawDur && i < rawDur.length ? rawDur[i] : defaultDur;
    frameDurations.push(clampInt(d, 16, 10_000, defaultDur));
  }

  return { gridCols, gridRows, frameCount, fps, loop, frameOrder, frameDurations };
}

/** Convenience: pull AnimationSettings from Asset.metadata, with normalization. */
export function readAnimationMeta(metadata: unknown): AnimationSettings {
  const m = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  return normalizeAnimationMeta(m.animation);
}
