'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Category = 'image' | 'audio' | 'animation';
type Tier = 'budget' | 'balanced' | 'premium';

interface ModelRow {
  id: string;
  name: string;
  displayName: string;
  category: Category;
  tier: Tier;
  active: boolean;
  creditCost: number;
  lastEditedAt: string;
}

const MOCK_MODELS: ModelRow[] = [
  { id: 'm1', name: 'replicate-sdxl-lightning', displayName: 'SDXL Lightning',  category: 'image',     tier: 'budget',   active: true,  creditCost: 4,  lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm2', name: 'replicate-flux-schnell',   displayName: 'FLUX.1 [schnell]', category: 'image',     tier: 'balanced', active: true,  creditCost: 8,  lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm3', name: 'openai-gpt-image-2',       displayName: 'GPT-Image-2',      category: 'image',     tier: 'premium',  active: false, creditCost: 30, lastEditedAt: '2026-04-20T15:30:00Z' },
  { id: 'm4', name: 'mubert',                   displayName: 'Mubert',           category: 'audio',     tier: 'budget',   active: true,  creditCost: 6,  lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm5', name: 'elevenlabs-sfx',           displayName: 'ElevenLabs SFX',   category: 'audio',     tier: 'balanced', active: true,  creditCost: 3,  lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm6', name: 'suno-v4',                  displayName: 'Suno v4',          category: 'audio',     tier: 'premium',  active: false, creditCost: 25, lastEditedAt: '2026-04-18T08:00:00Z' },
  { id: 'm7', name: 'autosprite',               displayName: 'AutoSprite',       category: 'animation', tier: 'budget',   active: true,  creditCost: 5,  lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm8', name: 'animatediff',              displayName: 'AnimateDiff',      category: 'animation', tier: 'balanced', active: true,  creditCost: 15, lastEditedAt: '2026-04-25T10:00:00Z' },
  { id: 'm9', name: 'runway-gen3-turbo',        displayName: 'Runway Gen-3 Turbo', category: 'animation', tier: 'premium',  active: false, creditCost: 40, lastEditedAt: '2026-04-15T12:00:00Z' },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminModelsPage() {
  const t = useTranslations('admin.models');
  const [models, setModels] = useState<ModelRow[]>(MOCK_MODELS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftCost, setDraftCost] = useState<number>(0);

  const startEdit = (m: ModelRow) => {
    setEditingId(m.id);
    setDraftCost(m.creditCost);
  };

  const saveEdit = (id: string) => {
    setModels((prev) => prev.map((m) =>
      m.id === id ? { ...m, creditCost: draftCost, lastEditedAt: new Date().toISOString() } : m
    ));
    setEditingId(null);
  };

  const toggleActive = (id: string) => {
    setModels((prev) => prev.map((m) =>
      m.id === id ? { ...m, active: !m.active, lastEditedAt: new Date().toISOString() } : m
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="p-6">
        <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
          <div className="grid grid-cols-[2fr_120px_120px_100px_140px_120px_140px] gap-3 px-5 py-3 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            <span>{t('tableModel')}</span>
            <span>{t('tableCategory')}</span>
            <span>{t('tableTier')}</span>
            <span>{t('tableStatus')}</span>
            <span>{t('tableCreditCost')}</span>
            <span>{t('tableLastEdit')}</span>
            <span className="text-right">actions</span>
          </div>
          {models.map((m) => {
            const editing = editingId === m.id;
            return (
              <div
                key={m.id}
                className="grid grid-cols-[2fr_120px_120px_100px_140px_120px_140px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[var(--g1)] transition-colors duration-[100ms] items-center"
              >
                <div className="min-w-0">
                  <p className="text-[13px] text-[var(--text)] truncate">{m.displayName}</p>
                  <p className="font-mono text-[10px] text-[var(--text-3)] truncate">{m.name}</p>
                </div>
                <span className="font-mono text-[11px] uppercase text-[var(--text-2)]">
                  {t(`category${m.category.charAt(0).toUpperCase() + m.category.slice(1)}` as 'categoryImage')}
                </span>
                <span className={cn(
                  'font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-[2px] rounded-[3px] border w-fit',
                  m.tier === 'budget'   && 'bg-[var(--g2)] text-[var(--text-3)] border-[var(--border)]',
                  m.tier === 'balanced' && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
                  m.tier === 'premium'  && 'bg-[rgba(255,200,80,0.08)] text-[rgba(255,200,80,0.95)] border-[rgba(255,200,80,0.2)]',
                )}>
                  {t(`tier${m.tier.charAt(0).toUpperCase() + m.tier.slice(1)}` as 'tierBudget')}
                </span>
                <button
                  type="button"
                  onClick={() => toggleActive(m.id)}
                  className={cn(
                    'w-fit px-2 py-[2px] rounded-[3px] font-mono text-[10px] uppercase tracking-[0.04em] border transition-all duration-[120ms]',
                    m.active
                      ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)] hover:brightness-110'
                      : 'bg-[var(--g2)] text-[var(--text-3)] border-[var(--border)] hover:text-[var(--text-2)]',
                  )}
                >
                  ● {m.active ? t('active') : t('inactive')}
                </button>
                {editing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={draftCost}
                      onChange={(e) => setDraftCost(Number(e.target.value))}
                      autoFocus
                      className="w-20 bg-[rgba(255,255,255,0.04)] border border-[rgba(0,229,160,0.4)] rounded-[6px] text-[12px] font-mono text-[var(--text)] px-2 py-1 outline-none"
                    />
                    <span className="font-mono text-[11px] text-[var(--text-3)]">cr</span>
                  </div>
                ) : (
                  <span className="font-mono text-[12px] text-[var(--neon)]">{m.creditCost} cr</span>
                )}
                <span className="font-mono text-[11px] text-[var(--text-3)]">{formatDate(m.lastEditedAt)}</span>
                <div className="flex justify-end gap-1.5">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-3)] hover:text-[var(--text)] transition-colors duration-[100ms]"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(m.id)}
                        className="px-2.5 py-1 rounded-[6px] text-[10px] font-mono font-semibold text-black bg-[var(--neon)] hover:brightness-110 transition-all duration-[100ms]"
                      >
                        {t('save')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(m)}
                      className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[100ms]"
                    >
                      {t('edit')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
