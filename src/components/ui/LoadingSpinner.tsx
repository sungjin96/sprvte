import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'rounded-full border-2 border-[rgba(255,255,255,0.1)] animate-spin',
        'border-t-[var(--neon)]',
        size === 'sm' && 'w-4 h-4',
        size === 'md' && 'w-6 h-6',
        size === 'lg' && 'w-10 h-10',
        className,
      )}
      style={{ borderTopColor: 'var(--neon)' }}
    />
  );
}

export { LoadingSpinner };
