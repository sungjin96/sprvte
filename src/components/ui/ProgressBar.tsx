import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  status?: 'default' | 'success' | 'error';
}

function ProgressBar({ value, className, showLabel = false, size = 'md', status = 'default' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-[11px] text-[var(--text-3)] font-mono">{clamped}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden',
          size === 'sm' && 'h-1',
          size === 'md' && 'h-1.5',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            status === 'default' && 'bg-[var(--neon)]',
            status === 'success' && 'bg-[var(--neon)]',
            status === 'error' && 'bg-red-500',
          )}
          style={{
            width: `${clamped}%`,
            boxShadow: status !== 'error' ? '0 0 8px var(--neon-glow)' : undefined,
          }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
