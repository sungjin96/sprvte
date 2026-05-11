'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ScenePlacement } from '@/components/scene/SceneStage';
import {
  buildPlacementTree,
  getDescendantIds,
  wouldCreateCycle,
} from '@/types/scenePlacement';
import type { DropPosition } from '@/components/scene/ScenePlacementsPanel';

const SceneStage = dynamic(() => import('@/components/scene/SceneStage').then((m) => m.SceneStage), { ssr: false });
import { ScenePlacementsPanel } from '@/components/scene/ScenePlacementsPanel';
import { ResizableSplit } from '@/components/layout/ResizableSplit';
import { ContextMenu, type ContextMenuItem } from '@/components/ui/ContextMenu';

// ── Mock asset library ────────────────────────────────────────────────────────
type LibCategory = 'all' | 'character' | 'item' | 'background' | 'ui' | 'sound';

interface LibAsset {
  id: string;
  category: Exclude<LibCategory, 'all'>;
  name: string;
  imageUrl: string;
}

const MOCK_LIBRARY: LibAsset[] = [
  { id: 'a-alice',   category: 'character',  name: 'Alice',      imageUrl: 'https://picsum.photos/seed/alice/200/200' },
  { id: 'a-bob',     category: 'character',  name: 'Bob',        imageUrl: 'https://picsum.photos/seed/bob/200/200' },
  { id: 'a-mage',    category: 'character',  name: 'Mage',       imageUrl: 'https://picsum.photos/seed/mage/200/200' },
  { id: 'a-sword',   category: 'item',       name: 'Sword',      imageUrl: 'https://picsum.photos/seed/sword/200/200' },
  { id: 'a-shield',  category: 'item',       name: 'Shield',     imageUrl: 'https://picsum.photos/seed/shield/200/200' },
  { id: 'a-potion',  category: 'item',       name: 'Potion',     imageUrl: 'https://picsum.photos/seed/potion/200/200' },
  { id: 'a-forest',  category: 'background', name: 'Forest',     imageUrl: 'https://picsum.photos/seed/forest/600/400' },
  { id: 'a-castle',  category: 'background', name: 'Castle',     imageUrl: 'https://picsum.photos/seed/castle/600/400' },
  { id: 'a-hpbar',   category: 'ui',         name: 'HP Bar',     imageUrl: 'https://picsum.photos/seed/hpbar/300/40' },
  { id: 'a-menu',    category: 'ui',         name: 'Menu',       imageUrl: 'https://picsum.photos/seed/menu/200/300' },
];

const MOCK_BGM_OPTIONS = [
  { id: 'bgm-battle', name: 'battle_theme' },
  { id: 'bgm-village', name: 'village_calm' },
  { id: 'bgm-boss', name: 'boss_intro' },
];

const SCENE_W = 1920;
const SCENE_H = 1080;

// Initial mock placements (flat tree, all root-level)
const INITIAL_PLACEMENTS: ScenePlacement[] = [
  { id: 'p-1', assetId: 'a-forest', imageUrl: 'https://picsum.photos/seed/forest/600/400', parentId: null, isGroup: false, x: 960, y: 540, scale: 320, rotation: 0, flipX: false, flipY: false, zOrder: 0, visible: true },
  { id: 'p-2', assetId: 'a-alice',  imageUrl: 'https://picsum.photos/seed/alice/200/200',  parentId: null, isGroup: false, x: 760, y: 700, scale: 100, rotation: 0, flipX: false, flipY: false, zOrder: 1, visible: true },
  { id: 'p-3', assetId: 'a-sword',  imageUrl: 'https://picsum.photos/seed/sword/200/200',  parentId: null, isGroup: false, x: 870, y: 700, scale: 60,  rotation: 25, flipX: false, flipY: false, zOrder: 2, visible: true },
  { id: 'p-4', assetId: 'a-hpbar',  imageUrl: 'https://picsum.photos/seed/hpbar/300/40',   parentId: null, isGroup: false, x: 200, y: 60,  scale: 100, rotation: 0, flipX: false, flipY: false, zOrder: 3, visible: true },
];

interface PageProps {
  params: Promise<{ locale: string; projectId: string; sceneId: string }>;
}

