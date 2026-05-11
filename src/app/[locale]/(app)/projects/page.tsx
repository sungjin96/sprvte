import { redirect } from 'next/navigation';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db, projects as projectsTable, entities as entitiesTable } from '@/lib/db';
import { Project } from '@/types/project';
import { ProjectsView } from './ProjectsView';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsPage({ params }: Props) {
  const { locale } = await params;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    // middleware 가 가드하지만 안전 차원에서 한 번 더.
    redirect(`/${locale}/auth/login?next=/${locale}/projects`);
  }

  const rows = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.userId, auth.user.id))
    .orderBy(desc(projectsTable.updatedAt));

  const projectIds = rows.map((r) => r.id);
  let assetCounts: Record<string, number> = {};
  if (projectIds.length > 0) {
    // 엔티티 개수 = 카드 footer "N assets" 자리에 노출. 추후 자산 테이블 카운트로 교체 예정.
    const counts = await db
      .select({
        projectId: entitiesTable.projectId,
        n: sql<number>`count(*)::int`,
      })
      .from(entitiesTable)
      .where(inArray(entitiesTable.projectId, projectIds))
      .groupBy(entitiesTable.projectId);
    assetCounts = Object.fromEntries(counts.map((c) => [c.projectId, c.n]));
  }

  const data: Project[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    genre: r.genre,
    artStyle: r.artStyle,
    basePrompt: r.basePrompt,
    stylePrompt: r.stylePrompt,
    colorPalette: r.colorPalette ?? [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <ProjectsView projects={data} assetCounts={assetCounts} />;
}
