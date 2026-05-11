'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface AdminShellProps {
  locale: string;
  children: ReactNode;
}

const Icons = {
  Dashboard: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="8" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="8" width="5" height="5" rx="1" />
      <rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  ),
  Usage: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <path d="M2 13V2M2 13h11" strokeLinecap="round" />
      <path d="M5 9l3-4 2 2 3-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <circle cx="5" cy="5" r="2.5" />
      <circle cx="11" cy="6" r="2" />
      <path d="M1 13c0-2.5 2-4.5 4-4.5s4 2 4 4.5M9 13c0-2 1.5-3.5 3-3.5s2 1 2 2.5" strokeLinecap="round" />
    </svg>
  ),
  Coupons: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <path d="M2 5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v2a1.5 1.5 0 0 0 0 3v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1.5 1.5 0 0 0 0-3V5z" />
      <path d="M6 4v7" strokeDasharray="2 1" />
    </svg>
  ),
  Models: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <circle cx="7.5" cy="7.5" r="3" />
      <circle cx="7.5" cy="7.5" r="6" strokeDasharray="2 1.5" />
    </svg>
  ),
  Back: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-full h-full">
      <path d="M9 3L5 7.5 9 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

function NavItem({
  href,
  icon,
  label,
  isActive,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-[9px] px-[10px] py-2 rounded-sm mb-[1px]',
        'text-[13px] border transition-all duration-[120ms] cursor-pointer',
        !isActive && [
          'text-[var(--text-2)] border-transparent',
          'hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border)]',
        ],
        isActive && [
          'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
        ],
      )}
    >
      <span
        className={cn(
          'w-[15px] h-[15px] shrink-0 opacity-50',
          isActive && 'opacity-100 [&_path]:stroke-[var(--neon)] [&_circle]:stroke-[var(--neon)] [&_rect]:stroke-[var(--neon)]',
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export function AdminShell({ locale, children }: AdminShellProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();

  const base = `/${locale}/admin`;
  const isActive = (path: string) => path === base ? pathname === base : pathname.startsWith(path);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <aside
        className={cn(
          'w-[220px] min-w-[220px] flex flex-col z-10',
          'bg-[rgba(8,8,12,0.6)] backdrop-blur-[20px] [backdrop-saturate:180%]',
          'border-r border-[var(--border-hi)]',
        )}
        style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-5 border-b border-[var(--border)] flex items-center justify-center">
          <Link href={base} className="block group">
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

        {/* Admin badge */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 px-[10px] py-2 rounded-sm bg-[rgba(255,200,80,0.08)] border border-[rgba(255,200,80,0.2)]">
            <svg viewBox="0 0 14 14" fill="none" stroke="rgba(255,200,80,0.95)" strokeWidth="1.4" className="w-3.5 h-3.5 shrink-0">
              <path d="M7 1l1.8 3.6L13 5.2l-3 2.9.7 4.1L7 10.3l-3.7 2L4 8.1 1 5.2l4.2-.6L7 1z" />
            </svg>
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[rgba(255,200,80,0.95)]">
              {t('title')}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3">
          <NavItem href={base}              icon={Icons.Dashboard} label={t('navDashboard')} isActive={pathname === base} />
          <NavItem href={`${base}/usage`}   icon={Icons.Usage}     label={t('navUsage')}     isActive={isActive(`${base}/usage`)} />
          <NavItem href={`${base}/users`}   icon={Icons.Users}     label={t('navUsers')}     isActive={isActive(`${base}/users`)} />
          <NavItem href={`${base}/coupons`} icon={Icons.Coupons}   label={t('navCoupons')}   isActive={isActive(`${base}/coupons`)} />
          <NavItem href={`${base}/models`}  icon={Icons.Models}    label={t('navModels')}    isActive={isActive(`${base}/models`)} />
        </nav>

        {/* Back to app */}
        <div className="px-3 pb-3 border-t border-[var(--border)] pt-3">
          <Link
            href={`/${locale}/projects`}
            className="flex items-center gap-[9px] px-[10px] py-2 rounded-sm text-[12px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g1)] transition-all duration-[120ms]"
          >
            <span className="w-[15px] h-[15px] shrink-0 opacity-50">{Icons.Back}</span>
            <span>{t('navBackToApp')}</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
