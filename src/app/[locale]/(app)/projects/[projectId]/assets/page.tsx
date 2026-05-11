'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Asset, AssetType } from '@/types/asset';
import { IMAGE_ASSET_TYPES, AUDIO_ASSET_TYPES } from '@/types/asset';

// ── Mock data until DB wired ──────────────────────────────────────────────────
const MOCK_ASSETS: (Asset & { entityName: string; entityCategory: string })[] = [
  {
    id: 'a1', projectId: 'proj-1', entityId: 'e1', name: 'Alice Walk',
    type: 'sprite_sheet', status: 'completed',
    fileUrl: null, createdAt: '2026-04-28T14:23:00Z', updatedAt: '2026-04-28T14:23:00Z',
    entityName: 'Warrior Alice', entityCategory: 'character',
  },
  {
    id: 'a2', projectId: 'proj-1', entityId: 'e2', name: 'Battle Theme',
    type: 'bgm', status: 'completed',
    fileUrl: null, createdAt: '2026-04-28T13:01:00Z', updatedAt: '2026-04-28T13:01:00Z',
    entityName: 'Battle BGM', entityCategory: 'audio',
  },
  {
    id: 'a3', projectId: 'proj-1', entityId: 'e3', name: 'Dark Forest Tileset',
    type: 'background', status: 'processing',
    fileUrl: null, createdAt: '2026-04-28T12:45:00Z', updatedAt: '2026-04-28T12:45:00Z',
    entityName: 'Dark Forest', entityCategory: 'map',
  },
  {
    id: 'a4', projectId: 'proj-1', entityId: 'e1', name: 'Alice Idle',
    type: 'character', status: 'completed',
    fileUrl: null, createdAt: '2026-04-27T22:15:00Z', updatedAt: '2026-04-27T22:15:00Z',
    entityName: 'Warrior Alice', entityCategory: 'character',
  },
  {
    id: 'a5', projectId: 'proj-1', entityId: 'e4', name: 'Flame Sword Icon',
    type: 'ui', status: 'completed',
    fileUrl: null, createdAt: '2026-04-27T19:33:00Z', updatedAt: '2026-04-27T19:33:00Z',
    entityName: 'Flame Sword', entityCategory: 'item',
  },
  {
    id: 'a6', projectId: 'proj-1', entityId: 'e1', name: 'Alice Attack',
    type: 'sprite_sheet', status: 'failed',
    fileUrl: null, errorMessage: 'Replicate API timeout',
    createdAt: '2026-04-27T16:00:00Z', updatedAt: '2026-04-27T16:00:00Z',
    entityName: 'Warrior Alice', entityCategory: 'character',
  },
];

type FilterType = 'all' | 'image' | 'audio' | 'sprite' | 'effect';
type ViewMode = 'grid' | 'list';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: {
    label: 'done',
    cls: 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
  },
  processing: {
    label: 'processing',
    cls: 'bg-[rgba(255,255,255,0.06)] text-[var(--text-3)] border-[var(--border)]',
  },
  pending: {
    label: 'queued',
    cls: 'bg-[rgba(255,255,255,0.06)] text-[var(--text-3)] border-[var(--border)]',
  },
  failed: {
    label: 'error',
    cls: 'bg-[rgba(255,60,60,0.10)] text-[rgba(255,100,100,0.9)] border-[rgba(255,60,60,0.2)]',
  },
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('assetsPage');
  const map = STATUS_MAP[status] ?? STATUS_MAP.processing;
  const label =
    status === 'completed' ? t('statusDone') :
    status === 'failed' ? t('statusFailed') :
    t('statusProcessing');
  return (
    <span
      className={cn(
        'absolute top-2 right-2 px-2 py-[2px] rounded-[4px] border',
        'font-mono text-[10px] font-medium uppercase tracking-[0.04em]',
        map.cls,
      )}
    >
      {label}
    </span>
  );
}

