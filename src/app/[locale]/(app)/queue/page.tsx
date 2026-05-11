'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QueueStats, QueueStatsData } from '@/components/queue/QueueStats';
import { QueueJobRow, QueueJob } from '@/components/queue/QueueJobRow';
import { EmptyState } from '@/components/ui/EmptyState';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_STATS: QueueStatsData = { waiting: 3, active: 1, completed: 142, failed: 2 };

const MOCK_JOBS: QueueJob[] = [
  {
    id: 'job-1',
    name: 'Alice Walk — sprite_sheet',
    status: 'active',
    progress: 67,
    assetType: 'sprite_sheet',
    projectName: 'Dragon Quest Remake',
    createdAt: new Date(Date.now() - 45_000).toISOString(),
  },
  {
    id: 'job-2',
    name: 'Dark Forest — tileset',
    status: 'waiting',
    assetType: 'background',
    projectName: 'Dragon Quest Remake',
    createdAt: new Date(Date.now() - 30_000).toISOString(),
  },
  {
    id: 'job-3',
    name: 'Flame Sword Icon',
    status: 'waiting',
    assetType: 'item',
    projectName: 'Dragon Quest Remake',
    createdAt: new Date(Date.now() - 20_000).toISOString(),
  },
  {
    id: 'job-4',
    name: 'Battle Theme BGM',
    status: 'waiting',
    assetType: 'bgm',
    projectName: 'Dragon Quest Remake',
    createdAt: new Date(Date.now() - 10_000).toISOString(),
  },
  {
    id: 'job-5',
    name: 'Space Ship Sprite',
    status: 'failed',
    assetType: 'character',
    projectName: 'Space Shooter X',
    error: 'Replicate API timeout after 60s',
    createdAt: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: 'job-6',
    name: 'Explosion Effect',
    status: 'failed',
    assetType: 'effect',
    projectName: 'Space Shooter X',
    error: 'Invalid prompt: content policy violation',
    createdAt: new Date(Date.now() - 300_000).toISOString(),
  },
];

type FilterStatus = 'all' | 'active' | 'waiting' | 'failed' | 'completed';

export default function QueuePage() {
  const t = useTranslations();
  const [jobs, setJobs] = useState<QueueJob[]>(MOCK_JOBS);
  const [filter, setFilter] = useState<FilterStatus>('all');

  const handleCancel = (id: string) => setJobs((p) => p.filter((j) => j.id !== id));
  const handleRetry = (id: string) =>
    setJobs((p) => p.map((j) => (j.id === id ? { ...j, status: 'waiting' as const, error: undefined } : j)));

  const filtered = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const FILTER_TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all',       label: t('queue.filter.all') },
    { value: 'active',    label: t('queue.filter.active') },
    { value: 'waiting',   label: t('queue.filter.waiting') },
    { value: 'failed',    label: t('queue.filter.failed') },
    { value: 'completed', label: t('queue.filter.completed') },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('queue.title')}</h1>
        <p className="text-[12px] text-[var(--text-3)]">{t('queue.subtitle')}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <QueueStats stats={MOCK_STATS} />

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-mono border transition-all ${
                filter === value
                  ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
                  : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Job list */}
        {filtered.length === 0 ? (
          <EmptyState heading={t('queue.empty')} body={t('queue.emptyBody')} showMascot={false} />
        ) : (
          <div className="space-y-2">
            {filtered.map((job) => (
              <QueueJobRow
                key={job.id}
                job={job}
                onCancel={handleCancel}
                onRetry={handleRetry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
