'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GlobalShellProps {
  locale: string;
  children: ReactNode;
}

export function GlobalShell({ locale, children }: GlobalShellProps) {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Minimal sidebar */}
      <aside
        className="w-[220px] min-w-[220px] flex flex-col z-10 bg-[rgba(8,8,12,0.6)] backdrop-blur-[20px] [backdrop-saturate:180%] border-r border-[var(--border-hi)]"
        style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-5 border-b border-[var(--border)] flex items-center justify-center">
          <Link href={`/${locale}/projects`} className="block group">
            <Image
              src="/assets/mascot-full.svg"
              alt="Spryte"
              width={188}
              height={35}
              priority
              className="w-[188px] h-auto group-hover:opacity-90 transition-opacity duration-[120ms]"
            />
          </Link>
        </div>

        {/* Back to projects */}
        <div className="flex-1 px-3 pt-3">
          <Link
            href={`/${locale}/projects`}
            className="flex items-center gap-[9px] px-[10px] py-2 rounded-sm text-[13px] text-[var(--text-2)] border border-transparent hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border)] transition-all duration-[120ms]"
          >
            <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-[15px] h-[15px] shrink-0 opacity-50">
              <path d="M9 3L5 7.5 9 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>프로젝트로 돌아가기</span>
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
