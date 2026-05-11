'use client';

import { PIXEL_SIZES, PixelSize } from '@/types/asset';
import { cn } from '@/lib/utils';

interface PixelSizeSelectorProps {
  value: number;
  onChange: (size: number) => void;
}

function PixelSizeSelector({ value, onChange }: PixelSizeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PIXEL_SIZES.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={cn(
            'px-3 py-1.5 rounded-lg border text-[12px] font-mono transition-all',
            value === size
              ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
              : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
          )}
        >
          {size}×{size}
        </button>
      ))}
    </div>
  );
}

export { PixelSizeSelector };
