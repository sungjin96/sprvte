'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SceneSummary {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbUrl?: string | null;
  placementCount: number;
  createdAt: string;
}

const MOCK_SCENES: SceneSummary[] = [
  { id: 'scene-1', name: '보스전', width: 1920, height: 1080, thumbUrl: 'https://picsum.photos/seed/scene1/256/144', placementCount: 8, createdAt: '2026-04-28T14:00:00Z' },
  { id: 'scene-2', name: '마을 광장', width: 1920, height: 1080, thumbUrl: 'https://picsum.photos/seed/scene2/256/144', placementCount: 12, createdAt: '2026-04-27T10:00:00Z' },
  { id: 'scene-3', name: '던전 입구', width: 1920, height: 1080, thumbUrl: 'https://picsum.photos/seed/scene3/256/144', placementCount: 5, createdAt: '2026-04-26T15:00:00Z' },
];

interface PageProps {
  params: Promise<{ locale: string; projectId: string }>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ScenesPage({ params }: PageProps) {
  const { locale, projectId } = use(params);
  const t = useTranslations('scenes');
  const [scenes] = useState<SceneSummary[]>(MOCK_SCENES);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%] flex items-center justify-between"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
          <span className="font-mono text-[12px] text-[var(--text-3)]">{t('subtitle', { n: scenes.length })}</span>
        </div>
        <button
          type="button"
          onClick={() => { setShowCreate(true); setNewName(''); }}
          className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-black bg-[var(--neon)] shadow-[0_0_12px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]"
        >
          {t('newScene')}
        </button>
      </div>

      <div className="p-6">
        {scenes.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center">
            <p className="text-[14px] text-[var(--text)] mb-1">{t('empty')}</p>
            <p className="text-[12px] text-[var(--text-3)] mb-4">{t('emptyHint')}</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-3.5 py-2 rounded-[8px] text-[13px] font-semibold text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]"
            >
              {t('newScene')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenes.map((s) => (
              <Link
                key={s.id}
                href={`/${locale}/projects/${projectId}/scenes/${s.id}`}
                className="group rounded-[12px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden hover:border-[rgba(0,229,160,0.25)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms]"
              >
                <div className="aspect-video bg-[var(--g1)] overflow-hidden">
                  {s.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumbUrl} alt={s.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-medium text-[var(--text)] truncate mb-1">{s.name}</p>
                  <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-3)]">
                    <span>{s.width}×{s.height}</span>
                    <span>{s.placementCount} placements · {formatDate(s.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] border border-[var(--border-hi)] bg-[rgba(20,20,28,0.97)] backdrop-blur-[20px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[var(--text)] mb-5">{t('newScene')}</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('namePlaceholder')}
              autoFocus
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] mb-5 placeholder:text-[var(--text-3)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={!newName.trim()}
                className={cn(
                  'px-3.5 py-2 rounded-[8px] text-[13px] font-semibold transition-all duration-[120ms]',
                  newName.trim()
                    ? 'text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110'
                    : 'text-[var(--text-3)] bg-[var(--g1)] cursor-not-allowed',
                )}
              >
                {t('create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
