'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GuideSheetForm } from '@/components/entity/GuideSheetForm';
import { GuideAutoPrompt } from '@/components/entity/GuideAutoPrompt';
import { ReferenceImageStrip, ReferenceSlotState } from '@/components/entity/ReferenceImageStrip';
import { Button } from '@/components/ui/Button';
import { CharacterGuideData } from '@/types/entity';

const MOCK_REFS: ReferenceSlotState[] = [
  { type: 'front', imageUrl: 'https://picsum.photos/seed/ref-front/256/256', status: 'ready' },
  { type: 'side', status: 'pending' },
  { type: 'back', status: 'empty' },
];

interface GuidePageProps {
  params: Promise<{ projectId: string; entityId: string }>;
}

export default function GuidePage({ params }: GuidePageProps) {
  const { projectId, entityId } = use(params);
  const t = useTranslations('guide');
  const tCat = useTranslations('entities.category');
  const tDefaults = useTranslations('guide.defaultGuide');

  // Locale-aware mock defaults
  const initialGuide: Partial<CharacterGuideData> = useMemo(() => ({
    physique: tDefaults('physique'),
    height: tDefaults('height'),
    features: tDefaults('features'),
    outfit: tDefaults('outfit'),
    personality: tDefaults('personality'),
    palette: ['#c0c0c0', '#8b0000', '#ffd700', '#1a1a2e'],
  }), [tDefaults]);

  const [guideData, setGuideData] = useState<Partial<CharacterGuideData>>(initialGuide);
  const [autoPrompt, setAutoPrompt] = useState(t('defaultAutoPrompt'));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // Stub
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRegeneratePrompt = async () => {
    await new Promise((r) => setTimeout(r, 1200)); // Stub
    setAutoPrompt(t('defaultAutoPrompt'));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/entities/${entityId}`}
            className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
            <p className="text-[12px] text-[var(--text-3)]">
              {t('headerSubtitle', { name: 'Warrior Alice', category: tCat('character') })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[12px] text-[var(--neon)] font-mono">{t('saved')}</span>}
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? t('saving') : t('save')}
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 min-h-[calc(100vh-60px)]">
        {/* Left: form */}
        <div className="p-6 border-r border-[var(--border)] space-y-6">
          <GuideSheetForm
            category="character"
            data={guideData}
            onChange={setGuideData}
          />
        </div>

        {/* Right: prompt + references */}
        <div className="p-6 space-y-6">
          <GuideAutoPrompt
            prompt={autoPrompt}
            onPromptChange={setAutoPrompt}
            onRegenerate={handleRegeneratePrompt}
          />

          <ReferenceImageStrip
            slots={MOCK_REFS}
            onGenerate={(type) => console.log('Generate reference:', type)}
            onRemove={(type) => console.log('Remove reference:', type)}
          />

          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--g1)]">
            <p className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wide mb-2">
              {t('qualityModeTitle')}
            </p>
            <ul className="space-y-1.5">
              {[
                t('qualityModeStep1'),
                t('qualityModeStep2'),
                t('qualityModeStep3'),
                t('qualityModeStep4'),
              ].map((item) => (
                <li key={item} className="flex items-start gap-1.5 text-[12px] text-[var(--text-2)]">
                  <span className="text-[var(--neon)] mt-0.5 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
