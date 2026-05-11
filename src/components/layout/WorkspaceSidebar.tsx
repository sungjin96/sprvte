'use client';

import { ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ProjectSwitcher, type ProjectItem } from './ProjectSwitcher';
import { UserDropdown } from './UserDropdown';
import { AccordionNavItem, type AccordionSubItem } from './AccordionNavItem';
import { CreditsBadge } from './CreditsBadge';
import type { EntityCategory } from '@/types/entity';
import type { SoundCategory } from '@/types/sound';

export type EntityCounts = Record<EntityCategory | 'all', number>;
export type SoundCounts = Record<SoundCategory | 'all', number>;

interface WorkspaceSidebarProps {
  locale: string;
  projectId: string;
  projectName: string;
  allProjects: ProjectItem[];
  entityCounts: EntityCounts;
  soundCounts: SoundCounts;
  userName: string;
  userEmail: string;
  queueCount: number;
}

const Icons = {
  Entities: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <circle cx="7.5" cy="5" r="2.5" />
      <path d="M2.5 14c0-3 2.5-5 5-5s5 2 5 5" strokeLinecap="round" />
    </svg>
  ),
  Sounds: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <path d="M5.5 2v9.5M5.5 2L11 1v9.5" strokeLinecap="round" />
      <circle cx="4" cy="11.5" r="1.5" />
      <circle cx="9.5" cy="10.5" r="1.5" />
    </svg>
  ),
  AllAssets: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <path d="M7.5 1 1 4.5l6.5 3.5 6.5-3.5L7.5 1Z" />
      <path d="M1 8l6.5 3.5L14 8" />
      <path d="M1 11.5l6.5 3.5 6.5-3.5" />
    </svg>
  ),
  Rembg: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <rect x="2" y="2" width="11" height="11" rx="1.5" strokeDasharray="2 2" />
      <path d="M5.5 7.5l2 2 3-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Scenes: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <rect x="1.5" y="3" width="12" height="9" rx="1.5" />
      <circle cx="5" cy="6.5" r="1" />
      <path d="M2.5 11l3-3 2 2 3-4 2 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <circle cx="7.5" cy="7.5" r="2" />
      <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M3.05 3.05l1.06 1.06M10.9 10.9l1.06 1.06M3.05 11.95l1.06-1.06M10.9 4.1l1.06-1.06" />
    </svg>
  ),
};

const ENTITY_CATEGORIES: EntityCategory[] = ['character', 'map', 'item', 'ui', 'effect'];
const SOUND_CATEGORIES_LIST: SoundCategory[] = ['bgm', 'sfx', 'ambient'];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-medium tracking-[0.08em] uppercase text-[var(--text-3)] px-[6px] mb-1 pt-3 pb-1">
      {children}
    </p>
  );
}

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
          isActive &&
            'opacity-100 [&_path]:stroke-[var(--neon)] [&_circle]:stroke-[var(--neon)] [&_rect]:stroke-[var(--neon)]',
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export function WorkspaceSidebar({
  locale,
  projectId,
  projectName,
  allProjects,
  entityCounts,
  soundCounts,
  userName,
  userEmail,
  queueCount,
}: WorkspaceSidebarProps) {
  const t = useTranslations('workspace');
  const tCat = useTranslations('entities.category');
  const tSoundCat = useTranslations('sounds.category');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const base = `/${locale}/projects/${projectId}`;
  const entitiesBase = `${base}/entities`;
  const soundsBase = `${base}/sounds`;

  const isEntitiesActive = pathname === entitiesBase || pathname.startsWith(`${entitiesBase}/`);
  const isSoundsActive = pathname === soundsBase || pathname.startsWith(`${soundsBase}/`);

  const currentCategory = searchParams?.get('category');

  const entitySubItems: AccordionSubItem[] = [
    {
      key: 'all',
      label: t('allEntities'),
      href: entitiesBase,
      count: entityCounts.all,
      isActive: isEntitiesActive && !currentCategory,
    },
    ...ENTITY_CATEGORIES.map((cat): AccordionSubItem => ({
      key: cat,
      label: tCat(cat),
      href: `${entitiesBase}?category=${cat}`,
      count: entityCounts[cat] ?? 0,
      isActive: isEntitiesActive && currentCategory === cat,
    })),
  ];

  const soundSubItems: AccordionSubItem[] = [
    {
      key: 'all',
      label: t('allSounds'),
      href: soundsBase,
      count: soundCounts.all,
      isActive: isSoundsActive && !currentCategory,
    },
    ...SOUND_CATEGORIES_LIST.map((cat): AccordionSubItem => ({
      key: cat,
      label: tSoundCat(cat),
      href: `${soundsBase}?category=${cat}`,
      count: soundCounts[cat] ?? 0,
      isActive: isSoundsActive && currentCategory === cat,
    })),
  ];

  const allAssetsActive = pathname === `${base}/assets` || pathname.startsWith(`${base}/assets/`);
  const scenesActive = pathname === `${base}/scenes` || pathname.startsWith(`${base}/scenes/`);
  const rembgActive = pathname.startsWith(`${base}/tools/rembg`);
  const projectSettingsActive = pathname === `${base}/settings` || pathname.startsWith(`${base}/settings/`);

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
      <div className="px-4 pt-5 pb-5 border-b border-[var(--border)] flex items-center justify-center">
        <Link href={`/${locale}/projects`} className="block group">
          <Image
            src="/assets/mascot-full.svg"
            alt="Sprvte"
            width={188}
            height={35}
            priority
            className="w-[188px] h-auto group-hover:opacity-90 transition-opacity duration-[120ms]"
          />
        </Link>
      </div>

      <div className="pt-3">
        <ProjectSwitcher
          locale={locale}
          currentProjectId={projectId}
          currentProjectName={projectName}
          projects={allProjects}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <SectionLabel>{t('section')}</SectionLabel>

        <AccordionNavItem
          label={t('entities')}
          icon={Icons.Entities}
          isParentActive={isEntitiesActive}
          subItems={entitySubItems}
        />

        <AccordionNavItem
          label={t('sounds')}
          icon={Icons.Sounds}
          isParentActive={isSoundsActive}
          subItems={soundSubItems}
        />

        <NavItem
          href={`${base}/scenes`}
          icon={Icons.Scenes}
          label={t('scenes')}
          isActive={scenesActive}
        />

        <NavItem
          href={`${base}/assets`}
          icon={Icons.AllAssets}
          label={t('allAssets')}
          isActive={allAssetsActive}
        />

        <SectionLabel>{t('tools')}</SectionLabel>
        <NavItem
          href={`${base}/tools/rembg`}
          icon={Icons.Rembg}
          label={t('rembg')}
          isActive={rembgActive}
        />

        <SectionLabel>{t('settingsSection')}</SectionLabel>
        <NavItem
          href={`${base}/settings`}
          icon={Icons.Settings}
          label={t('projectSettings')}
          isActive={projectSettingsActive}
        />
      </nav>

      <CreditsBadge locale={locale} />

      <UserDropdown
        locale={locale}
        userName={userName}
        userEmail={userEmail}
        queueCount={queueCount}
      />
    </aside>
  );
}
