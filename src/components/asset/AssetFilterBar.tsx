'use client';

import { useTranslations } from 'next-intl';
import { AssetType, AssetStatus } from '@/types/asset';
import { cn } from '@/lib/utils';

const ALL_TYPES: AssetType[] = [
  'character', 'background', 'ui', 'sprite_sheet', 'effect', 'bgm', 'sfx', 'ambient',
];

export interface AssetFilters {
  type: AssetType | 'all';
  status: AssetStatus | 'all';
  search: string;
}

interface AssetFilterBarProps {
  filters: AssetFilters;
  onChange: (filters: AssetFilters) => void;
  className?: string;
}

function AssetFilterBar({ filters, onChange, className }: AssetFilterBarProps) {
  const tFilter = useTranslations('assets.filter');
  const tType = useTranslations('assets.type');
  const tStatus = useTranslations('assets.status');
  const set = (partial: Partial<AssetFilters>) => onChange({ ...filters, ...partial });

  const STATUS_OPTIONS: { value: AssetStatus | 'all'; label: string }[] = [
    { value: 'all',        label: tFilter('all') },
    { value: 'completed',  label: tStatus('completed') },
    { value: 'processing', label: tStatus('processing') },
    { value: 'pending',    label: tStatus('pending') },
    { value: 'failed',     label: tStatus('failed') },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search */}
      <div className="relative">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)] pointer-events-none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l3 3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder={tFilter('search')}
          className={cn(
            'h-8 pl-8 pr-3 w-[200px] rounded-lg border border-[var(--border)]',
            'bg-[var(--g1)] text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)]',
            'focus:outline-none focus:border-[var(--border-hi)] transition-colors',
          )}
        />
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border)]" />

      {/* Type chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => set({ type: 'all' })}
          className={cn(
            'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all',
            filters.type === 'all'
              ? 'bg-[var(--neon-dim)] text-[var(--neon)] border border-[rgba(0,229,160,0.2)]'
              : 'bg-[var(--g1)] text-[var(--text-3)] border border-[var(--border)] hover:border-[var(--border-hi)]',
          )}
        >
          {tFilter('all')}
        </button>
        {ALL_TYPES.map((typeKey) => (
          <button
            key={typeKey}
            type="button"
            onClick={() => set({ type: typeKey })}
            className={cn(
              'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all',
              filters.type === typeKey
                ? 'bg-[var(--neon-dim)] text-[var(--neon)] border border-[rgba(0,229,160,0.2)]'
                : 'bg-[var(--g1)] text-[var(--text-3)] border border-[var(--border)] hover:border-[var(--border-hi)]',
            )}
          >
            {tType(typeKey)}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border)]" />

      {/* Status select */}
      <select
        value={filters.status}
        onChange={(e) => set({ status: e.target.value as AssetStatus | 'all' })}
        className={cn(
          'h-8 px-2.5 rounded-lg border border-[var(--border)]',
          'bg-[var(--g1)] text-[12px] font-mono text-[var(--text-2)]',
          'focus:outline-none focus:border-[var(--border-hi)] transition-colors',
        )}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { AssetFilterBar };
