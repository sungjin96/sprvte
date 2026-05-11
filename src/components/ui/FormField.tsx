import { HTMLAttributes, ReactNode } from 'react';
import { Label } from './Label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-[6px]', className)} {...props}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-[rgba(255,100,100,0.9)] font-mono">{error}</p>
      )}
      {hint && !error && (
        <p className="text-[11px] text-[var(--text-3)]">{hint}</p>
      )}
    </div>
  );
}

export { FormField };
