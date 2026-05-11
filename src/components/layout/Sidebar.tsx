'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export interface EntityContext {
  id: string;
  name: string;
  category: string;
  mode: 'standard' | 'quality';
  projectId: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  locale: string;
  userName?: string;
  userPlan?: string;
  navItems: NavItem[];
  entityContext?: EntityContext | null;
}

function Sidebar({ locale, userName = 'User', userPlan = 'Free', navItems, entityContext }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('auth.sidebar');

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  // Pick the single most-specific nav item that matches the current path.
  // This prevents `/settings` (parent) and `/settings/providers` (child) from
  // both lighting up at the same time — only the longest match wins.
  const activeHref = navItems
    .map((it) => `/${locale}${it.href}`)
    .filter((href) => pathname === href || pathname.startsWith(href + '/'))
    .reduce((a, b) => (b.length > a.length ? b : a), '');

  return (
    <aside
      className={cn(
        'w-[220px] min-w-[220px] flex flex-col z-10',
        'bg-[rgba(8,8,12,0.6)]',
        'backdrop-blur-[20px] [backdrop-saturate:180%]',
        'border-r border-[var(--border-hi)]',
      )}
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {/* Logo */}
      <div className="px-4 pt-5 pb-5 border-b border-[var(--border)] flex items-center justify-center">
        <Image
          src="/assets/mascot-full.svg"
          alt="Spryte"
          width={188}
          height={35}
          priority
          className="w-[188px] h-auto"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 pt-4 pb-1.5">
          <p className="font-mono text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)] px-[6px] mb-1">
            Workspace
          </p>
          {navItems.map((item) => {
            const itemHref = `/${locale}${item.href}`;
            const isActive = itemHref === activeHref;
            return (
              <Link
                key={item.href}
                href={itemHref}
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
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'font-mono text-[10px] rounded-full px-[6px] py-[1px] border',
                      !isActive && 'bg-[rgba(255,255,255,0.05)] border-[var(--border)] text-[var(--text-3)]',
                      isActive  && 'bg-[rgba(0,229,160,0.08)] border-[rgba(0,229,160,0.2)] text-[rgba(0,229,160,0.7)]',
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Entity context mini-card */}
      {entityContext && (
        <Link
          href={`/${locale}/projects/${entityContext.projectId}/entities/${entityContext.id}`}
          className="mx-3 mb-2 p-2.5 rounded-xl border border-[var(--neon)] bg-[var(--neon-dim)] flex items-center gap-2 hover:bg-[rgba(0,229,160,0.08)] transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-[rgba(0,229,160,0.12)] flex items-center justify-center shrink-0 p-1.5 text-[var(--neon)]">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
              <circle cx="8" cy="5" r="2.5" />
              <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[var(--neon)] truncate">{entityContext.name}</p>
            <p className="text-[10px] font-mono text-[rgba(0,229,160,0.6)] uppercase tracking-wide">
              {entityContext.mode}
            </p>
          </div>
          <svg viewBox="0 0 8 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2 h-3 text-[rgba(0,229,160,0.5)] shrink-0">
            <path d="M1 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}

      {/* User strip */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="flex items-center gap-[9px]">
          <div
            className={cn(
              'w-7 h-7 rounded-full shrink-0 flex items-center justify-center',
              'bg-[var(--g3)] border border-[var(--border-hi)]',
              'text-[11px] font-semibold text-[var(--text)]',
            )}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[var(--text)] truncate">{userName}</p>
            <p className="text-[11px] text-[var(--text-3)] truncate">{userPlan}</p>
          </div>
          <button
            onClick={handleLogout}
            title={t('logout')}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-sm text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-all duration-[120ms] cursor-pointer"
          >
            <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-[13px] h-[13px]">
              <path d="M9 2H12.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9M6 10.5l-3-3 3-3M3 7.5h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export { Sidebar };
export type { NavItem };
