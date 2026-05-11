'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useCredits } from '@/lib/credits/CreditsContext';

interface UserDropdownProps {
  locale: string;
  userName: string;
  userEmail: string;
  queueCount: number;
}

export function UserDropdown({
  locale,
  userName,
  userEmail,
  queueCount,
}: UserDropdownProps) {
  const t = useTranslations('workspace');
  const { credits } = useCredits();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Close on navigation (layout doesn't remount in App Router)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  const initial = userName.charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative p-3 border-t border-[var(--border)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-[9px] rounded-sm px-[8px] py-[6px] hover:bg-[var(--g2)] border border-transparent hover:border-[var(--border)] transition-all duration-[120ms] cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center bg-[var(--g3)] border border-[var(--border-hi)] text-[11px] font-semibold text-[var(--text)]">
          {initial}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[12px] font-medium text-[var(--text)] truncate">{userName}</p>
          <p className="text-[11px] text-[var(--text-3)] truncate">{userEmail}</p>
        </div>
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
        <div className="absolute bottom-full left-3 right-3 mb-1 z-50 rounded-sm border border-[var(--border-hi)] bg-[rgba(12,12,18,0.97)] backdrop-blur-[20px] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Queue */}
          <Link
            href={`/${locale}/queue`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-[9px] px-3 py-[8px] text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
          >
            <div className="flex items-center gap-[9px]">
              <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-[14px] h-[14px] shrink-0 opacity-60">
                <polyline points="1,8 4,8 5.5,3 7.5,12 9.5,5.5 11,8 14,8" />
              </svg>
              <span>{t('queue')}</span>
            </div>
            {queueCount > 0 && (
              <span className="font-mono text-[10px] rounded-full px-[6px] py-[1px] bg-[rgba(255,255,255,0.05)] border border-[var(--border)] text-[var(--text-3)]">
                {queueCount}
              </span>
            )}
          </Link>

          {/* Credits */}
          <Link
            href={`/${locale}/credits`}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between gap-[9px] px-3 py-[8px] text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
          >
            <div className="flex items-center gap-[9px]">
              <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-[14px] h-[14px] shrink-0 opacity-60">
                <circle cx="7.5" cy="7.5" r="6" />
                <path d="M7.5 4v1.5M7.5 9.5V11M5.5 6a2 2 0 0 1 4 0c0 1.5-2 2-2 3" strokeLinecap="round" />
              </svg>
              <span>{t('credits')}</span>
            </div>
            <span className="font-mono text-[11px] text-[var(--neon)]">{credits.toLocaleString()}</span>
          </Link>

          {/* Settings */}
          <Link
            href={`/${locale}/settings`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-[9px] px-3 py-[8px] text-[13px] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
          >
            <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-[14px] h-[14px] shrink-0 opacity-60">
              <circle cx="7.5" cy="7.5" r="2" />
              <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.9 10.9l1.06 1.06M3.05 11.95l1.06-1.06M10.9 4.1l1.06-1.06" />
            </svg>
            <span>{t('settings')}</span>
          </Link>

          <div className="border-t border-[var(--border)]">
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-[9px] px-3 py-[8px] text-[13px] text-[rgba(255,80,80,0.8)] hover:text-[rgba(255,80,80,1)] hover:bg-[rgba(255,80,80,0.06)] transition-colors duration-[100ms] cursor-pointer"
            >
              <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-[14px] h-[14px] shrink-0">
                <path d="M9 2H12.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9M6 10.5l-3-3 3-3M3 7.5h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t('logout')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
