import { cn } from '@/lib/utils';
import type { AssetStatus } from './AssetCard';

export type BadgeVariant = AssetStatus | 'pending' | 'quality' | 'standard';

interface BadgeProps {
  status: BadgeVariant;
  className?: string;
}

const statusConfig: Record<BadgeVariant, { label: string; className: string }> = {
  done: {
    label: 'done',
    className: 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
  },
  processing: {
    label: 'processing',
    className: 'bg-[rgba(255,200,0,0.08)] text-[rgba(255,200,0,0.8)] border-[rgba(255,200,0,0.2)] animate-pulse',
  },
  pending: {
    label: 'pending',
    className: 'bg-[rgba(255,255,255,0.06)] text-[var(--text-3)] border-[var(--border)]',
  },
  error: {
    label: 'error',
    className: 'bg-[rgba(255,60,60,0.10)] text-[rgba(255,100,100,0.9)] border-[rgba(255,60,60,0.2)]',
  },
  quality: {
    label: 'quality',
    className: 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
  },
  standard: {
    label: 'standard',
    className: 'bg-[rgba(255,255,255,0.05)] text-[var(--text-3)] border-[var(--border)]',
  },
};

function Badge({ status, className }: BadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;
  const { label, className: statusClass } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center px-[6px] py-[1px]',
        'rounded-full text-[10px] font-mono font-medium border',
        'whitespace-nowrap shrink-0',
        statusClass,
        className,
      )}
    >
      {label}
    </span>
  );
}

export { Badge };
