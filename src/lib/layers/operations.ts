import { LiveLayer, getDescendantIds, wouldCreateCycle } from '@/types/liveLayer';

export type DropPosition = 'before' | 'after' | 'inside';

/**
 * Pure operations on a flat LiveLayer[] tree. Each returns a new array
 * (no mutation). Callers replace state with the result.
 *
 * Invariants preserved:
 *   - `order` is unique within siblings (0..N-1, contiguous)
 *   - No cycles (parent never inside its own subtree)
 */

function reindexSiblings(layers: LiveLayer[], parentId: string | null): LiveLayer[] {
  // Re-number `order` for siblings of given parent so they are 0..N-1.
  const siblings = layers
    .filter((l) => l.parentId === parentId)
    .sort((a, b) => a.order - b.order);
  const idToOrder = new Map<string, number>();
  siblings.forEach((s, i) => idToOrder.set(s.id, i));
  return layers.map((l) => {
    const newOrder = idToOrder.get(l.id);
    return newOrder !== undefined ? { ...l, order: newOrder } : l;
  });
}

/** Reorder a layer up/down within its current parent. */
export function reorderLayer(
  layers: LiveLayer[],
  id: string,
  direction: 'up' | 'down',
): LiveLayer[] {
  const layer = layers.find((l) => l.id === id);
  if (!layer) return layers;
  const siblings = layers
    .filter((l) => l.parentId === layer.parentId)
    .sort((a, b) => a.order - b.order);
  const idx = siblings.findIndex((l) => l.id === id);
  const target = direction === 'up' ? idx - 1 : idx + 1;
  if (target < 0 || target >= siblings.length) return layers;

  const swappedOrder = new Map<string, number>();
  swappedOrder.set(siblings[idx].id, siblings[target].order);
  swappedOrder.set(siblings[target].id, siblings[idx].order);
  return layers.map((l) => {
    const o = swappedOrder.get(l.id);
    return o !== undefined ? { ...l, order: o } : l;
  });
}

/**
 * Drop `sourceId` at `position` relative to `targetId`.
 * - 'before' / 'after': makes source a sibling of target
 * - 'inside': makes source a child of target (target becomes a parent)
 *
 * Refuses to create cycles (returns input unchanged).
 */
export function moveLayerTo(
  layers: LiveLayer[],
  sourceId: string,
  targetId: string,
  position: DropPosition,
): LiveLayer[] {
  if (sourceId === targetId) return layers;
  if (wouldCreateCycle(layers, sourceId, targetId)) return layers;

  const source = layers.find((l) => l.id === sourceId);
  const target = layers.find((l) => l.id === targetId);
  if (!source || !target) return layers;

  const newParentId = position === 'inside' ? target.id : target.parentId;

  // Compute new order for the source.
  let next: LiveLayer[];
  if (position === 'inside') {
    // Append at end of target's children.
    const childrenCount = layers.filter((l) => l.parentId === target.id && l.id !== sourceId).length;
    next = layers.map((l) =>
      l.id === sourceId ? { ...l, parentId: newParentId, order: childrenCount } : l,
    );
  } else {
    // Insert before/after target among target's siblings.
    const siblings = layers
      .filter((l) => l.parentId === target.parentId && l.id !== sourceId)
      .sort((a, b) => a.order - b.order);
    const targetIdx = siblings.findIndex((l) => l.id === targetId);
    const insertAt = position === 'before' ? targetIdx : targetIdx + 1;
    const newOrders = new Map<string, number>();
    siblings.forEach((s, i) => {
      const shifted = i >= insertAt ? i + 1 : i;
      newOrders.set(s.id, shifted);
    });
    newOrders.set(sourceId, insertAt);
    next = layers.map((l) => {
      const o = newOrders.get(l.id);
      if (l.id === sourceId) return { ...l, parentId: newParentId, order: o ?? 0 };
      return o !== undefined ? { ...l, order: o } : l;
    });
  }

  // Re-index former parent's siblings to keep contiguous orders.
  next = reindexSiblings(next, source.parentId);
  // Also re-index new parent siblings (handles edge cases).
  next = reindexSiblings(next, newParentId);
  return next;
}

/** Move `id` to root level (parentId = null), appended to end. */
export function moveLayerToRoot(layers: LiveLayer[], id: string): LiveLayer[] {
  const layer = layers.find((l) => l.id === id);
  if (!layer || layer.parentId === null) return layers;
  const rootCount = layers.filter((l) => l.parentId === null).length;
  let next = layers.map((l) =>
    l.id === id ? { ...l, parentId: null, order: rootCount } : l,
  );
  next = reindexSiblings(next, layer.parentId);
  return next;
}

/**
 * Delete a layer and (cascade) all its descendants.
 * Returns { layers, removedIds } so callers can clear selection / show toast.
 */
export function deleteLayer(
  layers: LiveLayer[],
  id: string,
): { layers: LiveLayer[]; removedIds: string[] } {
  const target = layers.find((l) => l.id === id);
  if (!target) return { layers, removedIds: [] };
  const descendants = getDescendantIds(layers, id);
  const removedIds = [id, ...descendants];
  const removed = new Set(removedIds);
  let next = layers.filter((l) => !removed.has(l.id));
  next = reindexSiblings(next, target.parentId);
  return { layers: next, removedIds };
}

/** Rename a layer. Empty/whitespace ignored. */
export function renameLayer(layers: LiveLayer[], id: string, name: string): LiveLayer[] {
  const trimmed = name.trim();
  if (!trimmed) return layers;
  return layers.map((l) => (l.id === id ? { ...l, name: trimmed } : l));
}

/** Toggle a boolean field on a single layer. */
export function toggleLayerField(
  layers: LiveLayer[],
  id: string,
  field: 'visible' | 'locked' | 'expanded',
): LiveLayer[] {
  return layers.map((l) => {
    if (l.id !== id) return l;
    if (field === 'expanded') return { ...l, expanded: !(l.expanded ?? true) };
    return { ...l, [field]: !l[field] };
  });
}
