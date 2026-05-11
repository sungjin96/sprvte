import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md bg-[rgba(255,255,255,0.06)] animate-pulse',
        className,
      )}
      {...props}
    />
  );
}

// Asset card skeleton
function AssetCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export { Skeleton, AssetCardSkeleton };
