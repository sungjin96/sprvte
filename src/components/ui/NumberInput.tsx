'use client';

import { useState, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberInput({ value, onChange, min, max, step = 1, className, disabled, ...props }: NumberInputProps) {
  const [internal, setInternal] = useState(value ?? 0);
  const current = value ?? internal;

  const update = (next: number) => {
    const clamped = Math.min(
      max !== undefined ? max : Infinity,
      Math.max(min !== undefined ? min : -Infinity, next),
    );
    setInternal(clamped);
    onChange?.(clamped);
  };

  return (
    <div className={cn('flex items-center', className)}>
      <button
        type="button"
        onClick={() => update(current - step)}
        disabled={disabled || (min !== undefined && current <= min)}
        className={cn(
          'h-8 w-8 flex items-center justify-center shrink-0',
          'bg-[rgba(255,255,255,0.04)] border border-r-0 border-[var(--border)] rounded-l-[var(--r-sm)]',
          'text-[var(--text-2)] text-[14px] font-medium',
          'hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]',
          'disabled:opacity-40 disabled:pointer-events-none',
        )}
      >
        −
      </button>
      <input
        type="number"
        value={current}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => update(Number(e.target.value))}
        className={cn(
          'h-8 w-16 text-center bg-[rgba(255,255,255,0.04)] text-[var(--text)] text-[13px]',
          'border-y border-[var(--border)] outline-none font-mono',
          'focus:border-[rgba(0,229,160,0.4)]',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          'disabled:opacity-40',
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => update(current + step)}
        disabled={disabled || (max !== undefined && current >= max)}
        className={cn(
          'h-8 w-8 flex items-center justify-center shrink-0',
          'bg-[rgba(255,255,255,0.04)] border border-l-0 border-[var(--border)] rounded-r-[var(--r-sm)]',
          'text-[var(--text-2)] text-[14px] font-medium',
          'hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]',
          'disabled:opacity-40 disabled:pointer-events-none',
        )}
      >
        +
      </button>
    </div>
  );
}

export { NumberInput };
