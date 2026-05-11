import { cn } from '@/lib/utils';

interface QueueStatsData {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

interface QueueStatsProps {
  stats: QueueStatsData;
  className?: string;
}

const STAT_ITEMS = [
  { key: 'waiting' as const, label: 'Waiting', color: 'text-amber-400' },
  { key: 'active' as const, label: 'Active', color: 'text-[var(--neon)]' },
  { key: 'completed' as const, label: 'Completed', color: 'text-[var(--text-2)]' },
  { key: 'failed' as const, label: 'Failed', color: 'text-red-400' },
];

function QueueStats({ stats, className }: QueueStatsProps) {
  return (
    <div className={cn('grid grid-cols-4 gap-3', className)}>
      {STAT_ITEMS.map(({ key, label, color }) => (
        <div
          key={key}
          className="flex flex-col items-center gap-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--g1)]"
        >
          <span className={cn('text-2xl font-bold font-mono tabular-nums', color)}>
            {stats[key]}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">{label}</span>
        </div>
      ))}
    </div>
  );
}

export { QueueStats };
export type { QueueStatsData };
