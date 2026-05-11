import type { EntityCategory } from '@/types/entity';
import type { LiveLayer } from '@/types/liveLayer';

/**
 * Layer template — the SAM2 prompt set + tree structure for an entity category.
 *
 * Per CEO decision (2026-04-28): user generates "naked" character assets and
 * adds equipment as separate item entities. So occlusion is rare — no inpainting
 * stage. Templates list visible body parts only.
 */
export interface LayerTemplateNode {
  id: string;          // local id within template
  name: string;        // display name (Korean default; will be i18n'd)
  kind: 'background' | 'body' | 'outfit' | 'weapon' | 'effect' | 'accessory' | 'group' | 'custom';
  /** Grounded-SAM2 prompt for this leaf. null/empty for groups. */
  samPrompt: string | null;
  isGroup: boolean;
  children?: LayerTemplateNode[];
}

export interface LayerTemplate {
  category: EntityCategory;
  /** Tree of layers (depth-first, paint order). */
  tree: LayerTemplateNode[];
  /** Version: bump when template changes (used as cache key + reproducibility). */
  version: number;
}

const character: LayerTemplate = {
  category: 'character',
  version: 1,
  tree: [
    {
      id: 'root', name: '캐릭터', kind: 'group', samPrompt: null, isGroup: true,
      children: [
        {
          id: 'head', name: '머리', kind: 'group', samPrompt: null, isGroup: true,
          children: [
            { id: 'hair',  name: '머리카락', kind: 'body', samPrompt: 'hair on head, top of head',         isGroup: false },
            {
              id: 'face', name: '얼굴', kind: 'group', samPrompt: null, isGroup: true,
              children: [
                { id: 'eyes',  name: '눈',   kind: 'body', samPrompt: 'eyes on the face',     isGroup: false },
                { id: 'nose',  name: '코',   kind: 'body', samPrompt: 'nose on the face',     isGroup: false },
                { id: 'mouth', name: '입',   kind: 'body', samPrompt: 'mouth, lips on face',  isGroup: false },
                { id: 'skin',  name: '피부', kind: 'body', samPrompt: 'face skin',            isGroup: false },
              ],
            },
          ],
        },
        {
          id: 'torso', name: '상체', kind: 'group', samPrompt: null, isGroup: true,
          children: [
            { id: 'body',  name: '몸',   kind: 'body', samPrompt: 'torso body',  isGroup: false },
            { id: 'arm-l', name: '왼팔', kind: 'body', samPrompt: 'left arm',    isGroup: false },
            { id: 'arm-r', name: '오른팔', kind: 'body', samPrompt: 'right arm',  isGroup: false },
          ],
        },
        {
          id: 'legs', name: '하체', kind: 'group', samPrompt: null, isGroup: true,
          children: [
            { id: 'leg-l', name: '왼다리',   kind: 'body', samPrompt: 'left leg',  isGroup: false },
            { id: 'leg-r', name: '오른다리', kind: 'body', samPrompt: 'right leg', isGroup: false },
          ],
        },
      ],
    },
  ],
};

const map: LayerTemplate = {
  category: 'map',
  version: 1,
  tree: [
    { id: 'sky',     name: '하늘/배경', kind: 'background', samPrompt: 'sky, distant background',      isGroup: false },
    { id: 'terrain', name: '지형',      kind: 'body',        samPrompt: 'terrain, ground, ridges',     isGroup: false },
    { id: 'props',   name: '오브젝트',  kind: 'body',        samPrompt: 'props, objects, decorations', isGroup: false },
    { id: 'fx',      name: '조명/효과', kind: 'effect',      samPrompt: 'lighting, atmospheric effects', isGroup: false },
  ],
};

const item: LayerTemplate = {
  category: 'item',
  version: 1,
  tree: [
    { id: 'icon',      name: '본체',     kind: 'body',   samPrompt: 'main item body, icon body',  isGroup: false },
    { id: 'highlight', name: '하이라이트', kind: 'effect', samPrompt: 'highlights, shine',          isGroup: false },
    { id: 'shadow',    name: '그림자',   kind: 'effect', samPrompt: 'shadow, drop shadow',         isGroup: false },
  ],
};

const ui: LayerTemplate = {
  category: 'ui',
  version: 1,
  tree: [
    { id: 'panel', name: '패널',  kind: 'body',   samPrompt: 'panel background, frame',     isGroup: false },
    { id: 'text',  name: '텍스트', kind: 'body',  samPrompt: 'text, label',                  isGroup: false },
    { id: 'icons', name: '아이콘', kind: 'effect', samPrompt: 'small icons, decoration',    isGroup: false },
  ],
};

const effect: LayerTemplate = {
  category: 'effect',
  version: 1,
  tree: [
    { id: 'core',      name: '코어',     kind: 'body',   samPrompt: 'core, center of effect',     isGroup: false },
    { id: 'glow',      name: '발광',     kind: 'effect', samPrompt: 'glow, halo, aura',           isGroup: false },
    { id: 'particles', name: '파티클',  kind: 'effect', samPrompt: 'particles, sparks, debris',  isGroup: false },
  ],
};

export const LAYER_TEMPLATES: Record<EntityCategory, LayerTemplate> = {
  character,
  map,
  item,
  ui,
  effect,
};

/**
 * Convert a category template into a flat LiveLayer[] suitable for the
 * entity workspace UI mock state. Real backend will replace these with
 * SAM2 worker output; this just gives every category a coherent starting tree.
 */
export function templateToMockLayers(category: EntityCategory): LiveLayer[] {
  const template = LAYER_TEMPLATES[category];
  if (!template) return [];

  const out: LiveLayer[] = [];
  const walk = (nodes: LayerTemplateNode[], parentId: string | null) => {
    nodes.forEach((node, order) => {
      const seed = `${category}-${node.id}`;
      out.push({
        id: node.id,
        name: node.name,
        kind: node.kind,
        parentId,
        order,
        isGroup: node.isGroup,
        expanded: node.isGroup ? true : undefined,
        visible: true,
        locked: false,
        status: 'idle',
        thumbUrl: node.isGroup ? null : `https://picsum.photos/seed/${seed}/64/64`,
        imageUrl: node.isGroup ? null : `https://picsum.photos/seed/${seed}/512/384`,
      });
      if (node.children) walk(node.children, node.id);
    });
  };
  walk(template.tree, null);
  return out;
}

/**
 * Flatten a template tree to a SAM2 prompt list.
 * Returns leaf nodes only (groups have no SAM prompt).
 */
export function templateLeafPrompts(template: LayerTemplate): { id: string; name: string; prompt: string }[] {
  const out: { id: string; name: string; prompt: string }[] = [];
  const walk = (nodes: LayerTemplateNode[]) => {
    for (const n of nodes) {
      if (!n.isGroup && n.samPrompt) out.push({ id: n.id, name: n.name, prompt: n.samPrompt });
      if (n.children) walk(n.children);
    }
  };
  walk(template.tree);
  return out;
}
