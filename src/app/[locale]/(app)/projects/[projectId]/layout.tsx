import { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { WorkspaceSidebar, type EntityCounts, type SoundCounts } from '@/components/layout/WorkspaceSidebar';
import { CreditsProvider } from '@/lib/credits/CreditsContext';

// Mock project data until real DB is wired up (Phase S1)
const MOCK_PROJECTS = [
  { id: 'proj-1', name: 'Dragon Quest Remake' },
  { id: 'proj-2', name: 'Space Shooter X' },
];

// Mock counts until DB is wired up (Phase S1)
const MOCK_ENTITY_COUNTS: EntityCounts = {
  all: 4,
  character: 2,
  map: 1,
  item: 1,
  ui: 0,
  effect: 0,
};

const MOCK_SOUND_COUNTS: SoundCounts = {
  all: 6,
  bgm: 2,
  sfx: 3,
  ambient: 1,
};

function getMockProject(projectId: string) {
  return MOCK_PROJECTS.find((p) => p.id === projectId) ?? { id: projectId, name: 'Untitled Project' };
}

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string; projectId: string }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { locale, projectId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const userEmail = user?.email ?? '';

  const project = getMockProject(projectId);

  return (
    <CreditsProvider initial={1234}>
      <div className="flex flex-1 h-full overflow-hidden">
        <WorkspaceSidebar
          locale={locale}
          projectId={projectId}
          projectName={project.name}
          allProjects={MOCK_PROJECTS}
          entityCounts={MOCK_ENTITY_COUNTS}
          soundCounts={MOCK_SOUND_COUNTS}
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
