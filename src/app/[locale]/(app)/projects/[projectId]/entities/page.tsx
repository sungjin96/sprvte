'use client';

import { useState, use } from 'react';
import { useTranslations } from 'next-intl';
import { EntityCategoryGrid } from '@/components/entity/EntityCategoryGrid';
import { EntityCreateForm, type EntityCreateData } from '@/components/entity/EntityCreateForm';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Entity, EntityCategory } from '@/types/entity';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_ENTITIES: Entity[] = [
  {
    id: 'ent-1',
    projectId: 'proj-1',
    category: 'character',
    name: 'Warrior Alice',
    description: 'A fierce warrior in silver armor',
    mode: 'quality',
    guideData: {},
    autoPrompt: 'pixel art warrior, silver armor, athletic build, fierce expression',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-28T11:00:00Z',
  },
  {
    id: 'ent-2',
    projectId: 'proj-1',
    category: 'character',
    name: 'Mage Zephyr',
    description: 'Mysterious wind mage',
    mode: 'standard',
    guideData: {},
    createdAt: '2026-04-21T09:00:00Z',
    updatedAt: '2026-04-21T09:00:00Z',
  },
  {
    id: 'ent-3',
    projectId: 'proj-1',
    category: 'map',
    name: 'Dark Forest',
    description: 'Eerie moonlit forest tileset',
    mode: 'quality',
    guideData: {},
    createdAt: '2026-04-22T14:00:00Z',
    updatedAt: '2026-04-22T14:00:00Z',
  },
  {
    id: 'ent-4',
    projectId: 'proj-1',
    category: 'item',
    name: 'Flame Sword',
    description: 'A legendary sword engulfed in flames',
    mode: 'standard',
    guideData: {},
    createdAt: '2026-04-23T10:00:00Z',
    updatedAt: '2026-04-23T10:00:00Z',
  },
  // Pixelation test fixtures — replace imageUrl in MOCK_LAYERS with the user's
  // uploaded character art for end-to-end pixel-art quality verification.
  {
    id: 'ent-pixel-test-1',
    projectId: 'proj-1',
    category: 'character',
    name: 'Spryte Sentinel',
    description: 'Crystal fairy with mint glow, geometric blocky wings — pixel art test subject (full)',
    mode: 'quality',
    guideData: {
      physique: 'slim, ethereal',
      features: 'glowing mint eyes, crystal-shard hair, sharp cheekbones',
      bodyTraits: 'two pairs of geometric mint wings, floating posture',
      outfit: 'translucent white crystal armor with mint inlay',
      personality: 'mischievous, confident',
      palette: ['#FFFFFF', '#00E5A0', '#0A0A0F', '#5EEAB8'],
    },
    autoPrompt: 'chibi pixel art fairy with crystal wings, mint glow, white body, sharp angular blocky pixel art style, transparent background',
    createdAt: '2026-04-29T10:00:00Z',
    updatedAt: '2026-04-29T10:00:00Z',
  },
  {
    id: 'ent-pixel-test-2',
    projectId: 'proj-1',
    category: 'character',
    name: 'Spryte Scout',
    description: 'Minimal fairy form, mint outline wings — pixel art test subject (simple)',
    mode: 'standard',
    guideData: {
      features: 'glowing mint eyes, crystal hair',
      bodyTraits: 'lightning-bolt mint wings (outline only)',
      personality: 'stealthy, alert',
      palette: ['#FFFFFF', '#00E5A0', '#0A0A0F'],
    },
    autoPrompt: 'minimalist chibi pixel art fairy, white body, mint lightning wings, transparent background',
    createdAt: '2026-04-29T10:05:00Z',
    updatedAt: '2026-04-29T10:05:00Z',
  },
];

interface EntitiesPageProps {
  params: Promise<{ projectId: string }>;
}

export default function EntitiesPage({ params }: EntitiesPageProps) {
  const t = useTranslations();
  const { projectId } = use(params);
  const [entities, setEntities] = useState<Entity[]>(MOCK_ENTITIES);
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<EntityCategory>('character');

  const handleCreate = (data: EntityCreateData) => {
    const entity: Entity = {
      id: `ent-${Date.now()}`,
      projectId,
      name: data.name,
      category: data.category,
      mode: data.mode,
      description: data.description,
      autoPrompt: data.prompt,
      guideData: data.guideData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // Mock: real backend enqueues generation + uploads references to Storage.
    console.log('[entity-create] generation params:', {
      model: data.model,
      outputSize: data.outputSize,
      negativePrompt: data.negativePrompt,
      refsCount: data.references.length,
    });
    setEntities((p) => [entity, ...p]);
    setCreateOpen(false);
  };

  const openCreate = (category: EntityCategory) => {
    setDefaultCategory(category);
    setCreateOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div>
          <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('entities.title')}</h1>
          <p className="text-[12px] text-[var(--text-3)]">{entities.length}</p>
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
          entities={entities}
          projectId={projectId}
          onCreateInCategory={openCreate}
        />
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title={t('entities.new')} size="lg">
        <EntityCreateForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          defaultCategory={defaultCategory}
        />
      </Dialog>
    </div>
  );
}
