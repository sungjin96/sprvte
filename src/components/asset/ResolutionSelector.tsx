'use client';

import { cn } from '@/lib/utils';

export const REGULAR_RESOLUTIONS = [256, 512, 768, 1024, 1536, 2048] as const;
export type RegularResolution = (typeof REGULAR_RESOLUTIONS)[number];

interface ResolutionSelectorProps {
  value: number;
  onChange: (size: number) => void;
}

export function ResolutionSelector({ value, onChange }: ResolutionSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {REGULAR_RESOLUTIONS.map((size) => (
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
