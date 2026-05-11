'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { EntityCategoryGrid } from '@/components/entity/EntityCategoryGrid';
import { EntityCreateForm, type EntityCreateData } from '@/components/entity/EntityCreateForm';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Entity, EntityCategory } from '@/types/entity';
import { createEntity } from './actions';

interface EntitiesViewProps {
  locale: string;
  projectId: string;
  entities: Entity[];
}

export function EntitiesView({ locale, projectId, entities: initial }: EntitiesViewProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<EntityCategory>('character');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (data: EntityCreateData) => {
    setError(null);
    startTransition(async () => {
      const result = await createEntity(locale, projectId, {
        name: data.name,
        category: data.category,
        mode: data.mode,
        description: data.description || null,
        prompt: data.prompt || null,
        guideData: data.guideData as Record<string, unknown>,
        references: data.references.map((r) => ({
          type: r.type as 'front' | 'side' | 'back' | 'main' | 'style',
          dataUrl: r.dataUrl,
        })),
      });

      if (result.ok) {
        setCreateOpen(false);
        router.refresh();
      } else {
        setError(
          result.error === 'storage_failed'
            ? '이미지 업로드에 실패했습니다. 다시 시도해 주세요.'
            : result.error === 'forbidden'
              ? '이 프로젝트에 접근 권한이 없습니다.'
              : '엔티티 생성에 실패했습니다. 다시 시도해 주세요.',
        );
      }
    });
  };

  const openCreate = (category: EntityCategory) => {
    setDefaultCategory(category);
    setError(null);
    setCreateOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('entities.title')}</h1>
          <p className="text-[12px] text-[var(--text-3)]">{initial.length}</p>
        </div>
        <Button variant="primary" onClick={() => openCreate('character')} className="gap-1.5">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          {t('entities.new')}
        </Button>
      </div>

      {/* Grid */}
      <div className="p-6">
        <EntityCategoryGrid
          locale={locale}
          entities={initial}
          projectId={projectId}
          onCreateInCategory={openCreate}
        />
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title={t('entities.new')} size="lg">
        {error && (
          <p className="mb-4 text-[12px] text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <EntityCreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          defaultCategory={defaultCategory}
          loading={isPending}
        />
      </Dialog>
    </div>
  );
}
