import { HTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export type AssetStatus = 'done' | 'processing' | 'error';

interface AssetCardProps extends HTMLAttributes<HTMLDivElement> {
  imageUrl?: string;
  name: string;
  type: string;
  status: AssetStatus;
  createdAt?: string;
}

function AssetCard({
  imageUrl,
  name,
  type,
  status,
  createdAt,
  className,
  ...props
}: AssetCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border overflow-hidden cursor-pointer',
        'bg-[var(--g1)] border-[var(--border-hi)]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
        'backdrop-blur-[12px] [backdrop-saturate:180%]',
        'transition-all duration-[180ms]',
        'hover:border-[var(--neon)] hover:bg-[var(--g2)]',
        'hover:shadow-[0_4px_16px_rgba(0,229,160,0.1)]',
        className,
      )}
      style={{ WebkitBackdropFilter: 'blur(12px) saturate(180%)' }}
      {...props}
    >
      {/* Thumbnail */}
      <div className="aspect-square w-full bg-[rgba(255,255,255,0.03)] relative overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[var(--text-3)] text-[11px] font-mono">no preview</span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-medium text-[var(--text)] truncate leading-tight">{name}</p>
          <Badge status={status} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-[var(--text-3)]">{type}</span>
          {createdAt && (
            <span className="text-[11px] font-mono text-[var(--text-3)]">{createdAt}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export { AssetCard };
