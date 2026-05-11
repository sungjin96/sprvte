import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  /** Alias for error — preferred in forms */
  hasError?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, hasError, className, ...props }, ref) => {
    const isError = error || hasError;
    return (
      <input
        ref={ref}
        className={cn(
          'w-full bg-[rgba(255,255,255,0.04)] text-[var(--text)] text-[13px]',
          'border rounded-[var(--r-sm)] px-3 py-[7px]',
          'font-sans placeholder:text-[var(--text-3)]',
          'outline-none transition-all duration-[120ms]',
          !isError && 'border-[var(--border)] focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)]',
          isError  && 'border-[rgba(255,60,60,0.4)] focus:border-[rgba(255,60,60,0.6)]',
          'disabled:opacity-40 disabled:pointer-events-none',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
export { Input };
