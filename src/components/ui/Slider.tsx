'use client';

import { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  showValue?: boolean;
  valueSuffix?: string;
}

function Slider({ label, showValue, valueSuffix = '', className, ...props }: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-3)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="font-mono text-[11px] text-[var(--text-2)]">
              {props.value}{valueSuffix}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        className={cn(
          'w-full h-1.5 appearance-none rounded-full cursor-pointer',
          'bg-[rgba(255,255,255,0.08)]',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--neon)]',
          '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black',
          '[&::-webkit-slider-thumb]:shadow-[0_0_8px_var(--neon-glow)]',
          '[&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing',
          '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4',
          '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--neon)]',
          '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black',
          'disabled:opacity-40 disabled:pointer-events-none',
        )}
        style={{
          // Filled track
          background: props.value !== undefined && props.max !== undefined
            ? `linear-gradient(to right, var(--neon) 0%, var(--neon) ${(Number(props.value) / Number(props.max)) * 100}%, rgba(255,255,255,0.08) ${(Number(props.value) / Number(props.max)) * 100}%, rgba(255,255,255,0.08) 100%)`
            : undefined,
        }}
        {...props}
      />
    </div>
  );
}

export { Slider };
