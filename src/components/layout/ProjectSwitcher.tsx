'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface ProjectItem {
  id: string;
  name: string;
}

interface ProjectSwitcherProps {
  locale: string;
  currentProjectId: string;
  currentProjectName: string;
  projects: ProjectItem[];
}

export function ProjectSwitcher({
  locale,
  currentProjectId,
  currentProjectName,
  projects,
}: ProjectSwitcherProps) {
  const t = useTranslations('workspace');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-[9px] px-[10px] py-[8px] rounded-sm text-[13px] font-medium text-[var(--text)] hover:bg-[var(--g2)] border border-transparent hover:border-[var(--border)] transition-all duration-[120ms] cursor-pointer"
      >
        <div className="w-[18px] h-[18px] rounded-[4px] bg-[var(--neon-dim)] border border-[rgba(0,229,160,0.3)] shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 10 10" fill="none" stroke="var(--neon)" strokeWidth="1.4" className="w-[9px] h-[9px]">
            <path d="M.5 2A1 1 0 0 1 1.5.5H4a1 1 0 0 1 .7.3l.8.8A1 1 0 0 0 6.2 2H8.5A1 1 0 0 1 9.5 3v5.5a1 1 0 0 1-1 1H1.5a1 1 0 0 1-1-1V2Z" />
          </svg>
        </div>
        <span className="flex-1 truncate text-left">{currentProjectName}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={cn(
            'w-3 h-3 shrink-0 text-[var(--text-3)] transition-transform duration-[120ms]',
            open && 'rotate-180',
          )}
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 z-50 rounded-sm border border-[var(--border-hi)] bg-[rgba(12,12,18,0.97)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="py-1 max-h-[200px] overflow-y-auto">
            {projects.map((project) => {
              const isActive = project.id === currentProjectId;
              return (
                <Link
                  key={project.id}
                  href={`/${locale}/projects/${project.id}/entities`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-[9px] px-3 py-[7px] text-[13px] transition-colors duration-[100ms]',
                    isActive
                      ? 'text-[var(--neon)] bg-[var(--neon-dim)]'
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)]',
                  )}
                >
                  <div
                    className={cn(
                      'w-[5px] h-[5px] rounded-full shrink-0',
                      isActive ? 'bg-[var(--neon)]' : 'bg-[var(--text-3)]',
                    )}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  {isActive && (
                    <svg viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-[10px] h-[8px] shrink-0">
                      <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[var(--border)]">
            <Link
              href={`/${locale}/projects`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-[9px] px-3 py-[7px] text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
            >
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 shrink-0">
                <path d="M6 1v10M1 6h10" strokeLinecap="round" />
              </svg>
              <span>{t('newProject')}</span>
            </Link>
            <Link
              href={`/${locale}/projects`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between gap-[9px] px-3 py-[7px] text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--g1)] transition-colors duration-[100ms]"
            >
              <span>{t('allProjects')}</span>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 shrink-0">
                <path d="M2 6h8M6 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
