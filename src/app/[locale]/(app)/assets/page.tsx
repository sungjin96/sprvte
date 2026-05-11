'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AssetGrid } from '@/components/asset/AssetGrid';
import { AssetFilterBar, AssetFilters } from '@/components/asset/AssetFilterBar';
import { Asset } from '@/types/asset';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ASSETS: Asset[] = [
  { id: 'ast-1', projectId: 'proj-1', name: 'Alice Idle',  type: 'character',    status: 'completed',  fileUrl: 'https://picsum.photos/seed/a1/256/256', createdAt: '2026-04-25T10:00:00Z', updatedAt: '2026-04-25T10:05:00Z' },
  { id: 'ast-2', projectId: 'proj-1', name: 'Alice Attack', type: 'sprite_sheet', status: 'completed',  fileUrl: 'https://picsum.photos/seed/a2/256/256', createdAt: '2026-04-26T09:00:00Z', updatedAt: '2026-04-26T09:10:00Z' },
  { id: 'ast-3', projectId: 'proj-1', name: 'Alice Walk',   type: 'sprite_sheet', status: 'processing',                                                  createdAt: '2026-04-28T11:00:00Z', updatedAt: '2026-04-28T11:00:00Z' },
  { id: 'ast-4', projectId: 'proj-1', name: 'Dark Forest',  type: 'background',   status: 'completed',  fileUrl: 'https://picsum.photos/seed/a4/256/256', createdAt: '2026-04-22T14:00:00Z', updatedAt: '2026-04-22T14:00:00Z' },
  { id: 'ast-5', projectId: 'proj-1', name: 'Battle Theme', type: 'bgm',          status: 'completed',  fileUrl: '',                                     createdAt: '2026-04-23T15:00:00Z', updatedAt: '2026-04-23T15:00:00Z' },
  { id: 'ast-6', projectId: 'proj-2', name: 'Ship Sprite',  type: 'character',    status: 'failed',                                                     createdAt: '2026-04-24T08:00:00Z', updatedAt: '2026-04-24T08:00:00Z' },
];

export default function AllAssetsPage() {
  const t = useTranslations();
  const [filters, setFilters] = useState<AssetFilters>({ type: 'all', status: 'all', search: '' });

  const filtered = useMemo(() =>
    MOCK_ASSETS.filter((a) => {
      if (filters.type !== 'all' && a.type !== filters.type) return false;
      if (filters.status !== 'all' && a.status !== filters.status) return false;
      if (filters.search && !a.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    }),
  [filters]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('assets.title')}</h1>
        <p className="text-[12px] text-[var(--text-3)]">
          {filtered.length} / {MOCK_ASSETS.length}
        </p>
      </div>

      <div className="p-6 space-y-6">
        <AssetFilterBar filters={filters} onChange={setFilters} />
        <AssetGrid assets={filtered} />
      </div>
    </div>
  );
}
