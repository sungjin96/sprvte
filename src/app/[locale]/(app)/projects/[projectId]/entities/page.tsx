import { notFound, redirect } from 'next/navigation';
import { eq, and, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { db, projects, entities as entitiesTable } from '@/lib/db';
import { Entity } from '@/types/entity';
import { EntitiesView } from './EntitiesView';

interface Props {
  params: Promise<{ locale: string; projectId: string }>;
}

export default async function EntitiesPage({ params }: Props) {
  const { locale, projectId } = await params;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(`/${locale}/auth/login?next=/${locale}/projects/${projectId}/entities`);
  }

  // Verify ownership — prevents URL-guessing another user's project
  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, auth.user.id)));

  if (!project) notFound();

  const rows = await db
    .select()
    .from(entitiesTable)
    .where(eq(entitiesTable.projectId, projectId))
    .orderBy(desc(entitiesTable.updatedAt));

  const entityList: Entity[] = rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    category: r.category as Entity['category'],
    name: r.name,
    description: r.description,
    mode: r.mode as Entity['mode'],
    guideData: (r.guideData ?? {}) as Entity['guideData'],
    autoPrompt: r.autoPrompt,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <EntitiesView locale={locale} projectId={projectId} entities={entityList} />;
}
