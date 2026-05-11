import { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-3)]',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--neon)] ml-0.5">*</span>}
    </label>
  );
}

export { Label };
