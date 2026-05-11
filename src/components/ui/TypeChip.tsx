'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TypeChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

function TypeChip({ active = false, className, children, ...props }: TypeChipProps) {
  return (
    <button
      className={cn(
        'px-[14px] py-[5px] rounded-full text-[12px] font-medium font-mono',
        'border transition-all duration-[120ms] cursor-pointer',
        'disabled:opacity-40 disabled:pointer-events-none',
        !active && [
          'border-[var(--border)] text-[var(--text-2)] bg-transparent',
          'hover:border-[var(--border-hi)] hover:text-[var(--text)] hover:bg-[var(--g1)]',
        ],
        active && [
          'bg-[var(--neon-dim)] border-[rgba(0,229,160,0.3)] text-[var(--neon)]',
          'shadow-[0_0_8px_rgba(0,229,160,0.15)]',
        ],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { TypeChip };
