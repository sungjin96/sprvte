'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

// Mock — replace with DB query Phase S1
const MOCK_SOUND = {
  id: 's1',
  category: 'bgm' as const,
  name: 'battle_theme',
  durationSec: 30,
  bpm: 140,
  key: 'Em',
  genre: 'Fantasy',
  mood: 'Epic',
  modelUsed: 'Mubert',
  prompt: '웅장한 전투 BGM, 빠른 템포, 금관과 현악기',
  creditsCost: 6,
  tags: ['battle', 'epic'],
  fileUrl: null as string | null,
  createdAt: '2026-04-28T10:00:00Z',
  usedIn: [
    { sessionId: 'session-1', sessionName: '보스전 씬' },
  ],
};

interface SoundDetailPageProps {
  params: Promise<{ projectId: string; soundId: string }>;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SoundDetailPage({ params }: SoundDetailPageProps) {
  const { projectId } = use(params);
  const t = useTranslations('sounds.detail');
  const tCat = useTranslations('sounds.category');

  const [name, setName] = useState(MOCK_SOUND.name);
  const [tags, setTags] = useState<string[]>(MOCK_SOUND.tags);
  const [tagInput, setTagInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playPos, setPlayPos] = useState(12);
  const [volume, setVolume] = useState(80);
  const [eqLow, setEqLow] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqHigh, setEqHigh] = useState(2);
  const [trim, setTrim] = useState({ start: 0, end: MOCK_SOUND.durationSec });
  const [fadeIn, setFadeIn] = useState(0.5);
  const [fadeOut, setFadeOut] = useState(1.0);
  const [loopPoint, setLoopPoint] = useState(20);
  const [saving, setSaving] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) return;
    setTags([...tags, tag]);
    setTagInput('');
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-3 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%] flex items-center justify-between"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/sounds`}
            className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">{t('back')}</p>
            <h1 className="text-[16px] font-semibold text-[var(--text)] flex items-baseline gap-2">
              {name}
              <span className="font-mono text-[11px] text-[var(--text-3)]">.{MOCK_SOUND.fileUrl?.endsWith('.wav') ? 'wav' : 'mp3'}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]">
            ↓ {t('download')}
          </button>
          <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]">
            ⟲ {t('regenerate')}
          </button>
          <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[rgba(255,100,100,0.95)] bg-[rgba(255,60,60,0.08)] border border-[rgba(255,60,60,0.2)] hover:bg-[rgba(255,60,60,0.12)] transition-all duration-[120ms]">
            {t('delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-0 min-h-[calc(100vh-60px)]">
        {/* Left: Metadata */}
        <aside className="p-6 border-r border-[var(--border)] space-y-5 overflow-y-auto">
          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
              {t('metadata')}
            </p>
            <dl className="space-y-2 text-[12px]">
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('name')}</dt>
                <dd className="flex-1">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-[var(--border)] text-[var(--text)] py-0.5 outline-none focus:border-[var(--neon)]"
                  />
                </dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('category')}</dt>
                <dd className="flex-1 text-[var(--text-2)]">{tCat(MOCK_SOUND.category)}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('duration')}</dt>
                <dd className="flex-1 text-[var(--text-2)] font-mono">{formatTime(MOCK_SOUND.durationSec)}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('bpm')}</dt>
                <dd className="flex-1 text-[var(--text-2)] font-mono">{MOCK_SOUND.bpm}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('key')}</dt>
                <dd className="flex-1 text-[var(--text-2)] font-mono">{MOCK_SOUND.key}</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
              {t('generationInfo')}
            </p>
            <dl className="space-y-2 text-[12px]">
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('model')}</dt>
                <dd className="flex-1 text-[var(--text-2)] font-mono">{MOCK_SOUND.modelUsed}</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('promptUsed')}</dt>
                <dd className="flex-1 text-[var(--text-2)] leading-snug">"{MOCK_SOUND.prompt}"</dd>
              </div>
              <div className="flex items-baseline gap-3">
                <dt className="w-[70px] text-[var(--text-3)]">{t('creditsUsed')}</dt>
                <dd className="flex-1 text-[var(--neon)] font-mono">{MOCK_SOUND.creditsCost}cr</dd>
              </div>
            </dl>
          </section>

          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
              {t('tags')}
            </p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--g3)] text-[11px] font-mono text-[var(--text-2)]">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((tt) => tt !== tag))}
                    className="text-[var(--text-3)] hover:text-[rgba(255,100,100,0.9)] transition-colors"
                  >
                    <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
                      <path d="M1 1l6 6M7 1L1 7" strokeLinecap="round" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="+"
                className="flex-1 min-w-[60px] bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none px-1"
              />
            </div>
          </section>

          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
              {t('usage')}
            </p>
            {MOCK_SOUND.usedIn.length === 0 ? (
              <p className="text-[12px] text-[var(--text-3)]">{t('noUsage')}</p>
            ) : (
              <ul className="space-y-1">
                {MOCK_SOUND.usedIn.map((u) => (
                  <li key={u.sessionId} className="text-[12px] text-[var(--text-2)] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[var(--text-3)]" />
                    {u.sessionName}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* Right: Track Editor */}
        <main className="p-6 space-y-5 overflow-y-auto">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            {t('trackEditor')}
          </p>

          {/* Big waveform */}
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--g1)] p-4">
            <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="w-full h-[120px] text-[var(--text-3)]">
              {Array.from({ length: 200 }).map((_, i) => {
                const h = 8 + Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.07)) * 80;
                return <rect key={i} x={i * 4} y={(100 - h) / 2} width="2" height={h} fill="currentColor" opacity="0.7" />;
              })}
              {/* Trim markers */}
              <line x1={(trim.start / MOCK_SOUND.durationSec) * 800} y1="0" x2={(trim.start / MOCK_SOUND.durationSec) * 800} y2="100" stroke="var(--neon)" strokeWidth="2" />
              <line x1={(trim.end / MOCK_SOUND.durationSec) * 800} y1="0" x2={(trim.end / MOCK_SOUND.durationSec) * 800} y2="100" stroke="var(--neon)" strokeWidth="2" />
              {/* Loop point */}
              <line x1={(loopPoint / MOCK_SOUND.durationSec) * 800} y1="0" x2={(loopPoint / MOCK_SOUND.durationSec) * 800} y2="100" stroke="rgba(255,200,80,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Play cursor */}
              <line x1={(playPos / MOCK_SOUND.durationSec) * 800} y1="0" x2={(playPos / MOCK_SOUND.durationSec) * 800} y2="100" stroke="var(--neon)" strokeWidth="1" />
            </svg>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-[120ms]',
                  isPlaying ? 'bg-[var(--neon)] text-black shadow-[0_0_12px_var(--neon-glow)]' : 'bg-[var(--g2)] text-[var(--text-2)] hover:bg-[var(--g3)]',
                )}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 12 12" fill="currentColor" className="w-3.5 h-3.5">
                    <rect x="3" y="2.5" width="2" height="7" /><rect x="7" y="2.5" width="2" height="7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 12 12" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M3 2l7 4-7 4z" />
                  </svg>
                )}
              </button>
              <span className="font-mono text-[12px] text-[var(--text-2)]">
                {formatTime(playPos)} / {formatTime(MOCK_SOUND.durationSec)}
              </span>
              <input
                type="range"
                min={0}
                max={MOCK_SOUND.durationSec}
                step={0.1}
                value={playPos}
                onChange={(e) => setPlayPos(Number(e.target.value))}
                className="flex-1 accent-[var(--neon)]"
              />
            </div>
          </div>

          {/* Edit markers */}
          <section className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5 space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                Trim
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-[var(--text-2)]">{formatTime(trim.start)}</span>
                <input type="range" min={0} max={MOCK_SOUND.durationSec} step={0.1} value={trim.start} onChange={(e) => setTrim({ ...trim, start: Number(e.target.value) })} className="flex-1 accent-[var(--neon)]" />
                <input type="range" min={0} max={MOCK_SOUND.durationSec} step={0.1} value={trim.end} onChange={(e) => setTrim({ ...trim, end: Number(e.target.value) })} className="flex-1 accent-[var(--neon)]" />
                <span className="font-mono text-[11px] text-[var(--text-2)]">{formatTime(trim.end)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  Fade In: {fadeIn.toFixed(1)}s
                </label>
                <input type="range" min={0} max={5} step={0.1} value={fadeIn} onChange={(e) => setFadeIn(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  Fade Out: {fadeOut.toFixed(1)}s
                </label>
                <input type="range" min={0} max={5} step={0.1} value={fadeOut} onChange={(e) => setFadeOut(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                Loop point: {formatTime(loopPoint)}
              </label>
              <input type="range" min={0} max={MOCK_SOUND.durationSec} step={0.1} value={loopPoint} onChange={(e) => setLoopPoint(Number(e.target.value))} className="w-full accent-[rgba(255,200,80,0.8)]" />
            </div>
          </section>

          {/* Volume + EQ */}
          <section className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5 space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                Volume: {volume}%
              </label>
              <input type="range" min={0} max={100} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  {t('eqLow')}: {eqLow > 0 ? '+' : ''}{eqLow}dB
                </label>
                <input type="range" min={-12} max={12} step={1} value={eqLow} onChange={(e) => setEqLow(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  {t('eqMid')}: {eqMid > 0 ? '+' : ''}{eqMid}dB
                </label>
                <input type="range" min={-12} max={12} step={1} value={eqMid} onChange={(e) => setEqMid(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  {t('eqHigh')}: {eqHigh > 0 ? '+' : ''}{eqHigh}dB
                </label>
                <input type="range" min={-12} max={12} step={1} value={eqHigh} onChange={(e) => setEqHigh(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold border transition-all duration-[120ms]',
              saving
                ? 'text-[var(--text-3)] bg-[var(--g1)] border-[var(--border)] cursor-not-allowed'
                : 'text-black bg-[var(--neon)] border-transparent shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110',
            )}
          >
            {saving ? t('saving') : t('saveChanges')}
          </button>
        </main>
      </div>
    </div>
  );
}
