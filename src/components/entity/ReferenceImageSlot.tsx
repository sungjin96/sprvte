'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ReferenceType } from '@/types/entity';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ReferenceImageSlotProps {
  type: ReferenceType;
  imageUrl?: string;
  status?: 'empty' | 'pending' | 'ready';
  onGenerate?: () => void;
  onRemove?: () => void;
  className?: string;
}

function ReferenceImageSlot({
  type,
  imageUrl,
  status = 'empty',
  onGenerate,
  onRemove,
  className,
}: ReferenceImageSlotProps) {
  const tType = useTranslations('guide.refType');
  const t = useTranslations('guide');
  const label = tType(type);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Slot */}
      <div
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden border',
          status === 'ready' ? 'border-[var(--border-hi)]' : 'border-dashed border-[var(--border)]',
          status === 'empty' && 'bg-[var(--g1)]',
        )}
      >
        {/* Image */}
        {status === 'ready' && imageUrl && (
          <>
            <Image src={imageUrl} alt={label} fill className="object-cover" />
            {/* Remove overlay */}
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-red-400">
                  <path d="M3 6h10M6 6V4h4v2M5 6l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Loading */}
        {status === 'pending' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--g1)]">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* Empty — generate button */}
        {status === 'empty' && onGenerate && (
          <button
            type="button"
            onClick={onGenerate}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-[var(--g2)] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-[var(--text-3)]">
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-mono text-[var(--text-3)]">{t('refGenerate')}</span>
          </button>
        )}
      </div>

      {/* Label */}
      <span className="text-[11px] font-mono text-[var(--text-3)] text-center uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

export { ReferenceImageSlot };
