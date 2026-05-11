export type AssetStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AssetType =
  | 'character'
  | 'background'
  | 'ui'
  | 'bgm'
  | 'sfx'
  | 'sprite_sheet'
  | 'effect'
  | 'ambient';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'add'
  | 'soft-light';

export interface LayerData {
  zIndex: number;
  blendMode: BlendMode;
  opacity: number;      // 0–100
  visible: boolean;
  layerGroupId: string; // UUID — links layers of the same composite
}

export interface Asset {
  id: string;
  projectId: string;
  entityId?: string | null;
  name: string;
  type: AssetType;
  status: AssetStatus;
  sourceAssetId?: string | null;
  assetGroupId?: string | null;
  generationParams?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  layerData?: LayerData | null;
  providerUsed?: string | null;
  modelUsed?: string | null;
  fileUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  character:    'Character',
  background:   'Background',
  ui:           'UI',
  bgm:          'BGM',
  sfx:          'SFX',
  sprite_sheet: 'Sprite Sheet',
  effect:       'Effect',
  ambient:      'Ambient',
};

export const IMAGE_ASSET_TYPES: AssetType[] = [
  'character', 'background', 'ui', 'sprite_sheet', 'effect',
];

export const AUDIO_ASSET_TYPES: AssetType[] = ['bgm', 'sfx', 'ambient'];

export const PIXEL_SIZES = [8, 16, 32, 64, 128, 256, 512] as const;
export type PixelSize = (typeof PIXEL_SIZES)[number];

// ── Animation (sprite_sheet) ─────────────────────────────────────────────────
export type AnimationLoopMode = 'loop' | 'once' | 'pingpong';

export interface AnimationSettings {
  /** Sheet grid layout. */
  gridCols: number;
  gridRows: number;
  /** Active frames count (≤ gridCols*gridRows). */
  frameCount: number;
  /** Default playback rate. Per-frame override via frameDurations. */
  fps: number;
  loop: AnimationLoopMode;
  /**
   * Display order. Always present after normalization.
   * Indices reference the grid (row-major: 0..gridCols*gridRows-1).
   * Length always equals frameCount.
   */
  frameOrder: number[];
  /**
   * Per-frame duration in ms. Length always equals frameCount.
   * Default: 1000/fps for each entry.
   */
  frameDurations: number[];
}

export const ANIMATION_LOOP_MODES: AnimationLoopMode[] = ['loop', 'once', 'pingpong'];
export const MIN_FRAME_COUNT = 1;
export const MAX_FRAME_COUNT = 64;
