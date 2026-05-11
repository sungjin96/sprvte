export type EntityCategory =
  | 'character'
  | 'map'
  | 'item'
  | 'ui'
  | 'effect';

export type EntityMode = 'standard' | 'quality';

export type ReferenceType = 'front' | 'side' | 'back' | 'main' | 'style';

// ── Guide data shapes per category ────────────────────────────────────────────
// All fields are flat strings/string-arrays for form simplicity.
// Server-side may parse structure later; UI keeps it user-friendly.

export interface CharacterGuideData {
  physique?: string;     // free-form, e.g. "athletic, slim"
  height?: string;       // e.g. "170cm"
  features?: string;     // facial/hair, e.g. "red hair, green eyes, scar"
  bodyTraits?: string;   // non-human anatomy, e.g. "fox tail, wings, horns"
  outfit?: string;       // e.g. "silver armor, crimson cloak"
  personality?: string;  // e.g. "brave, confident"
  palette?: string[];    // hex codes
  notes?: string;
}

export interface MapGuideData {
  theme?: string;        // e.g. "underground dungeon"
  atmosphere?: string;   // e.g. "dark, mysterious"
  lighting?: string;     // e.g. "dim purple torches"
  palette?: string[];
  tileSize?: number;     // px, e.g. 64
  notes?: string;
}

export interface ItemGuideData {
  itemCategory?: string; // e.g. "weapon", "armor", "consumable"
  material?: string;
  style?: string;
  palette?: string[];
  notes?: string;
}

export type GuideData = CharacterGuideData | MapGuideData | ItemGuideData | Record<string, unknown>;

export interface EntityReference {
  id: string;
  entityId: string;
  assetId: string;
  referenceType: ReferenceType;
  asset?: {
    fileUrl?: string | null;
    name: string;
  };
}

export interface Entity {
  id: string;
  projectId: string;
  category: EntityCategory;
  name: string;
  description?: string | null;
  mode: EntityMode;
  guideData: GuideData;
  autoPrompt?: string | null;
  references?: EntityReference[];
  assetCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const ENTITY_CATEGORY_LABELS: Record<EntityCategory, string> = {
  character: 'Characters',
  map:       'Maps',
  item:      'Items',
  ui:        'UI',
  effect:    'Effects',
};

export const ENTITY_CATEGORY_ICONS: Record<EntityCategory, string> = {
  character: '🧝',
  map:       '🗺️',
  item:      '⚔️',
  ui:        '🖼️',
  effect:    '✨',
};
