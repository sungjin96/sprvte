export interface ScenePlacement {
  id: string;
  assetId: string;
  imageUrl: string;          // empty string for groups
  name?: string;             // user-editable display name (overrides asset name)

  /** Tree position. null = root. */
  parentId: string | null;
  /** True = container (no own visual; just holds children). */
  isGroup: boolean;
  /** Tree expand state for groups OR parents with children. */
  expanded?: boolean;

  /** Logical scene-space center (absolute, NOT relative to parent). */
  x: number;
  y: number;
  scale: number;             // %
  rotation: number;          // degrees
  flipX: boolean;
  flipY: boolean;

  /** Sort order within parent's children. */
  zOrder: number;
  visible: boolean;
}

// ── Tree helpers ──────────────────────────────────────────────────────────────

export interface PlacementTreeNode {
  placement: ScenePlacement;
  depth: number;
  children: PlacementTreeNode[];
}

export function buildPlacementTree(placements: ScenePlacement[]): PlacementTreeNode[] {
  const byParent = new Map<string | null, ScenePlacement[]>();
  for (const p of placements) {
    const list = byParent.get(p.parentId) ?? [];
    list.push(p);
    byParent.set(p.parentId, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.zOrder - b.zOrder);
  }
  const build = (parentId: string | null, depth: number): PlacementTreeNode[] =>
    (byParent.get(parentId) ?? []).map((p) => ({
      placement: p,
      depth,
      children: build(p.id, depth + 1),
    }));
  return build(null, 0);
}

/**
 * Paint order: depth-first, parent BEFORE children (so children paint on top).
 * Skips groups (no own image).
 *
 * Display order in panel uses the REVERSE so "top of list = front".
 */
export function flattenForPaint(nodes: PlacementTreeNode[]): ScenePlacement[] {
  const out: ScenePlacement[] = [];
  const walk = (list: PlacementTreeNode[]) => {
    for (const node of list) {
      if (!node.placement.isGroup) out.push(node.placement);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Display order in panel: top of tree = highest z (front).
 * Within each parent, children listed top→bottom by DESC zOrder.
 * Respects collapsed state.
 */
export function flattenForDisplay(nodes: PlacementTreeNode[]): PlacementTreeNode[] {
  const out: PlacementTreeNode[] = [];
  const walk = (list: PlacementTreeNode[]) => {
    // Reverse so highest zOrder appears first
    const sorted = [...list].sort((a, b) => b.placement.zOrder - a.placement.zOrder);
    for (const node of sorted) {
      out.push(node);
      const expanded = node.placement.expanded ?? true;
      if (expanded && node.children.length > 0) walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

/**
 * Get all descendant placement IDs (depth-first). Excludes the input itself.
 */
export function getDescendantIds(placements: ScenePlacement[], rootId: string): string[] {
  const out: string[] = [];
  const childrenOf = (parentId: string) => placements.filter((p) => p.parentId === parentId);
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
 * Detect whether moving `sourceId` under `targetId` would create a cycle
 * (i.e. target is a descendant of source).
 */
export function wouldCreateCycle(
  placements: ScenePlacement[],
  sourceId: string,
  targetId: string,
): boolean {
  if (sourceId === targetId) return true;
  const descendants = getDescendantIds(placements, sourceId);
  return descendants.includes(targetId);
}
