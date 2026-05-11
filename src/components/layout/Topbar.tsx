import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumb?: BreadcrumbItem[];
  right?: ReactNode;
  className?: string;
}

function Topbar({ breadcrumb = [], right, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex items-center gap-2 px-6 py-[13px]',
        'bg-[rgba(0,0,0,0.75)] border-b border-[var(--border)]',
        'backdrop-blur-glass [backdrop-saturate:180%]',
        className,
      )}
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        {breadcrumb.map((item, i) => {
          const isLast = i === breadcrumb.length - 1;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-[var(--text-3)] text-[11px]">/</span>
              )}
              <span
                className={
                  isLast
                    ? 'text-[var(--text)] font-medium'
                    : 'text-[var(--text-2)]'
                }
              >
                {item.label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* Right slot */}
      {right && (
        <div className="ml-auto flex items-center gap-2">
          {right}
        </div>
      )}
    </header>
  );
}

export { Topbar };
export type { BreadcrumbItem };
