'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Project } from '@/types/project';
import { ProjectCard } from '@/components/project/ProjectCard';
import { ProjectCreateForm } from '@/components/project/ProjectCreateForm';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { createProject } from './actions';

interface ProjectsViewProps {
  projects: Project[];
  assetCounts: Record<string, number>;
}

export function ProjectsView({ projects, assetCounts }: ProjectsViewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleCreate = (data: {
    name: string;
    genre: string;
    artStyle: string;
    basePrompt: string;
    colorPalette: string[];
  }) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await createProject(locale, {
        name: data.name,
        genre: data.genre || null,
        artStyle: data.artStyle || null,
        basePrompt: data.basePrompt || null,
        colorPalette: data.colorPalette,
      });
      if (!result.ok) {
        setSubmitError(
          result.error === 'unauthorized'
            ? t('errors.generic')
            : result.error === 'invalid'
              ? t('errors.nameRequired')
              : t('errors.generic'),
        );
        return;
      }
      setCreateOpen(false);
      router.push(`/${locale}/projects/${result.id}/entities`);
    });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--text)]">
            {t('projects.title')}
          </h1>
          <p className="text-[12px] text-[var(--text-3)]">{projects.length}</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)} className="gap-1.5">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          {t('projects.new')}
        </Button>
      </div>

      <div className="p-6">
        {projects.length === 0 ? (
          <EmptyState
            heading={t('projects.empty')}
            body={t('projects.emptyBody')}
            cta={
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                {t('projects.new')}
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                assetCount={assetCounts[project.id]}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => !pending && setCreateOpen(false)}
        title={t('projects.new')}
        size="md"
      >
        <ProjectCreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          loading={pending}
        />
        {submitError && (
          <p className="mt-3 text-[12px] text-[var(--danger,#ff4d4d)]">{submitError}</p>
        )}
      </Dialog>
    </div>
  );
}
