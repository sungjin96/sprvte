import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, placeholder, error, className, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full bg-[rgba(255,255,255,0.04)] text-[var(--text)] text-[12px]',
          'border rounded-[var(--r-sm)] px-3 py-[7px]',
          'font-mono outline-none transition-all duration-[120ms] cursor-pointer',
          'appearance-none',
          !error && 'border-[var(--border)] focus:border-[rgba(0,229,160,0.3)]',
          error  && 'border-[rgba(255,60,60,0.4)]',
          'disabled:opacity-40 disabled:pointer-events-none',
          className,
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff50' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '28px',
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
);

Select.displayName = 'Select';
export { Select };
export type { SelectOption };
