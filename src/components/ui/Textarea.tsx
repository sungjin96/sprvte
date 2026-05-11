import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-[rgba(255,255,255,0.04)] text-[var(--text)] text-[13px]',
          'border rounded-[var(--r-md)] px-3 py-[9px]',
          'font-sans placeholder:text-[var(--text-3)]',
          'outline-none transition-all duration-[120ms] resize-none',
          !error && 'border-[var(--border)] focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)]',
          error  && 'border-[rgba(255,60,60,0.4)]',
          'disabled:opacity-40 disabled:pointer-events-none',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
