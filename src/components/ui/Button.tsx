import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  size?: 'sm' | 'md';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'ghost', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // base
          'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all duration-[120ms] cursor-pointer disabled:opacity-40 disabled:pointer-events-none',
          // size
          size === 'md' && 'px-[14px] py-[7px] text-[13px]',
          size === 'sm' && 'px-[10px] py-[5px] text-[12px]',
          // variants
          variant === 'ghost' && [
            'bg-[var(--g1)] text-[var(--text-2)] border border-[var(--border)]',
            'hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)]',
          ],
          variant === 'primary' && [
            'bg-[var(--neon)] text-black font-semibold border-0',
            'shadow-[0_0_16px_var(--neon-glow)]',
            'hover:shadow-[0_0_28px_var(--neon-glow)] hover:brightness-[1.08]',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
