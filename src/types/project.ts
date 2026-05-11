export interface Project {
  id: string;
  name: string;
  genre?: string | null;
  artStyle?: string | null;
  basePrompt?: string | null;
  basePromptEn?: string | null;
  stylePrompt?: string | null;
  colorPalette?: string[] | null;
  assetCount?: number;
  entityCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_GENRES = [
  { value: 'rpg',        label: 'RPG' },
  { value: 'platformer', label: 'Platformer' },
  { value: 'strategy',   label: 'Strategy' },
  { value: 'puzzle',     label: 'Puzzle' },
  { value: 'action',     label: 'Action' },
  { value: 'other',      label: 'Other' },
] as const;

export const PROJECT_ART_STYLES = [
  { value: 'pixel-8bit',        label: 'Pixel Art (8-bit)' },
  { value: 'pixel-16bit',       label: 'Pixel Art (16-bit)' },
  { value: 'isometric-sprite',  label: 'Isometric Sprite' },
  { value: 'cartoon',           label: 'Cartoon' },
  { value: 'chibi',             label: 'Chibi / SD' },
  { value: 'anime-flat',        label: 'Anime (Flat)' },
  { value: 'anime-painterly',   label: 'Anime (Painterly)' },
  { value: 'watercolor',        label: 'Watercolor' },
  { value: 'oil-painting',      label: 'Oil Painting' },
  { value: 'low-poly',          label: 'Low Poly' },
  { value: 'semi-realistic',    label: 'Semi-Realistic' },
  { value: 'realistic',         label: 'Realistic' },
  { value: 'hand-drawn',        label: 'Hand-Drawn' },
] as const;
