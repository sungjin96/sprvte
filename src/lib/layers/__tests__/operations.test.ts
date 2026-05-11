import { describe, it, expect } from 'vitest';
import { LiveLayer, wouldCreateCycle, getDescendantIds } from '@/types/liveLayer';
import {
  reorderLayer,
  moveLayerTo,
  moveLayerToRoot,
  deleteLayer,
  renameLayer,
  toggleLayerField,
} from '../operations';
import { templateToMockLayers } from '../templates';

const L = (
  id: string,
  parentId: string | null,
  order: number,
  isGroup = false,
): LiveLayer => ({
  id, name: id, kind: isGroup ? 'group' : 'body', parentId, order,
  isGroup, visible: true, locked: false, status: 'idle',
});

const tree = (): LiveLayer[] => [
  L('root1', null, 0, true),
  L('a', 'root1', 0),
  L('b', 'root1', 1),
  L('c', 'root1', 2, true),
  L('c-1', 'c', 0),
  L('c-2', 'c', 1),
  L('root2', null, 1),
];

describe('getDescendantIds', () => {
  it('returns deep descendants of a group', () => {
    expect(getDescendantIds(tree(), 'root1').sort()).toEqual(['a', 'b', 'c', 'c-1', 'c-2'].sort());
  });
  it('returns empty for a leaf', () => {
    expect(getDescendantIds(tree(), 'a')).toEqual([]);
  });
});

describe('wouldCreateCycle', () => {
  it('detects identity', () => {
    expect(wouldCreateCycle(tree(), 'root1', 'root1')).toBe(true);
  });
  it('detects descendant', () => {
    expect(wouldCreateCycle(tree(), 'root1', 'c-1')).toBe(true);
    expect(wouldCreateCycle(tree(), 'c', 'c-1')).toBe(true);
  });
  it('allows unrelated', () => {
    expect(wouldCreateCycle(tree(), 'a', 'root2')).toBe(false);
    expect(wouldCreateCycle(tree(), 'c', 'root2')).toBe(false);
  });
});

describe('reorderLayer', () => {
  it('swaps with previous sibling on up', () => {
    const next = reorderLayer(tree(), 'b', 'up');
    const a = next.find((l) => l.id === 'a')!;
    const b = next.find((l) => l.id === 'b')!;
    expect(b.order).toBe(0);
    expect(a.order).toBe(1);
  });
  it('swaps with next sibling on down', () => {
    const next = reorderLayer(tree(), 'a', 'down');
    expect(next.find((l) => l.id === 'a')!.order).toBe(1);
    expect(next.find((l) => l.id === 'b')!.order).toBe(0);
  });
  it('no-ops at boundaries', () => {
    expect(reorderLayer(tree(), 'a', 'up')).toEqual(tree());
  });
});

describe('moveLayerTo', () => {
  it('moves before target', () => {
    const next = moveLayerTo(tree(), 'a', 'c', 'before');
    const ordered = next
      .filter((l) => l.parentId === 'root1')
      .sort((x, y) => x.order - y.order)
      .map((l) => l.id);
    expect(ordered).toEqual(['b', 'a', 'c']);
  });
  it('moves after target', () => {
    const next = moveLayerTo(tree(), 'a', 'c', 'after');
    const ordered = next
      .filter((l) => l.parentId === 'root1')
      .sort((x, y) => x.order - y.order)
      .map((l) => l.id);
    expect(ordered).toEqual(['b', 'c', 'a']);
  });
  it('moves inside (becomes last child)', () => {
    const next = moveLayerTo(tree(), 'a', 'c', 'inside');
    const a = next.find((l) => l.id === 'a')!;
    expect(a.parentId).toBe('c');
    expect(a.order).toBe(2);
  });
  it('refuses cycle (parent into descendant)', () => {
    const next = moveLayerTo(tree(), 'root1', 'c-1', 'inside');
    expect(next).toEqual(tree());
  });
  it('refuses self-target', () => {
    expect(moveLayerTo(tree(), 'a', 'a', 'after')).toEqual(tree());
  });
  it('reindexes former parent siblings after move', () => {
    const next = moveLayerTo(tree(), 'b', 'root2', 'after');
    const root1Children = next
      .filter((l) => l.parentId === 'root1')
      .sort((x, y) => x.order - y.order)
      .map((l) => `${l.id}:${l.order}`);
    expect(root1Children).toEqual(['a:0', 'c:1']);
  });
});

describe('moveLayerToRoot', () => {
  it('promotes a nested layer to root', () => {
    const next = moveLayerToRoot(tree(), 'c-1');
    const c1 = next.find((l) => l.id === 'c-1')!;
    expect(c1.parentId).toBeNull();
    expect(c1.order).toBe(2); // appended after root1 (0), root2 (1)
  });
  it('no-ops on already-root layer', () => {
    expect(moveLayerToRoot(tree(), 'root2')).toEqual(tree());
  });
});

describe('deleteLayer', () => {
  it('cascades to all descendants', () => {
    const { layers, removedIds } = deleteLayer(tree(), 'c');
    expect(removedIds.sort()).toEqual(['c', 'c-1', 'c-2'].sort());
    expect(layers.find((l) => l.id === 'c-1')).toBeUndefined();
  });
  it('reindexes siblings after delete', () => {
    const { layers } = deleteLayer(tree(), 'a');
    const root1Children = layers
      .filter((l) => l.parentId === 'root1')
      .sort((x, y) => x.order - y.order)
      .map((l) => `${l.id}:${l.order}`);
    expect(root1Children).toEqual(['b:0', 'c:1']);
  });
  it('returns empty removedIds for unknown id', () => {
    const { layers, removedIds } = deleteLayer(tree(), 'xxx');
    expect(layers).toEqual(tree());
    expect(removedIds).toEqual([]);
  });
});

describe('renameLayer', () => {
  it('renames a layer', () => {
    const next = renameLayer(tree(), 'a', 'New Name');
    expect(next.find((l) => l.id === 'a')!.name).toBe('New Name');
  });
  it('ignores empty/whitespace', () => {
    expect(renameLayer(tree(), 'a', '   ')).toEqual(tree());
  });
});

describe('toggleLayerField', () => {
  it('toggles visible', () => {
    const next = toggleLayerField(tree(), 'a', 'visible');
    expect(next.find((l) => l.id === 'a')!.visible).toBe(false);
  });
  it('toggles locked', () => {
    const next = toggleLayerField(tree(), 'a', 'locked');
    expect(next.find((l) => l.id === 'a')!.locked).toBe(true);
  });
  it('toggles expanded with default fallback', () => {
    const next = toggleLayerField(tree(), 'root1', 'expanded');
    expect(next.find((l) => l.id === 'root1')!.expanded).toBe(false);
  });
});

describe('templateToMockLayers', () => {
  it('produces a tree for character', () => {
    const layers = templateToMockLayers('character');
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.some((l) => l.parentId === null)).toBe(true);
  });
  it('produces a flat tree for map', () => {
    const layers = templateToMockLayers('map');
    expect(layers.every((l) => l.parentId === null)).toBe(true);
    expect(layers.length).toBeGreaterThanOrEqual(3);
  });
  it.each(['character', 'map', 'item', 'ui', 'effect'] as const)(
    'has at least one layer for %s',
    (cat) => {
      expect(templateToMockLayers(cat).length).toBeGreaterThan(0);
    },
  );
  it('groups have no thumbUrl/imageUrl', () => {
    const layers = templateToMockLayers('character');
    const groups = layers.filter((l) => l.isGroup);
    expect(groups.every((g) => !g.thumbUrl && !g.imageUrl)).toBe(true);
  });
});
