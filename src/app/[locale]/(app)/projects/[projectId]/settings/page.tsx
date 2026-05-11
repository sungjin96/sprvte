'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type ArtStyle = 'pixel' | 'vector' | 'watercolor' | '3d' | 'anime' | 'custom';

const STYLE_OPTIONS: { value: ArtStyle; key: string }[] = [
  { value: 'pixel',      key: 'stylePixel' },
  { value: 'vector',     key: 'styleVector' },
  { value: 'watercolor', key: 'styleWatercolor' },
  { value: '3d',         key: 'style3d' },
  { value: 'anime',      key: 'styleAnime' },
  { value: 'custom',     key: 'styleCustomLabel' },
];

const RESOLUTIONS = {
  character:  ['64×64', '128×128', '256×256', '512×512'],
  background: ['256×256', '512×512', '1024×1024'],
  ui:         ['64×64', '128×128', '256×256'],
  audio:      ['15s', '30s', '60s'],
};

function FormSection({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-[14px] border p-6',
        'bg-[rgba(255,255,255,0.04)] backdrop-blur-[20px] [backdrop-saturate:180%]',
        danger ? 'border-[rgba(255,80,80,0.2)]' : 'border-[var(--border)]',
      )}
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      <header className="mb-5">
        <h2 className={cn(
          'text-[14px] font-semibold mb-1',
          danger ? 'text-[rgba(255,100,100,0.95)]' : 'text-[var(--text)]',
        )}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12px] text-[var(--text-3)]">{subtitle}</p>
        )}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
      {children}
    </label>
  );
}

const FIELD_CLS =
  'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3.5 py-2.5 outline-none transition-colors duration-[120ms] placeholder:text-[var(--text-3)] focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)]';