function ThumbnailFallback({ type }: { type: AssetType }) {
  if (AUDIO_ASSET_TYPES.includes(type)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.3)]">
        <svg viewBox="0 0 80 24" fill="none" className="w-3/5 h-12 text-[var(--text-3)]">
          {[5, 10, 16, 7, 12, 18, 14, 8, 11, 22, 17, 9, 13, 20, 6].map((h, i) => (
            <rect
              key={i}
              x={i * 5 + 2}
              y={(24 - h) / 2}
              width="3"
              height={h}
              rx="1"
              fill="currentColor"
              opacity="0.6"
            />
          ))}
        </svg>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.3)]">
      <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
        no preview
      </span>
    </div>
  );
}

function AssetActionButtons({
  asset,
  projectId,
  canEditLayers,
}: {
  asset: Asset;
  projectId: string;
  canEditLayers: boolean;
}) {
  const t = useTranslations('assetsPage');
  const isSprite = asset.type === 'sprite_sheet';
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]"
      onClick={stop}
    >
      {isSprite && (
        <Link
          href={`/projects/${projectId}/assets/${asset.id}/animation`}
          title={t('actionAnimation')}
          onClick={stop}
          className="w-7 h-7 rounded-[6px] bg-[rgba(0,0,0,0.65)] border border-[var(--neon)] backdrop-blur-[8px] text-[var(--neon)] hover:bg-[var(--neon-dim)] flex items-center justify-center transition-colors duration-[100ms]"
        >
          <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
            <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
          </svg>
        </Link>
      )}
      <button
        type="button"
        title={t('actionDownload')}
        onClick={stop}
        className="w-7 h-7 rounded-[6px] bg-[rgba(0,0,0,0.65)] border border-[var(--border-hi)] backdrop-blur-[8px] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors duration-[100ms]"
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
          <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {canEditLayers && !isSprite && (
        <Link
          href={`/projects/${projectId}/assets/${asset.id}/layers`}
          title={t('actionLayers')}
          onClick={stop}
          className="w-7 h-7 rounded-[6px] bg-[rgba(0,0,0,0.65)] border border-[var(--border-hi)] backdrop-blur-[8px] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center transition-colors duration-[100ms]"
        >
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
            <rect x="2" y="3" width="10" height="3" rx="1" />
            <rect x="2" y="7" width="10" height="3" rx="1" opacity="0.5" />
          </svg>
        </Link>
      )}
      <button
        type="button"
        title={t('actionDelete')}
        onClick={stop}
        className="w-7 h-7 rounded-[6px] bg-[rgba(0,0,0,0.65)] border border-[var(--border-hi)] backdrop-blur-[8px] text-[var(--text-3)] hover:text-[rgba(255,100,100,0.9)] hover:border-[rgba(255,60,60,0.3)] flex items-center justify-center transition-colors duration-[100ms]"
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
          <path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 8h5l.5-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function AnimationBadge() {
  return (
    <span className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[rgba(0,229,160,0.15)] border border-[var(--neon)] backdrop-blur-[4px] font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--neon)] pointer-events-none">
      <svg viewBox="0 0 8 8" fill="currentColor" className="w-2 h-2">
        <path d="M2 1l5 3-5 3V1z" />
      </svg>
      ANIM
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${hh}:${mm}`;
}

export default function AssetsPage() {
  const t = useTranslations('assetsPage');
  const tType = useTranslations('assetTypes');

  const [filter, setFilter] = useState<FilterType>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const filteredAssets = useMemo(() => {
    let list = MOCK_ASSETS;
    if (filter === 'image') list = list.filter((a) => IMAGE_ASSET_TYPES.includes(a.type) && a.type !== 'sprite_sheet' && a.type !== 'effect');
    else if (filter === 'audio') list = list.filter((a) => AUDIO_ASSET_TYPES.includes(a.type));
    else if (filter === 'sprite') list = list.filter((a) => a.type === 'sprite_sheet');
    else if (filter === 'effect') list = list.filter((a) => a.type === 'effect');

    if (entityFilter !== 'all') list = list.filter((a) => a.entityId === entityFilter);
    return list;
  }, [filter, entityFilter]);

  const counts = useMemo(() => {
    return {
      all: MOCK_ASSETS.length,
      image: MOCK_ASSETS.filter((a) => ['character', 'background', 'ui'].includes(a.type)).length,
      audio: MOCK_ASSETS.filter((a) => AUDIO_ASSET_TYPES.includes(a.type)).length,
      sprite: MOCK_ASSETS.filter((a) => a.type === 'sprite_sheet').length,
      effect: MOCK_ASSETS.filter((a) => a.type === 'effect').length,
    };
  }, []);

  const uniqueEntities = useMemo(() => {
    const map = new Map<string, string>();
    MOCK_ASSETS.forEach((a) => {
      if (a.entityId) map.set(a.entityId, a.entityName);
    });
    return Array.from(map.entries());
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: t('tabAll'), count: counts.all },
    { value: 'image', label: t('tabImage'), count: counts.image },
    { value: 'audio', label: t('tabAudio'), count: counts.audio },
    { value: 'sprite', label: t('tabSprite'), count: counts.sprite },
    { value: 'effect', label: t('tabEffect'), count: counts.effect },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-10 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
            <span className="font-mono text-[12px] text-[var(--text-3)]">{counts.all}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Entity filter dropdown */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[12px] font-mono text-[var(--text-2)] px-3 py-[7px] outline-none focus:border-[rgba(0,229,160,0.3)]"
            >
              <option value="all">{t('filterEntity')}: {t('filterAll')}</option>
              {uniqueEntities.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] p-[2px]">
              <button
                type="button"
                onClick={() => setView('grid')}
                title={t('viewGrid')}
                className={cn(
                  'w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors duration-[100ms]',
                  view === 'grid'
                    ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
                )}
              >
                <svg viewBox="0 0 14 14" fill="currentColor" className="w-3.5 h-3.5">
                  <rect x="1" y="1" width="5" height="5" rx="1" />
                  <rect x="8" y="1" width="5" height="5" rx="1" />
                  <rect x="1" y="8" width="5" height="5" rx="1" />
                  <rect x="8" y="8" width="5" height="5" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                title={t('viewList')}
                className={cn(
                  'w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors duration-[100ms]',
                  view === 'list'
                    ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
                )}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
                  <path d="M2 3.5h10M2 7h10M2 10.5h10" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* ZIP download primary */}
            <button
              type="button"
              disabled={selected.size === 0 && counts.all === 0}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-[7px] rounded-[8px]',
                'text-[13px] font-semibold text-black bg-[var(--neon)]',
                'shadow-[0_0_16px_var(--neon-glow)]',
                'transition-all duration-[120ms]',
                'hover:brightness-110 hover:shadow-[0_0_28px_var(--neon-glow)]',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
              )}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {selected.size > 0 ? `ZIP (${selected.size})` : t('downloadZip')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-3 flex gap-1.5">
          {tabs.map((tab) => {
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border',
                  'text-[12px] font-mono uppercase tracking-[0.04em]',
                  'transition-all duration-[120ms]',
                  active
                    ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                    : 'bg-[rgba(255,255,255,0.04)] text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                )}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] opacity-70">{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {filteredAssets.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 mb-4 opacity-30">
              {/* mascot placeholder — uses mascot-icon as larger fallback */}
              <div className="w-full h-full rounded-full bg-[var(--g2)] border border-[var(--border)]" />
            </div>
            <p className="text-[14px] text-[var(--text)] mb-1">
              {filter !== 'all' || entityFilter !== 'all' ? t('emptyFiltered') : t('emptyNoAssets')}
            </p>
            <p className="text-[12px] text-[var(--text-3)] mb-4">
              {filter === 'all' && entityFilter === 'all' && t('emptyNoAssetsBody')}
            </p>
            {filter !== 'all' || entityFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => { setFilter('all'); setEntityFilter('all'); }}
                className="px-3.5 py-[7px] rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
              >
                {t('emptyFilteredReset')}
              </button>
            ) : (
              <Link
                href={`./entities`}
                className="px-3.5 py-[7px] rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
              >
                {t('emptyGoEntities')}
              </Link>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAssets.map((asset) => {
              const canEditLayers = IMAGE_ASSET_TYPES.includes(asset.type);
              const isSelected = selected.has(asset.id);
              const isSprite = asset.type === 'sprite_sheet';
              return (
                <Link
                  key={asset.id}
                  href={`/projects/${asset.projectId}/assets/${asset.id}`}
                  className={cn(
                    'group relative block rounded-[12px] border overflow-hidden',
                    'bg-[rgba(255,255,255,0.04)]',
                    'transition-all duration-[180ms]',
                    isSelected
                      ? 'border-[var(--neon)] bg-[rgba(0,229,160,0.04)]'
                      : 'border-[var(--border)] hover:border-[rgba(0,229,160,0.25)] hover:bg-[rgba(255,255,255,0.06)]',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] relative">
                    <ThumbnailFallback type={asset.type} />
                    {isSprite && <AnimationBadge />}
                    <StatusBadge status={asset.status} />
                    {asset.status === 'completed' && (
                      <AssetActionButtons asset={asset} projectId={asset.projectId} canEditLayers={canEditLayers} />
                    )}
                    {/* Select checkbox top-left */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(asset.id);
                      }}
                      aria-label="Select"
                      className={cn(
                        'absolute top-2 left-2 w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all duration-[120ms]',
                        isSelected
                          ? 'bg-[var(--neon)] border-[var(--neon)]'
                          : 'bg-[rgba(0,0,0,0.5)] border-[var(--border-hi)] opacity-0 group-hover:opacity-100',
                      )}
                    >
                      {isSelected && (
                        <svg viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" className="w-3 h-3">
                          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[13px] font-medium text-[var(--text)] truncate mb-1.5">{asset.name}</p>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-3)] px-1.5 py-[2px] rounded-[3px] border border-[var(--border)] bg-[var(--g1)] truncate">
                        {asset.entityName}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-3)]">
                        {tType(asset.type)}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--text-3)]">{formatDate(asset.createdAt)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="rounded-[12px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_140px_100px_120px_100px] gap-2 px-4 py-2.5 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
              <span></span>
              <span>name</span>
              <span>entity</span>
              <span>type</span>
              <span>created</span>
              <span>status</span>
            </div>
            {filteredAssets.map((asset) => {
              const isSelected = selected.has(asset.id);
              const map = STATUS_MAP[asset.status] ?? STATUS_MAP.processing;
              const isSprite = asset.type === 'sprite_sheet';
              return (
                <Link
                  key={asset.id}
                  href={`/projects/${asset.projectId}/assets/${asset.id}`}
                  className={cn(
                    'grid grid-cols-[40px_1fr_140px_100px_120px_100px] gap-2 px-4 py-3',
                    'border-b border-[rgba(255,255,255,0.04)] last:border-b-0',
                    'transition-colors duration-[100ms]',
                    isSelected ? 'bg-[rgba(0,229,160,0.04)]' : 'hover:bg-[var(--g1)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(asset.id); }}
                    aria-label="Select"
                    className={cn(
                      'w-5 h-5 rounded-[4px] border flex items-center justify-center self-center',
                      isSelected
                        ? 'bg-[var(--neon)] border-[var(--neon)]'
                        : 'border-[var(--border-hi)]',
                    )}
                  >
                    {isSelected && (
                      <svg viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" className="w-3 h-3">
                        <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span className="text-[13px] text-[var(--text)] truncate self-center">{asset.name}</span>
                  <span className="text-[12px] text-[var(--text-2)] truncate self-center">{asset.entityName}</span>
                  <span className="self-center flex items-center gap-1.5">
                    <span className="font-mono text-[11px] uppercase text-[var(--text-3)]">{tType(asset.type)}</span>
                    {isSprite && (
                      <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--neon)] border border-[var(--neon)] bg-[var(--neon-dim)] rounded-[3px] px-1 py-[1px]">
                        ANIM
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--text-3)] self-center">{formatDate(asset.createdAt)}</span>
                  <span className={cn(
                    'self-center px-2 py-[2px] rounded-[4px] border font-mono text-[10px] font-medium uppercase tracking-[0.04em] w-fit',
                    map.cls,
                  )}>
                    {asset.status === 'completed' ? t('statusDone') : asset.status === 'failed' ? t('statusFailed') : t('statusProcessing')}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
