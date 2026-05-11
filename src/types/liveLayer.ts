export type LayerKind = 'background' | 'body' | 'outfit' | 'weapon' | 'effect' | 'accessory' | 'group' | 'custom';

export interface LiveLayer {
  id: string;
  name: string;
  kind: LayerKind;
  parentId: string | null; // null = root
  order: number;            // sort order within parent
  isGroup: boolean;         // true = container (no own pixels), children render inside
  thumbUrl?: string | null;
  imageUrl?: string | null;
  /** Single-step undo target. Set when this layer is regenerated. */
  previousImageUrl?: string | null;
  previousThumbUrl?: string | null;
  visible: boolean;
  locked: boolean;
  expanded?: boolean;       // tree expand state for groups
  status: 'idle' | 'generating' | 'failed';
  errorMessage?: string;
}

export interface LayerEditEntry {
  id: string;
  layerId: string;
  prompt: string;
  resultThumbUrl?: string | null;
  previousThumbUrl?: string | null;
  timestamp: string;
}

export interface CompositionSnapshot {
  id: string;
  name: string;
  thumbUrl?: string | null;
  layers: LiveLayer[];
  createdAt: string;
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

export interface LayerTreeNode {
  layer: LiveLayer;
  depth: number;
  children: LayerTreeNode[];
}

/**
 * Build a tree from a flat layer list.
 * Roots are layers with parentId === null.
 */
export function buildLayerTree(layers: LiveLayer[]): LayerTreeNode[] {
  const byParent = new Map<string | null, LiveLayer[]>();
  for (const layer of layers) {
    const list = byParent.get(layer.parentId) ?? [];
    list.push(layer);
    byParent.set(layer.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const build = (parentId: string | null, depth: number): LayerTreeNode[] => {
    return (byParent.get(parentId) ?? []).map((l) => ({
      layer: l,
      depth,
      children: build(l.id, depth + 1),
    }));
  };

  return build(null, 0);
}

/**
 * Flatten a tree to a paint order list (parent first, then children in order).
 * For composite rendering: paint root → leaf for each branch in order.
 */
export function flattenForPaint(nodes: LayerTreeNode[]): LiveLayer[] {
  const out: LiveLayer[] = [];
  const walk = (list: LayerTreeNode[]) => {
    for (const node of list) {
      if (!node.layer.isGroup) out.push(node.layer);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Flatten a tree to a UI list with depth info, respecting expand state.
 * Collapsed groups don't show their children.
 */
export function flattenForDisplay(nodes: LayerTreeNode[]): LayerTreeNode[] {
  const out: LayerTreeNode[] = [];
  const walk = (list: LayerTreeNode[]) => {
    for (const node of list) {
      out.push(node);
      // Group default expanded unless explicitly false
      const expanded = node.layer.isGroup ? (node.layer.expanded ?? true) : false;
      if (expanded) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/** Get all descendant layer IDs of `rootId` (depth-first). Excludes the input itself. */
export function getDescendantIds(layers: LiveLayer[], rootId: string): string[] {
  const out: string[] = [];
  const childrenOf = (parentId: string) => layers.filter((l) => l.parentId === parentId);
  const walk = (id: string) => {
    for (const child of childrenOf(id)) {
      out.push(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return out;
}

/**
 * True if moving `sourceId` under `targetId` would create a cycle
 * (target is a descendant of source — including identity).
 */
export function wouldCreateCycle(
  layers: LiveLayer[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return true;
  return getDescendantIds(layers, sourceId).includes(targetId);
}
