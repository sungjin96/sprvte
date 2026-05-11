'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AnimationEditor } from '@/components/animation/AnimationEditor';
import { Asset, AnimationSettings } from '@/types/asset';
import { readAnimationMeta } from '@/lib/animation/normalize';

// ── Mock asset (replace with fetch when backend lands) ─────────────────────
const MOCK_SHEET_URL = 'https://picsum.photos/seed/sheetalice/512/128'; // 4×1 grid demo
const MOCK_ASSET: Asset = {
  id: 'ast-anim-1',
  projectId: 'proj-1',
  entityId: 'ent-1',
  name: 'Alice Walk',
  type: 'sprite_sheet',
  status: 'completed',
  fileUrl: MOCK_SHEET_URL,
  metadata: {
    animation: {
      gridCols: 4,
      gridRows: 1,
      frameCount: 4,
      fps: 12,
      loop: 'loop',
      frameOrder: [0, 1, 2, 3],
      frameDurations: [83, 83, 83, 83],
    },
  },
  createdAt: '2026-04-25T10:00:00Z',
  updatedAt: '2026-04-25T10:05:00Z',
};

interface AnimationEditPageProps {
  params: Promise<{ projectId: string; assetId: string }>;
}

export default function AnimationEditPage({ params }: AnimationEditPageProps) {
  const { projectId, assetId } = use(params);
  const t = useTranslations('animation.editor');

  const initialSettings = useMemo<AnimationSettings>(
    () => readAnimationMeta(MOCK_ASSET.metadata),
    [],
  );
  const [settings, setSettings] = useState<AnimationSettings>(initialSettings);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] shrink-0 bg-[rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/assets/${assetId}`}
            className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
            aria-label="Back"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[14px] font-semibold text-[var(--text)]">{t('title')}</h1>
            <p className="text-[11px] text-[var(--text-3)] font-mono">
              {MOCK_ASSET.name} · {settings.frameCount} {t('frameCount').toLowerCase()} · {settings.fps} fps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[var(--text-3)]">
            {settings.gridCols} × {settings.gridRows} {t('gridSize').toLowerCase()}
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden flex">
        <AnimationEditor
          sheetUrl={MOCK_ASSET.fileUrl ?? ''}
          initialSettings={initialSettings}
          onChange={setSettings}
        />
      </div>
    </div>
  );
}
