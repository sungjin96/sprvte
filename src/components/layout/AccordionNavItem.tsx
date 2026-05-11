'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface AccordionSubItem {
  key: string;
  label: string;
  href: string;
  count?: number;
  isActive: boolean;
}

interface AccordionNavItemProps {
  label: string;
  icon: ReactNode;
  isParentActive: boolean;
  subItems: AccordionSubItem[];
  defaultExpanded?: boolean;
}

const ChevronIcon = (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function AccordionNavItem({
  label,
  icon,
  isParentActive,
  subItems,
  defaultExpanded,
}: AccordionNavItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? isParentActive);

  useEffect(() => {
    if (isParentActive) setExpanded(true);
  }, [isParentActive]);

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={cn(
          'w-full flex items-center gap-[9px] px-[10px] py-2 rounded-sm mb-[1px]',
          'text-[13px] border transition-all duration-[120ms] cursor-pointer',
          'text-[var(--text-2)] border-transparent',
          'hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border)]',
          isParentActive && 'text-[var(--text)]',
        )}
      >
        <span className={cn('w-[15px] h-[15px] shrink-0 opacity-50', isParentActive && 'opacity-100')}>
          {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        <span
          className={cn(
            'shrink-0 text-[var(--text-3)] transition-transform duration-[120ms]',
            expanded && 'rotate-180',
          )}
        >
          {ChevronIcon}
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-out',
          expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="ml-[9px] border-l border-[var(--border)] pl-[6px] py-[2px]">
          {subItems.map((sub) => (
            <Link
              key={sub.key}
              href={sub.href}
              className={cn(
                'flex items-center gap-[8px] px-[8px] py-[5px] rounded-sm mb-[1px]',
                'text-[12px] border transition-all duration-[100ms]',
                !sub.isActive && [
                  'text-[var(--text-2)] border-transparent',
                  'hover:bg-[var(--g1)] hover:text-[var(--text)]',
                ],
                sub.isActive && [
                  'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
                ],
              )}
            >
              <span
                className={cn(
                  'w-[5px] h-[5px] rounded-full shrink-0',
                  sub.isActive ? 'bg-[var(--neon)]' : 'bg-[var(--text-3)]',
                )}
              />
              <span className="flex-1">{sub.label}</span>
              {sub.count !== undefined && (
                <span className="font-mono text-[10px] text-[var(--text-3)]">{sub.count}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
