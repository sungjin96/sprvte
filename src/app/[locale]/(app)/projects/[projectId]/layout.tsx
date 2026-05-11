import { ReactNode } from 'react';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db, projects as projectsTable, entities as entitiesTable } from '@/lib/db';
import { WorkspaceSidebar, type EntityCounts, type SoundCounts } from '@/components/layout/WorkspaceSidebar';
import { CreditsProvider } from '@/lib/credits/CreditsContext';
import type { EntityCategory } from '@/types/entity';

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
}

const EMPTY_ENTITY_COUNTS: EntityCounts = { all: 0, character: 0, map: 0, item: 0, ui: 0, audio: 0, effect: 0 };
const EMPTY_SOUND_COUNTS: SoundCounts = { all: 0, bgm: 0, sfx: 0, ambient: 0 };

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { locale, projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const userEmail = user?.email ?? '';

  // 미인증이면 sidebar를 빈 상태로 렌더 (middleware가 redirect 처리)
  if (!user) {
    return (
      <CreditsProvider initial={0}>
        <div className="flex flex-1 h-full overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
        </div>
      </CreditsProvider>
    );
  }

  // 1. 현재 프로젝트 + 사용자의 전체 프로젝트 목록
  const allProjects = await db
    .select({ id: projectsTable.id, name: projectsTable.name })
    .from(projectsTable)
    .where(eq(projectsTable.userId, user.id))
    .orderBy(projectsTable.updatedAt);

  const currentProject = allProjects.find((p) => p.id === projectId)
    ?? { id: projectId, name: 'Untitled Project' };

  // 2. 엔티티 카운트 (카테고리별)
  const entityCountRows = await db
    .select({
      category: entitiesTable.category,
      n: sql<number>`count(*)::int`,
    })
    .from(entitiesTable)
    .where(and(
      eq(entitiesTable.projectId, projectId),
      eq(entitiesTable.userId, user.id),
    ))
    .groupBy(entitiesTable.category);

  const entityCounts: EntityCounts = { ...EMPTY_ENTITY_COUNTS };
  for (const row of entityCountRows) {
    const cat = row.category as EntityCategory;
    entityCounts[cat] = row.n;
    entityCounts.all += row.n;
  }

  return (
    <CreditsProvider initial={1234}>
      <div className="flex flex-1 h-full overflow-hidden">
        <WorkspaceSidebar
          locale={locale}
          projectId={projectId}
          projectName={currentProject.name}
          allProjects={allProjects}
          entityCounts={entityCounts}
          soundCounts={EMPTY_SOUND_COUNTS}
          userName={userName}
          userEmail={userEmail}
          queueCount={0}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </CreditsProvider>
  );
}