export default function SceneEditorPage({ params }: PageProps) {
  const { locale, projectId, sceneId } = use(params);
  const t = useTranslations('scenes');
  const [name, setName] = useState('보스전');
  const [placements, setPlacements] = useState<ScenePlacement[]>(INITIAL_PLACEMENTS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [libFilter, setLibFilter] = useState<LibCategory>('all');
  const [search, setSearch] = useState('');
  const [bgColor, setBgColor] = useState('#000000');
  const [bgmId, setBgmId] = useState<string | null>('bgm-battle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);

  // Stage container size tracking
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const [stageBox, setStageBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageContainerRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setStageBox({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Single primary selection for inspector (last in selectedIds)
  const selectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selected = useMemo(
    () => placements.find((p) => p.id === selectedId) ?? null,
    [placements, selectedId],
  );
  const multiSelected = selectedIds.length > 1;
  // True if exactly one group is selected (single selection on isGroup placement)
  const selectedGroupId = useMemo(() => {
    if (selectedIds.length !== 1) return null;
    const p = placements.find((pp) => pp.id === selectedIds[0]);
    return p?.isGroup ? p.id : null;
  }, [placements, selectedIds]);

  const filteredLib = useMemo(() => {
    let list = MOCK_LIBRARY;
    if (libFilter !== 'all') list = list.filter((a) => a.category === libFilter);
    if (search) list = list.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [libFilter, search]);

  const handlePlaceAsset = (asset: LibAsset) => {
    const rootSiblings = placements.filter((p) => p.parentId === null);
    const newP: ScenePlacement = {
      id: `p-${Date.now()}`,
      assetId: asset.id,
      imageUrl: asset.imageUrl,
      parentId: null,
      isGroup: false,
      x: SCENE_W / 2,
      y: SCENE_H / 2,
      scale: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      zOrder: rootSiblings.length,
      visible: true,
    };
    setPlacements((prev) => [...prev, newP]);
    setSelectedIds([newP.id]);
  };

  const updatePlacement = (id: string, attrs: Partial<ScenePlacement>) => {
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, ...attrs } : p)));
  };

  const duplicateSelected = () => {
    if (selectedIds.length === 0) return;
    const newPs: ScenePlacement[] = [];
    selectedIds.forEach((sid, i) => {
      const src = placements.find((p) => p.id === sid);
      if (!src) return;
      const siblings = placements.filter((p) => p.parentId === src.parentId);
      newPs.push({
        ...src,
        id: `p-${Date.now()}-${i}`,
        x: src.x + 40,
        y: src.y + 40,
        zOrder: siblings.length + i,
      });
    });
    setPlacements((prev) => [...prev, ...newPs]);
    setSelectedIds(newPs.map((p) => p.id));
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    // Also delete all descendants of selected
    const allToDelete = new Set<string>();
    for (const sid of selectedIds) {
      allToDelete.add(sid);
      for (const did of getDescendantIds(placements, sid)) allToDelete.add(did);
    }
    setPlacements((prev) => prev.filter((p) => !allToDelete.has(p.id)));
    setSelectedIds([]);
  };

  const bringFront = () => {
    if (selectedIds.length === 0) return;
    setPlacements((prev) => {
      const next = [...prev];
      for (const sid of selectedIds) {
        const target = next.find((p) => p.id === sid);
        if (!target) continue;
        const siblings = next.filter((p) => p.parentId === target.parentId);
        const max = Math.max(...siblings.map((p) => p.zOrder));
        target.zOrder = max + 1;
      }
      return next;
    });
  };

  const sendBack = () => {
    if (selectedIds.length === 0) return;
    setPlacements((prev) => {
      const next = [...prev];
      for (const sid of selectedIds) {
        const target = next.find((p) => p.id === sid);
        if (!target) continue;
        const siblings = next.filter((p) => p.parentId === target.parentId);
        const min = Math.min(...siblings.map((p) => p.zOrder));
        target.zOrder = min - 1;
      }
      return next;
    });
  };

  /**
   * Group selected placements into a NEW group (isGroup=true container).
   * The group becomes a sibling of the selected items' first parent;
   * selected items become children of the group.
   */
  const groupSelected = () => {
    if (selectedIds.length < 2) return;
    const first = placements.find((p) => p.id === selectedIds[0]);
    if (!first) return;
    const parentId = first.parentId;
    const siblings = placements.filter((p) => p.parentId === parentId);
    const groupId = `g-${Date.now()}`;
    const groupZ = Math.max(...siblings.map((p) => p.zOrder)) + 1;

    // Compute group center as average of members
    const members = placements.filter((p) => selectedIds.includes(p.id));
    const cx = members.reduce((s, m) => s + m.x, 0) / members.length;
    const cy = members.reduce((s, m) => s + m.y, 0) / members.length;

    const newGroup: ScenePlacement = {
      id: groupId,
      assetId: 'group',
      imageUrl: '',
      name: `그룹 ${placements.filter((p) => p.isGroup).length + 1}`,
      parentId,
      isGroup: true,
      expanded: true,
      x: cx,
      y: cy,
      scale: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      zOrder: groupZ,
      visible: true,
    };

    // Reparent selected to the new group; renumber their zOrder 0..N
    setPlacements((prev) => {
      const next = [...prev, newGroup];
      let i = 0;
      return next.map((p) => {
        if (selectedIds.includes(p.id)) {
          return { ...p, parentId: groupId, zOrder: i++ };
        }
        return p;
      });
    });
    setSelectedIds([groupId]);
  };

  /**
   * Ungroup: move group's children up to the group's parent, then delete the group.
   * Children retain their absolute positions.
   */
  const ungroupSelected = () => {
    if (!selectedGroupId) return;
    const group = placements.find((p) => p.id === selectedGroupId);
    if (!group) return;
    const children = placements.filter((p) => p.parentId === group.id);
    const newParent = group.parentId;
    const newSiblings = placements.filter((p) => p.parentId === newParent && p.id !== group.id);
    const baseZ = newSiblings.length > 0 ? Math.max(...newSiblings.map((p) => p.zOrder)) + 1 : 0;

    setPlacements((prev) => {
      const filtered = prev.filter((p) => p.id !== group.id);
      let i = 0;
      return filtered.map((p) => {
        if (p.parentId === group.id) {
          return { ...p, parentId: newParent, zOrder: baseZ + i++ };
        }
        return p;
      });
    });
    setSelectedIds(children.map((c) => c.id));
  };

  // Right-click context menu state
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; placementId: string | null } | null>(null);

  /**
   * 3-zone drop:
   *   - 'before' / 'after': sibling reorder (same parent as target)
   *   - 'inside': make source a child of target (parent-child nesting)
   *
   * Cycle prevention: cannot drop a placement onto its own descendant.
   */
  const movePlacementTo = (sourceId: string, targetId: string, position: DropPosition) => {
    if (sourceId === targetId) return;
    if (wouldCreateCycle(placements, sourceId, targetId)) return;

    setPlacements((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      const target = prev.find((p) => p.id === targetId);
      if (!source || !target) return prev;

      let newParentId: string | null;
      let newZOrder: number;

      if (position === 'inside') {
        // Become child of target (top of children stack)
        newParentId = target.id;
        const targetChildren = prev.filter((p) => p.parentId === target.id);
        newZOrder = targetChildren.length > 0
          ? Math.max(...targetChildren.map((p) => p.zOrder)) + 1
          : 0;
      } else {
        // Sibling of target
        newParentId = target.parentId;
        newZOrder = target.zOrder + (position === 'before' ? 1 : -0.5);
      }

      // Apply, then renumber siblings under newParentId to clean integers
      const nextPlacements = prev.map((p) =>
        p.id === sourceId ? { ...p, parentId: newParentId, zOrder: newZOrder } : p,
      );
      const siblings = nextPlacements.filter((p) => p.parentId === newParentId);
      siblings.sort((a, b) => a.zOrder - b.zOrder);
      const idToZ = new Map<string, number>();
      siblings.forEach((p, i) => idToZ.set(p.id, i));
      return nextPlacements.map((p) =>
        idToZ.has(p.id) ? { ...p, zOrder: idToZ.get(p.id)! } : p,
      );
    });
  };

  /** Move target to root (drop on empty area). */
  const movePlacementToRoot = (sourceId: string) => {
    setPlacements((prev) => {
      const source = prev.find((p) => p.id === sourceId);
      if (!source || source.parentId === null) return prev;
      const rootSiblings = prev.filter((p) => p.parentId === null);
      const maxZ = rootSiblings.length > 0 ? Math.max(...rootSiblings.map((p) => p.zOrder)) : 0;
      return prev.map((p) =>
        p.id === sourceId ? { ...p, parentId: null, zOrder: maxZ + 1 } : p,
      );
    });
  };

  /**
   * Swap zOrder with the sibling immediately above (front) or below (back).
   * Operates only within the same parent's children.
   */
  const reorderPlacement = (id: string, direction: 'up' | 'down') => {
    setPlacements((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      const siblings = prev.filter((p) => p.parentId === target.parentId).sort((a, b) => a.zOrder - b.zOrder);
      const idx = siblings.findIndex((p) => p.id === id);
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const a = siblings[idx];
      const b = siblings[swapIdx];
      return prev.map((p) => {
        if (p.id === a.id) return { ...p, zOrder: b.zOrder };
        if (p.id === b.id) return { ...p, zOrder: a.zOrder };
        return p;
      });
    });
  };

  /**
   * Cascade move: apply (dx,dy) to placement AND all its descendants in one
   * batch update. Used when dragging a parent in the stage — all attached
   * children move together.
   */
  const cascadeMove = (rootId: string, dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return;
    setPlacements((prev) => {
      const ids = new Set<string>([rootId, ...getDescendantIds(prev, rootId)]);
      return prev.map((p) =>
        ids.has(p.id) ? { ...p, x: p.x + dx, y: p.y + dy } : p,
      );
    });
  };

  /** Inline rename. */
  const renamePlacement = (id: string, newName: string) => {
    setPlacements((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  };

  /** Create an empty group at the root level. */
  const createEmptyGroup = () => {
    const rootSiblings = placements.filter((p) => p.parentId === null);
    const groupId = `g-${Date.now()}`;
    const newGroup: ScenePlacement = {
      id: groupId,
      assetId: 'group',
      imageUrl: '',
      name: `그룹 ${placements.filter((p) => p.isGroup).length + 1}`,
      parentId: null,
      isGroup: true,
      expanded: true,
      x: SCENE_W / 2,
      y: SCENE_H / 2,
      scale: 100,
      rotation: 0,
      flipX: false,
      flipY: false,
      zOrder: rootSiblings.length,
      visible: true,
    };
    setPlacements((prev) => [...prev, newGroup]);
    setSelectedIds([groupId]);
  };

  const tabs: { key: LibCategory; label: string }[] = [
    { key: 'all',        label: t('library.tabAll') },
    { key: 'character',  label: t('library.tabCharacter') },
    { key: 'item',       label: t('library.tabItem') },
    { key: 'background', label: t('library.tabBackground') },
    { key: 'ui',         label: t('library.tabUi') },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-3 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%] flex items-center gap-4"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <Link
          href={`/${locale}/projects/${projectId}/scenes`}
          className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-[15px] font-semibold text-[var(--text)] outline-none border-b border-transparent focus:border-[var(--neon)] py-0.5"
        />
        <span className="font-mono text-[11px] text-[var(--text-3)]">{SCENE_W}×{SCENE_H}</span>

        <div className="ml-auto flex items-center gap-2">
          {/* Snap toggle */}
          <button
            type="button"
            onClick={() => setSnapEnabled((s) => !s)}
            title="스마트 가이드 (스냅)"
            className={cn(
              'px-2.5 py-1.5 rounded-[8px] text-[11px] font-mono uppercase tracking-[0.04em] border transition-all duration-[120ms]',
              snapEnabled
                ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.3)]'
                : 'bg-[var(--g1)] text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
            )}
          >
            ⊹ snap
          </button>

          {/* Group / Ungroup */}
          {selectedIds.length >= 2 && !selectedGroupId && (
            <button
              type="button"
              onClick={groupSelected}
              className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-mono text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
            >
              ⊞ 그룹화
            </button>
          )}
          {selectedGroupId && (
            <button
              type="button"
              onClick={ungroupSelected}
              className="px-2.5 py-1.5 rounded-[8px] text-[11px] font-mono text-[var(--neon)] bg-[var(--neon-dim)] border border-[rgba(0,229,160,0.3)] hover:brightness-110 transition-all duration-[120ms]"
            >
              ⊟ 그룹 해제
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={cn(
              'px-3 py-1.5 rounded-[8px] text-[12px] font-mono transition-all duration-[120ms]',
              isPlaying
                ? 'bg-[var(--neon-dim)] text-[var(--neon)] border border-[rgba(0,229,160,0.3)]'
                : 'text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)]',
            )}
          >
            {isPlaying ? `⏸ ${t('pause')}` : `▶ ${t('play')}`}
          </button>
          <div className="relative group">
            <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]">
              ↓ Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-[180px] rounded-[10px] border border-[var(--border-hi)] bg-[rgba(12,12,18,0.97)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-[120ms]">
              {[t('exportPng'), t('exportJson'), t('exportAtlas')].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-[12px] text-[var(--text-2)] hover:bg-[var(--g1)] hover:text-[var(--text)] transition-colors duration-[100ms]"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body 3-pane (resizable): Library | Stage | RightPane */}
      <ResizableSplit
        orientation="horizontal"
        initialFirstSize={260}
        minFirst={180}
        maxFirst={400}
        storageKey="sprvte:scene:lib-width"
      >
        {/* Library */}
        <aside className="border-r border-[var(--border)] bg-[var(--g1)] flex flex-col overflow-hidden h-full">
          <div className="p-3 border-b border-[var(--border)]">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
              {t('library.title')}
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('library.search')}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[12px] text-[var(--text)] px-2.5 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)] mb-2 placeholder:text-[var(--text-3)]"
            />
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setLibFilter(tab.key)}
                  className={cn(
                    'px-2 py-0.5 rounded-[6px] text-[10px] font-mono uppercase tracking-[0.04em] border transition-all duration-[100ms]',
                    libFilter === tab.key
                      ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                      : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 gap-2">
              {filteredLib.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handlePlaceAsset(a)}
                  className="group rounded-[8px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden hover:border-[rgba(0,229,160,0.25)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[120ms] cursor-pointer"
                  title={t('library.drag')}
                >
                  <div className="aspect-square bg-[var(--g1)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[160ms]" />
                  </div>
                  <p className="px-2 py-1 text-[11px] text-[var(--text-2)] truncate">{a.name}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right side: Stage | RightPane (resizable) */}
        <ResizableSplit
          orientation="horizontal"
          initialFirstSize={Math.max(400, (typeof window !== 'undefined' ? window.innerWidth : 1400) - 600)}
          minFirst={300}
          maxFirst={2400}
          storageKey="sprvte:scene:stage-width"
        >
        {/* Stage */}
        <div className="flex flex-col overflow-hidden h-full">
          <div
            ref={stageContainerRef}
            className="flex-1 relative"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            {stageBox.w > 0 && stageBox.h > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <SceneStage
                  width={SCENE_W}
                  height={SCENE_H}
                  placements={placements}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onChange={updatePlacement}
                  onCascadeMove={cascadeMove}
                  background={bgColor}
                  displayWidth={stageBox.w}
                  displayHeight={stageBox.h}
                  snapEnabled={snapEnabled}
                  onContextMenu={(info) => {
                    setCtxMenu({ x: info.clientX, y: info.clientY, placementId: info.placementId });
                  }}
                />
              </div>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 rounded-[6px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-2)]">
              {placements.length} placements
            </div>
          </div>

          {/* Stage settings (background + bgm) */}
          <div className="border-t border-[var(--border)] bg-[var(--g1)] px-4 py-2 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">{t('stage.background')}</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-7 h-7 rounded-[6px] border border-[var(--border-hi)] cursor-pointer bg-transparent p-0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">{t('stage.bgm')}</span>
              <select
                value={bgmId ?? ''}
                onChange={(e) => setBgmId(e.target.value || null)}
                className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[6px] text-[11px] font-mono text-[var(--text-2)] px-2 py-1 outline-none focus:border-[rgba(0,229,160,0.3)]"
              >
                <option value="">{t('stage.noBgm')}</option>
                {MOCK_BGM_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right pane: Layers panel | Inspector (vertical resizable) */}
        <aside className="border-l border-[var(--border)] bg-[var(--g1)] flex flex-col overflow-hidden h-full">
          <ResizableSplit
            orientation="vertical"
            initialFirstSize={280}
            minFirst={120}
            maxFirst={600}
            storageKey="sprvte:scene:layers-height"
          >
            {/* Layers panel — top */}
            <ScenePlacementsPanel
              placements={placements}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onChange={updatePlacement}
              onReorder={reorderPlacement}
              onMoveTo={movePlacementTo}
              onMoveToRoot={movePlacementToRoot}
              onRename={renamePlacement}
              onContextMenu={(info) => {
                if (!selectedIds.includes(info.placementId)) {
                  setSelectedIds([info.placementId]);
                }
                setCtxMenu({ x: info.clientX, y: info.clientY, placementId: info.placementId });
              }}
            />

            {/* Inspector — bottom, scrollable */}
            <div className="flex flex-col overflow-y-auto h-full">
              <div className="p-3 border-b border-[var(--border)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
                  {t('inspector.title')}
                </p>
              </div>

          {!selected ? (
            <div className="p-6 text-center">
              <p className="text-[12px] text-[var(--text-3)]">{t('inspector.noSelection')}</p>
            </div>
          ) : multiSelected ? (
            <div className="p-6 text-center space-y-3">
              <p className="text-[13px] text-[var(--text)]">
                {selectedIds.length}개 선택됨{selectedGroupId ? ' (그룹)' : ''}
              </p>
              <p className="text-[11px] text-[var(--text-3)] leading-relaxed">
                다중 선택은 캔버스에서 함께 이동/크기조절/회전됩니다.<br />
                개별 속성은 단일 선택해야 편집할 수 있어요.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={duplicateSelected}
                  className="px-2 py-1.5 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g2)] border border-[var(--border)] hover:bg-[var(--g3)] hover:text-[var(--text)] transition-all duration-[100ms]"
                >
                  {t('inspector.duplicate')}
                </button>
                <button
                  type="button"
                  onClick={deleteSelected}
                  className="px-2 py-1.5 rounded-[6px] text-[11px] text-[rgba(255,100,100,0.95)] bg-[rgba(255,60,60,0.06)] border border-[rgba(255,60,60,0.2)] hover:bg-[rgba(255,60,60,0.1)] transition-all duration-[100ms]"
                >
                  {t('inspector.delete')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {/* Transform */}
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                  {t('inspector.transform')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-[12px]">
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-[var(--text-3)]">{t('inspector.x')}</span>
                    <input
                      type="number"
                      value={selected.x}
                      onChange={(e) => updatePlacement(selected.id, { x: Number(e.target.value) })}
                      className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[6px] font-mono text-[12px] text-[var(--text)] px-2 py-1 outline-none focus:border-[rgba(0,229,160,0.3)]"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-[var(--text-3)]">{t('inspector.y')}</span>
                    <input
                      type="number"
                      value={selected.y}
                      onChange={(e) => updatePlacement(selected.id, { y: Number(e.target.value) })}
                      className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[6px] font-mono text-[12px] text-[var(--text)] px-2 py-1 outline-none focus:border-[rgba(0,229,160,0.3)]"
                    />
                  </label>
                </div>

                <div className="mt-3">
                  <span className="font-mono text-[10px] text-[var(--text-3)] block mb-1">
                    {t('inspector.scale')}: {selected.scale}%
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    value={selected.scale}
                    onChange={(e) => updatePlacement(selected.id, { scale: Number(e.target.value) })}
                    className="w-full accent-[var(--neon)]"
                  />
                </div>

                <div className="mt-3">
                  <span className="font-mono text-[10px] text-[var(--text-3)] block mb-1">
                    {t('inspector.rotation')}: {selected.rotation}°
                  </span>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    value={selected.rotation}
                    onChange={(e) => updatePlacement(selected.id, { rotation: Number(e.target.value) })}
                    className="w-full accent-[var(--neon)]"
                  />
                </div>

                <div className="mt-3 flex gap-1">
                  <button
                    type="button"
                    onClick={() => updatePlacement(selected.id, { flipX: !selected.flipX })}
                    className={cn(
                      'flex-1 px-2 py-1.5 rounded-[6px] text-[11px] font-mono border transition-all duration-[100ms]',
                      selected.flipX
                        ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                        : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                    )}
                  >
                    {t('inspector.flipH')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePlacement(selected.id, { flipY: !selected.flipY })}
                    className={cn(
                      'flex-1 px-2 py-1.5 rounded-[6px] text-[11px] font-mono border transition-all duration-[100ms]',
                      selected.flipY
                        ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                        : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                    )}
                  >
                    {t('inspector.flipV')}
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--text-3)]">
                    {t('inspector.zOrder')}
                  </span>
                  <span className="font-mono text-[12px] text-[var(--text-2)]">{selected.zOrder}</span>
                </div>

                <label className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-[0.08em]">
                    {t('inspector.visibility')}
                  </span>
                  <input
                    type="checkbox"
                    checked={selected.visible}
                    onChange={(e) => updatePlacement(selected.id, { visible: e.target.checked })}
                    className="accent-[var(--neon)] w-4 h-4"
                  />
                </label>
              </section>

              {/* Actions */}
              <section className="pt-3 border-t border-[var(--border)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                  {t('inspector.actions')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={duplicateSelected}
                    className="flex-1 min-w-[80px] px-2 py-1.5 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g2)] border border-[var(--border)] hover:bg-[var(--g3)] hover:text-[var(--text)] transition-all duration-[100ms]"
                  >
                    {t('inspector.duplicate')}
                  </button>
                  <button
                    type="button"
                    onClick={bringFront}
                    className="flex-1 min-w-[80px] px-2 py-1.5 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g2)] border border-[var(--border)] hover:bg-[var(--g3)] hover:text-[var(--text)] transition-all duration-[100ms]"
                  >
                    {t('inspector.bringFront')}
                  </button>
                  <button
                    type="button"
                    onClick={sendBack}
                    className="flex-1 min-w-[80px] px-2 py-1.5 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g2)] border border-[var(--border)] hover:bg-[var(--g3)] hover:text-[var(--text)] transition-all duration-[100ms]"
                  >
                    {t('inspector.sendBack')}
                  </button>
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="flex-1 min-w-[80px] px-2 py-1.5 rounded-[6px] text-[11px] text-[rgba(255,100,100,0.95)] bg-[rgba(255,60,60,0.06)] border border-[rgba(255,60,60,0.2)] hover:bg-[rgba(255,60,60,0.1)] transition-all duration-[100ms]"
                  >
                    {t('inspector.delete')}
                  </button>
                </div>
              </section>
            </div>
          )}
            </div>
          </ResizableSplit>
        </aside>
        </ResizableSplit>
      </ResizableSplit>

      {/* Right-click context menu */}
      <ContextMenu
        position={ctxMenu ? { x: ctxMenu.x, y: ctxMenu.y } : null}
        onClose={() => setCtxMenu(null)}
        items={buildCtxMenuItems()}
      />
    </div>
  );

  function buildCtxMenuItems(): ContextMenuItem[] {
    const hasTarget = ctxMenu?.placementId != null;
    const multiSel = selectedIds.length >= 2;
    const items: ContextMenuItem[] = [];
    if (hasTarget) {
      items.push(
        {
          label: t('inspector.bringFront'),
          shortcut: '⌘]',
          onClick: bringFront,
        },
        {
          label: t('inspector.sendBack'),
          shortcut: '⌘[',
          onClick: sendBack,
        },
        { kind: 'separator' },
        {
          label: t('inspector.duplicate'),
          shortcut: '⌘D',
          onClick: duplicateSelected,
        },
      );
      if (multiSel && !selectedGroupId) {
        items.push({ label: '⊞ 그룹화', shortcut: '⌘G', onClick: groupSelected });
      }
      if (selectedGroupId) {
        items.push({ label: '⊟ 그룹 해제', shortcut: '⇧⌘G', onClick: ungroupSelected });
      }
      items.push(
        { kind: 'separator' },
        {
          label: t('inspector.delete'),
          shortcut: 'Del',
          danger: true,
          onClick: deleteSelected,
        },
      );
    } else {
      items.push(
        { label: '⊞ 새 그룹 만들기', onClick: createEmptyGroup },
        { kind: 'separator' },
        { label: '여기에 붙여넣기', disabled: true, shortcut: '⌘V' },
      );
    }
    return items;
  }
}
