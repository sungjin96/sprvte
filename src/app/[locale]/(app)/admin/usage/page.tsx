'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const ROWS = [
  { model: 'replicate-flux-schnell',  category: 'image',     calls: 4218, costUsd: 422,   revenueUsd: 1234, marginPct: 65.8 },
  { model: 'replicate-sdxl-lightning', category: 'image',     calls: 2841, costUsd: 142,   revenueUsd: 568,  marginPct: 75.0 },
  { model: 'mubert',                  category: 'audio',     calls: 1452, costUsd: 87,    revenueUsd: 348,  marginPct: 75.0 },
  { model: 'autosprite',              category: 'animation', calls: 1289, costUsd: 12,    revenueUsd: 257,  marginPct: 95.3 },
  { model: 'elevenlabs-sfx',          category: 'audio',     calls: 612,  costUsd: 24,    revenueUsd: 73,   marginPct: 67.1 },
  { model: 'animatediff',             category: 'animation', calls: 348,  costUsd: 28,    revenueUsd: 209,  marginPct: 86.6 },
  { model: 'openai-gpt-image-2',      category: 'image',     calls: 124,  costUsd: 99,    revenueUsd: 248,  marginPct: 60.1 },
];

type Range = 'all' | '7d' | '30d' | '90d' | 'custom';

export default function AdminUsagePage() {
  const t = useTranslations('admin.usage');
  const [range, setRange] = useState<Range>('30d');
  const [model, setModel] = useState<string>('all');

  const filtered = model === 'all' ? ROWS : ROWS.filter((r) => r.model === model);
  const totals = filtered.reduce((acc, r) => ({
    calls: acc.calls + r.calls,
    cost: acc.cost + r.costUsd,
    revenue: acc.revenue + r.revenueUsd,
  }), { calls: 0, cost: 0, revenue: 0 });
  const totalMargin = totals.revenue ? ((totals.revenue - totals.cost) / totals.revenue) * 100 : 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
              {t('filterRange')}:
            </span>
            {(['all', '7d', '30d', '90d', 'custom'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  'px-2.5 py-1 rounded-[6px] text-[11px] font-mono uppercase tracking-[0.04em] border transition-all duration-[100ms]',
                  range === r
                    ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                    : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                )}
              >
                {t(`range${r === 'all' ? 'All' : r === 'custom' ? 'Custom' : r === '7d' ? '7d' : r === '30d' ? '30d' : '90d'}` as 'rangeAll')}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-[var(--border)]" />

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[12px] font-mono text-[var(--text-2)] px-3 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)]"
          >
            <option value="all">{t('filterModel')}: {t('rangeAll')}</option>
            {ROWS.map((r) => (
              <option key={r.model} value={r.model}>{r.model}</option>
            ))}
          </select>

          <button
            type="button"
            className="ml-auto px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
          >
            ↓ {t('exportCsv')}
          </button>
        </div>

        {/* Table */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-3 px-5 py-3 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            <span>{t('tableModel')}</span>
            <span className="text-right">{t('tableCalls')}</span>
            <span className="text-right">{t('tableCost')}</span>
            <span className="text-right">{t('tableRevenue')}</span>
            <span className="text-right">{t('tableMargin')}</span>
            <span className="text-right">USD</span>
          </div>
          {filtered.map((row) => (
            <div
              key={row.model}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[var(--g1)] transition-colors duration-[100ms] text-[13px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)] font-mono text-[12px]">{row.model}</span>
                <span className="font-mono text-[10px] uppercase text-[var(--text-3)]">{row.category}</span>
              </div>
              <span className="font-mono text-[var(--text-2)] text-right">{row.calls.toLocaleString()}</span>
              <span className="font-mono text-[rgba(255,150,150,0.85)] text-right">${row.costUsd.toLocaleString()}</span>
              <span className="font-mono text-[var(--neon)] text-right">${row.revenueUsd.toLocaleString()}</span>
              <span className="font-mono text-[var(--text-2)] text-right">{row.marginPct.toFixed(1)}%</span>
              <span className="font-mono text-[var(--text)] text-right font-semibold">
                ${(row.revenueUsd - row.costUsd).toLocaleString()}
              </span>
            </div>
          ))}

          {/* Totals */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-3 px-5 py-3 border-t border-[var(--border-hi)] bg-[var(--g1)] font-mono text-[12px]">
            <span className="text-[var(--text)] font-semibold uppercase tracking-[0.04em] text-[10px]">total</span>
            <span className="text-[var(--text)] text-right">{totals.calls.toLocaleString()}</span>
            <span className="text-[rgba(255,150,150,0.95)] text-right">${totals.cost.toLocaleString()}</span>
            <span className="text-[var(--neon)] text-right">${totals.revenue.toLocaleString()}</span>
            <span className="text-[var(--text-2)] text-right">{totalMargin.toFixed(1)}%</span>
            <span className="text-[var(--text)] text-right font-semibold">
              ${(totals.revenue - totals.cost).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