export default function ProjectSettingsPage() {
  const t = useTranslations('projectSettings');

  const [name, setName] = useState('Dragon Quest Remake');
  const [description, setDescription] = useState('16비트 RPG 리메이크. 픽셀 아트.');
  const [artStyle, setArtStyle] = useState<ArtStyle>('pixel');
  const [styleDesc, setStyleDesc] = useState('');
  const [palette, setPalette] = useState<string[]>(['#A0522D', '#1F2937', '#FBBF24', '#EF4444', '#10B981']);
  const [moodboard, setMoodboard] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState({
    character: '256×256',
    background: '512×512',
    ui: '128×128',
    audio: '30s',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handlePaletteChange = (idx: number, color: string) => {
    setPalette((p) => p.map((c, i) => (i === idx ? color : c)));
  };

  const removeMoodboardItem = (idx: number) => {
    setMoodboard((m) => m.filter((_, i) => i !== idx));
  };

  const canDelete = deleteConfirm.trim() === name.trim();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-6 flex flex-col gap-5">
        {/* A. Basics */}
        <FormSection title={t('basicTitle')}>
          <div>
            <FieldLabel>{t('fieldName')}</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={FIELD_CLS}
            />
          </div>
          <div>
            <FieldLabel>{t('fieldDescription')}</FieldLabel>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(FIELD_CLS, 'resize-none font-sans')}
            />
          </div>
        </FormSection>

        {/* B. Art Style Guide */}
        <FormSection title={t('styleTitle')}>
          <div>
            <FieldLabel>{t('styleType')}</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_OPTIONS.map((opt) => {
                const active = artStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setArtStyle(opt.value)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-[12px] font-medium font-mono border',
                      'transition-all duration-[120ms]',
                      active
                        ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.3)] shadow-[0_0_8px_rgba(0,229,160,0.15)]'
                        : 'bg-transparent text-[var(--text-2)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text)]',
                    )}
                  >
                    {t(opt.key)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel>{t('stylePalette')}</FieldLabel>
            <div className="flex gap-2">
              {palette.map((color, idx) => (
                <label
                  key={idx}
                  className="relative w-12 h-12 rounded-[10px] border border-[var(--border-hi)] cursor-pointer overflow-hidden hover:border-[rgba(0,229,160,0.4)] transition-colors duration-[120ms]"
                  style={{ background: color }}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handlePaletteChange(idx, e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>{t('styleCustom')}</FieldLabel>
            <textarea
              value={styleDesc}
              onChange={(e) => setStyleDesc(e.target.value)}
              rows={2}
              placeholder={t('styleCustomPlaceholder')}
              className={cn(FIELD_CLS, 'resize-none font-sans')}
            />
          </div>
        </FormSection>

        {/* C. Moodboard */}
        <FormSection title={t('moodboardTitle')} subtitle={t('moodboardSubtitle')}>
          <div className="flex gap-3">
            {moodboard.map((url, idx) => (
              <div
                key={idx}
                className="relative w-[120px] h-[120px] rounded-[12px] border border-[var(--border)] bg-[var(--g1)] overflow-hidden group"
              >
                <button
                  type="button"
                  onClick={() => removeMoodboardItem(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[rgba(0,0,0,0.7)] text-[var(--text-2)] hover:text-[var(--text)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]"
                  title={t('moodboardRemove')}
                >
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            {moodboard.length < 3 && (
              <button
                type="button"
                className="w-[120px] h-[120px] rounded-[12px] border-2 border-dashed border-[var(--border-hi)] bg-transparent hover:border-[rgba(0,229,160,0.4)] hover:bg-[rgba(0,229,160,0.04)] transition-all duration-[120ms] flex flex-col items-center justify-center gap-1.5 text-[var(--text-3)] hover:text-[var(--text-2)]"
              >
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                  <path d="M9 3v12M3 9h12" strokeLinecap="round" />
                </svg>
                <span className="text-[11px] font-mono uppercase tracking-[0.04em]">{t('moodboardUpload')}</span>
              </button>
            )}
          </div>
        </FormSection>

        {/* D. Default Resolutions */}
        <FormSection title={t('resolutionTitle')} subtitle={t('resolutionSubtitle')}>
          {(Object.keys(RESOLUTIONS) as Array<keyof typeof RESOLUTIONS>).map((key) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-[13px] text-[var(--text-2)]">
                {t(`type${key.charAt(0).toUpperCase() + key.slice(1)}` as 'typeCharacter' | 'typeBackground' | 'typeUi' | 'typeAudio')}
              </span>
              <select
                value={resolutions[key]}
                onChange={(e) => setResolutions((r) => ({ ...r, [key]: e.target.value }))}
                className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[12px] font-mono text-[var(--text)] px-3 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)] min-w-[120px]"
              >
                {RESOLUTIONS[key].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </FormSection>

        {/* E. Danger Zone */}
        <FormSection title={t('dangerTitle')} subtitle={t('dangerSubtitle')} danger>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-[var(--text)] mb-1">{t('deleteProject')}</p>
              <p className="text-[12px] text-[var(--text-3)]">{t('deleteWarning')}</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); }}
              className="shrink-0 px-3.5 py-2 rounded-[8px] text-[13px] font-medium text-[rgba(255,100,100,0.95)] bg-[rgba(255,60,60,0.08)] border border-[rgba(255,60,60,0.2)] hover:bg-[rgba(255,60,60,0.12)] hover:border-[rgba(255,60,60,0.35)] transition-all duration-[120ms]"
            >
              {t('deleteProject')}
            </button>
          </div>
        </FormSection>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] border border-[rgba(255,80,80,0.2)] bg-[rgba(20,15,15,0.97)] backdrop-blur-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[rgba(255,100,100,0.95)] mb-2">
              {t('deleteProject')}
            </h3>
            <p className="text-[12px] text-[var(--text-2)] mb-5">{t('deleteWarning')}</p>

            <FieldLabel>{t('deleteConfirmLabel')}</FieldLabel>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={name}
              className={cn(FIELD_CLS, 'mb-5')}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!canDelete}
                className={cn(
                  'px-3.5 py-2 rounded-[8px] text-[13px] font-medium border',
                  'transition-all duration-[120ms]',
                  canDelete
                    ? 'text-white bg-[rgba(255,60,60,0.6)] border-[rgba(255,60,60,0.6)] hover:bg-[rgba(255,60,60,0.75)] hover:border-[rgba(255,60,60,0.75)] cursor-pointer'
                    : 'text-[var(--text-3)] bg-[rgba(255,60,60,0.08)] border-[rgba(255,60,60,0.2)] cursor-not-allowed',
                )}
              >
                {t('deleteConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
