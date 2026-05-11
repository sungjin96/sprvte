'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Sound, SoundCategory, MultitrackClip } from '@/types/sound';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_SOUNDS: Sound[] = [
  { id: 's1', projectId: 'proj-1', category: 'bgm', name: 'battle_theme', status: 'completed', durationSec: 30, bpm: 140, key: 'Em', genre: 'Fantasy', mood: 'Epic', createdAt: '2026-04-28T10:00:00Z', updatedAt: '2026-04-28T10:00:00Z' },
  { id: 's2', projectId: 'proj-1', category: 'bgm', name: 'village_calm', status: 'completed', durationSec: 60, bpm: 80, genre: 'Folk', mood: 'Peaceful', createdAt: '2026-04-27T14:00:00Z', updatedAt: '2026-04-27T14:00:00Z' },
  { id: 's3', projectId: 'proj-1', category: 'sfx', name: 'sword_hit', status: 'completed', durationSec: 1.2, createdAt: '2026-04-27T11:00:00Z', updatedAt: '2026-04-27T11:00:00Z' },
  { id: 's4', projectId: 'proj-1', category: 'sfx', name: 'explosion', status: 'completed', durationSec: 2.5, createdAt: '2026-04-26T19:00:00Z', updatedAt: '2026-04-26T19:00:00Z' },
  { id: 's5', projectId: 'proj-1', category: 'sfx', name: 'ui_click', status: 'completed', durationSec: 0.3, createdAt: '2026-04-26T15:00:00Z', updatedAt: '2026-04-26T15:00:00Z' },
  { id: 's6', projectId: 'proj-1', category: 'ambient', name: 'forest_night', status: 'completed', durationSec: 120, mood: 'Mysterious', createdAt: '2026-04-25T22:00:00Z', updatedAt: '2026-04-25T22:00:00Z' },
];

const MOCK_CLIPS: MultitrackClip[] = [
  { id: 'c1', soundId: 's1', trackIndex: 0, startSec: 0, endSec: 30, volume: 0.8 },
  { id: 'c2', soundId: 's3', trackIndex: 1, startSec: 5, endSec: 6.2, volume: 1.0 },
  { id: 'c3', soundId: 's4', trackIndex: 1, startSec: 14, endSec: 16.5, volume: 0.9 },
  { id: 'c4', soundId: 's5', trackIndex: 2, startSec: 8, endSec: 8.3, volume: 0.7 },
  { id: 'c5', soundId: 's5', trackIndex: 2, startSec: 22, endSec: 22.3, volume: 0.7 },
  { id: 'c6', soundId: 's6', trackIndex: 3, startSec: 0, endSec: 30, volume: 0.5 },
];

const TRACK_LABELS = ['BGM', 'SFX 1', 'SFX 2', 'AMB'];
const GENRES = ['Fantasy', 'SciFi', 'Horror', 'Folk', 'Cinematic', 'Synthwave'];
const MOODS = ['Epic', 'Peaceful', 'Tense', 'Mysterious', 'Joyful', 'Melancholic'];
const MODELS_BY_CATEGORY: Record<SoundCategory, { value: string; label: string; cost: number }[]> = {
  bgm: [
    { value: 'mubert', label: 'Mubert', cost: 6 },
    { value: 'suno-v4', label: 'Suno v4 (프리미엄)', cost: 25 },
  ],
  sfx: [
    { value: 'elevenlabs-sfx', label: 'ElevenLabs SFX', cost: 3 },
    { value: 'mubert', label: 'Mubert', cost: 6 },
  ],
  ambient: [
    { value: 'mubert', label: 'Mubert', cost: 6 },
    { value: 'suno-v4', label: 'Suno v4 (프리미엄)', cost: 25 },
  ],
};

const PIXELS_PER_SEC = 24;
const TIMELINE_DURATION = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Library Panel ─────────────────────────────────────────────────────────────
function LibraryPanel({
  sounds,
  selectedSoundId,
  onSelect,
  playingId,
}: {
  sounds: Sound[];
  selectedSoundId: string | null;
  onSelect: (id: string) => void;
  playingId: string | null;
}) {
  const t = useTranslations('sounds');
  const tCat = useTranslations('sounds.category');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SoundCategory | 'all'>('all');

  const filtered = useMemo(() => {
    let list = sounds;
    if (filter !== 'all') list = list.filter((s) => s.category === filter);
    if (search) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [sounds, filter, search]);

  const groups: Record<SoundCategory, Sound[]> = {
    bgm: filtered.filter((s) => s.category === 'bgm'),
    sfx: filtered.filter((s) => s.category === 'sfx'),
    ambient: filtered.filter((s) => s.category === 'ambient'),
  };

  return (
    <aside className="w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--g1)] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[var(--border)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
          {t('library.title')}
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('library.search')}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[12px] text-[var(--text)] px-2.5 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)] mb-2 placeholder:text-[var(--text-3)]"
        />

        <div className="flex gap-1">
          {(['all', 'bgm', 'sfx', 'ambient'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={cn(
                'flex-1 px-2 py-1 rounded-[6px] text-[10px] font-mono uppercase tracking-[0.04em] border',
                'transition-all duration-[100ms]',
                filter === cat
                  ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                  : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
              )}
            >
              {cat === 'all' ? t('library.filterAll') : tCat(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-[12px] text-[var(--text-2)] mb-1">{t('library.empty')}</p>
            <p className="text-[11px] text-[var(--text-3)]">{t('library.emptyHint')}</p>
          </div>
        ) : (
          (['bgm', 'sfx', 'ambient'] as SoundCategory[]).map((cat) => {
            const items = groups[cat];
            if (!items.length) return null;
            return (
              <div key={cat} className="mb-3">
                <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] flex justify-between">
                  <span>{tCat(cat)}</span>
                  <span>{items.length}</span>
                </p>
                {items.map((s) => {
                  const active = s.id === selectedSoundId;
                  const playing = s.id === playingId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors duration-[100ms]',
                        active
                          ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
                          : 'text-[var(--text-2)] hover:bg-[var(--g2)] hover:text-[var(--text)]',
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', active ? 'bg-[var(--neon)]' : 'bg-[var(--text-3)]')} />
                      <span className="flex-1 truncate">{s.name}</span>
                      {playing && (
                        <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-[var(--neon)] animate-pulse">
                          <path d="M3 2l7 4-7 4z" />
                        </svg>
                      )}
                      <span className="font-mono text-[10px] text-[var(--text-3)]">
                        {formatTime(s.durationSec ?? 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

// ── Multitrack Timeline ───────────────────────────────────────────────────────
function MultitrackTimeline({
  clips,
  sounds,
  isPlaying,
  cursorSec,
  onTogglePlay,
  onStop,
  onSelectClip,
  selectedClipId,
}: {
  clips: MultitrackClip[];
  sounds: Sound[];
  isPlaying: boolean;
  cursorSec: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onSelectClip: (id: string) => void;
  selectedClipId: string | null;
}) {
  const t = useTranslations('sounds.timeline');
  const trackHeight = 64;
  const headerWidth = 100;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--g1)]">
      {/* Transport controls + ruler */}
      <div className="flex border-b border-[var(--border)]">
        <div style={{ width: headerWidth }} className="shrink-0 p-2 border-r border-[var(--border)] flex items-center gap-1">
          <button
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? t('pause') : t('play')}
            className={cn(
              'w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors duration-[100ms]',
              isPlaying
                ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
                : 'bg-[var(--g2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g3)]',
            )}
          >
            {isPlaying ? (
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                <rect x="3" y="2.5" width="2" height="7" /><rect x="7" y="2.5" width="2" height="7" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                <path d="M3 2l7 4-7 4z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onStop}
            title={t('stop')}
            className="w-7 h-7 rounded-[6px] bg-[var(--g2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g3)] flex items-center justify-center transition-colors duration-[100ms]"
          >
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3"><rect x="3" y="3" width="6" height="6" /></svg>
          </button>
        </div>
        <div className="flex-1 relative h-9 bg-[rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 flex">
            {Array.from({ length: TIMELINE_DURATION + 1 }).map((_, i) => {
              const isMajor = i % 5 === 0;
              return (
                <div
                  key={i}
                  className="border-r border-[var(--border)] relative"
                  style={{ width: PIXELS_PER_SEC }}
                >
                  {isMajor && (
                    <span className="absolute top-1 left-1 font-mono text-[9px] text-[var(--text-3)]">
                      {formatTime(i)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Track lanes */}
      <div className="relative">
        {TRACK_LABELS.map((label, idx) => (
          <div key={label} className="flex border-b border-[var(--border)]" style={{ height: trackHeight }}>
            {/* Track header */}
            <div style={{ width: headerWidth }} className="shrink-0 px-3 py-2 border-r border-[var(--border)] bg-[var(--g2)] flex flex-col justify-between">
              <span className="font-mono text-[11px] text-[var(--text)] truncate">{label}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="w-5 h-5 rounded-[4px] text-[10px] font-mono text-[var(--text-3)] bg-[var(--g1)] hover:text-[var(--neon)] hover:bg-[var(--neon-dim)] transition-all duration-[100ms]"
                  title={t('solo')}
                >
                  {t('solo')}
                </button>
                <button
                  type="button"
                  className="w-5 h-5 rounded-[4px] text-[10px] font-mono text-[var(--text-3)] bg-[var(--g1)] hover:text-[rgba(255,150,150,0.9)] hover:bg-[rgba(255,60,60,0.1)] transition-all duration-[100ms]"
                  title={t('mute')}
                >
                  {t('mute')}
                </button>
              </div>
            </div>

            {/* Lane body */}
            <div className="flex-1 relative bg-[rgba(255,255,255,0.02)]">
              {/* Grid lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {Array.from({ length: TIMELINE_DURATION + 1 }).map((_, i) => (
                  <div key={i} className="border-r border-[rgba(255,255,255,0.03)]" style={{ width: PIXELS_PER_SEC }} />
                ))}
              </div>

              {/* Clips on this track */}
              {clips.filter((c) => c.trackIndex === idx).map((clip) => {
                const sound = sounds.find((s) => s.id === clip.soundId);
                const left = clip.startSec * PIXELS_PER_SEC;
                const width = (clip.endSec - clip.startSec) * PIXELS_PER_SEC;
                const selected = clip.id === selectedClipId;
                return (
                  <div
                    key={clip.id}
                    onClick={() => onSelectClip(clip.id)}
                    className={cn(
                      'absolute top-2 bottom-2 rounded-[4px] border cursor-pointer overflow-hidden',
                      'transition-all duration-[120ms]',
                      selected
                        ? 'border-[var(--neon)] bg-[rgba(0,229,160,0.25)] shadow-[0_0_8px_var(--neon-glow)]'
                        : 'border-[rgba(0,229,160,0.4)] bg-[rgba(0,229,160,0.12)] hover:bg-[rgba(0,229,160,0.18)]',
                    )}
                    style={{ left, width }}
                  >
                    {/* Mini waveform placeholder */}
                    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-50">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const h = 6 + Math.abs(Math.sin(i * 0.7)) * 16;
                        return <rect key={i} x={i * 3.3 + 1} y={(32 - h) / 2} width="2" height={h} fill="currentColor" />;
                      })}
                    </svg>
                    <span className="absolute top-1 left-1.5 font-mono text-[9px] text-[var(--text)] truncate max-w-[calc(100%-12px)]">
                      {sound?.name ?? clip.soundId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Timeline cursor */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: headerWidth + cursorSec * PIXELS_PER_SEC,
            width: 1,
            background: 'var(--neon)',
            boxShadow: '0 0 4px var(--neon-glow)',
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3 h-3" style={{
            background: 'var(--neon)',
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Track Detail ──────────────────────────────────────────────────────────────
function TrackDetailEditor({
  selectedClip,
  selectedSound,
}: {
  selectedClip: MultitrackClip | null;
  selectedSound: Sound | null;
}) {
  const t = useTranslations('sounds.trackDetail');

  if (!selectedClip || !selectedSound) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-[12px] text-[var(--text-3)]">{t('selectPrompt')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="mb-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-1">
          {t('title')}
        </p>
        <p className="text-[14px] text-[var(--text)]">
          {TRACK_LABELS[selectedClip.trackIndex]} · <span className="font-mono text-[12px] text-[var(--text-2)]">{selectedSound.name}</span>
        </p>
      </div>

      {/* Mock waveform — bars */}
      <div className="rounded-[10px] bg-[var(--g1)] border border-[var(--border)] p-3 mb-4 h-[80px] flex items-center">
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="w-full h-full text-[var(--text-3)]">
          {Array.from({ length: 200 }).map((_, i) => {
            const h = 6 + Math.abs(Math.sin(i * 0.3) * Math.cos(i * 0.05)) * 48;
            return <rect key={i} x={i * 4} y={(60 - h) / 2} width="2" height={h} fill="currentColor" opacity="0.6" />;
          })}
          {/* Trim markers */}
          <line x1="40" y1="0" x2="40" y2="60" stroke="var(--neon)" strokeWidth="2" />
          <line x1="760" y1="0" x2="760" y2="60" stroke="var(--neon)" strokeWidth="2" />
          {/* Loop point */}
          <line x1="600" y1="0" x2="600" y2="60" stroke="rgba(255,200,80,0.7)" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      </div>

      {/* Sliders grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('trim')}
          </label>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-2)]">
            <span className="font-mono">{formatTime(selectedClip.startSec)}</span>
            <input type="range" min={0} max={selectedSound.durationSec ?? 30} step={0.1} defaultValue={selectedClip.startSec} className="flex-1 accent-[var(--neon)]" />
            <input type="range" min={0} max={selectedSound.durationSec ?? 30} step={0.1} defaultValue={selectedClip.endSec} className="flex-1 accent-[var(--neon)]" />
            <span className="font-mono">{formatTime(selectedClip.endSec)}</span>
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('volume')}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={100} defaultValue={Math.round(selectedClip.volume * 100)} className="flex-1 accent-[var(--neon)]" />
            <span className="font-mono text-[12px] text-[var(--text-2)] w-9 text-right">{Math.round(selectedClip.volume * 100)}%</span>
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('fadeIn')}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={5} step={0.1} defaultValue={0.5} className="flex-1 accent-[var(--neon)]" />
            <span className="font-mono text-[12px] text-[var(--text-2)] w-9 text-right">0.5s</span>
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('fadeOut')}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={5} step={0.1} defaultValue={1.0} className="flex-1 accent-[var(--neon)]" />
            <span className="font-mono text-[12px] text-[var(--text-2)] w-9 text-right">1.0s</span>
          </div>
        </div>

        <div className="col-span-2">
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('loopPoint')}
          </label>
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={selectedSound.durationSec ?? 30} step={0.1} defaultValue={20} className="flex-1 accent-[var(--neon)]" />
            <span className="font-mono text-[12px] text-[var(--text-2)] w-12 text-right">{formatTime(20)}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]">
          ▶ {t('playTrackOnly')}
        </button>
        <button className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]">
          ↺ {t('rewind')}
        </button>
        <button className="ml-auto px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-black bg-[var(--neon)] shadow-[0_0_12px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]">
          {t('saveChanges')}
        </button>
      </div>
    </div>
  );
}

// ── AI Generate Form ──────────────────────────────────────────────────────────
function SoundGenerateForm() {
  const t = useTranslations('sounds.generate');
  const tCat = useTranslations('sounds.category');
  const [category, setCategory] = useState<SoundCategory>('bgm');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('Fantasy');
  const [mood, setMood] = useState('Epic');
  const [bpm, setBpm] = useState(120);
  const [duration, setDuration] = useState(30);
  const [loopable, setLoopable] = useState(false);
  const [model, setModel] = useState('mubert');
  const [generating, setGenerating] = useState(false);

  const models = MODELS_BY_CATEGORY[category];
  const cost = models.find((m) => m.value === model)?.cost ?? 6;

  // Reset model when category changes
  useEffect(() => {
    if (!models.find((m) => m.value === model)) {
      setModel(models[0].value);
    }
  }, [category, model, models]);

  return (
    <aside className="w-[320px] shrink-0 border-l border-[var(--border)] bg-[var(--g1)] flex flex-col overflow-y-auto">
      <div className="p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
          {t('title')}
        </p>

        <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
          {t('category')}
        </label>
        <div className="flex gap-1.5 mb-4">
          {(['bgm', 'sfx', 'ambient'] as SoundCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'flex-1 px-2 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-[0.04em] border transition-all duration-[120ms]',
                category === c
                  ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.3)]'
                  : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
              )}
            >
              {tCat(c)}
            </button>
          ))}
        </div>

        <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
          {t('prompt')}
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder={t('promptPlaceholder')}
          className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] px-3 py-2 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] resize-none mb-4"
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
              {t('genre')}
            </label>
            <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[11px] font-mono text-[var(--text)] px-2 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)]">
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
              {t('mood')}
            </label>
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[11px] font-mono text-[var(--text)] px-2 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)]">
              {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('bpm')}: {bpm}
          </label>
          <input type="range" min={60} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
        </div>

        <div className="mb-3">
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
            {t('duration')}: {duration}s
          </label>
          <input type="range" min={5} max={120} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full accent-[var(--neon)]" />
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input type="checkbox" checked={loopable} onChange={(e) => setLoopable(e.target.checked)} className="accent-[var(--neon)] w-4 h-4" />
          <span className="text-[12px] text-[var(--text-2)]">{t('loopable')}</span>
        </label>

        <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
          {t('model')}
        </label>
        <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[11px] font-mono text-[var(--text)] px-2 py-1.5 outline-none focus:border-[rgba(0,229,160,0.3)] mb-4">
          {models.map((m) => <option key={m.value} value={m.value}>{m.label} ({m.cost}cr)</option>)}
        </select>

        <p className="font-mono text-[11px] text-[var(--text-3)] mb-3">
          {t('estimatedCost', { n: cost })}
        </p>

        <button
          type="button"
          disabled={!prompt.trim() || generating}
          onClick={() => {
            setGenerating(true);
            setTimeout(() => setGenerating(false), 2500);
          }}
          className={cn(
            'w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold border transition-all duration-[120ms]',
            !prompt.trim() || generating
              ? 'text-[var(--text-3)] bg-[var(--g1)] border-[var(--border)] cursor-not-allowed'
              : 'text-black bg-[var(--neon)] border-transparent shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 hover:shadow-[0_0_28px_var(--neon-glow)]',
          )}
        >
          {generating ? t('generating') : t('generate')}
        </button>
      </div>
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SoundsPage() {
  const t = useTranslations('sounds');
  const [sounds] = useState<Sound[]>(MOCK_SOUNDS);
  const [clips] = useState<MultitrackClip[]>(MOCK_CLIPS);
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>('c1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursorSec, setCursorSec] = useState(0);
  const [mixingDown, setMixingDown] = useState(false);
  const playStartRef = useRef<number>(0);
  const playStartCursorRef = useRef<number>(0);

  // Animate cursor while playing
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - playStartRef.current) / 1000;
      const next = playStartCursorRef.current + elapsed;
      if (next >= TIMELINE_DURATION) {
        setCursorSec(0);
        setIsPlaying(false);
        return;
      }
      setCursorSec(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      playStartRef.current = performance.now();
      playStartCursorRef.current = cursorSec >= TIMELINE_DURATION ? 0 : cursorSec;
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCursorSec(0);
  };

  const playingSoundId = isPlaying ? clips.find((c) => cursorSec >= c.startSec && cursorSec <= c.endSec && c.trackIndex === 0)?.soundId ?? null : null;

  const selectedClip = clips.find((c) => c.id === selectedClipId) ?? null;
  const selectedSound = selectedClip ? sounds.find((s) => s.id === selectedClip.soundId) ?? null : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-3 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%] flex items-center justify-between"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="flex items-baseline gap-3">
          <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
          <span className="font-mono text-[12px] text-[var(--text-3)]">{t('subtitle', { n: sounds.length })}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMixingDown(true);
              setTimeout(() => setMixingDown(false), 2000);
            }}
            disabled={mixingDown}
            className="px-3 py-1.5 rounded-[8px] text-[12px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms] disabled:opacity-50"
          >
            {mixingDown ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-[var(--border-hi)] border-t-[var(--neon)] animate-spin" />
                {t('timeline.mixingDown')}
              </span>
            ) : t('timeline.mixDown')}
          </button>
        </div>
      </div>

      {/* Body grid */}
      <div className="flex-1 flex overflow-hidden">
        <LibraryPanel sounds={sounds} selectedSoundId={selectedSoundId} onSelect={setSelectedSoundId} playingId={playingSoundId} />

        {/* Main = timeline + track detail */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MultitrackTimeline
            clips={clips}
            sounds={sounds}
            isPlaying={isPlaying}
            cursorSec={cursorSec}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
            onSelectClip={setSelectedClipId}
            selectedClipId={selectedClipId}
          />
          <TrackDetailEditor selectedClip={selectedClip} selectedSound={selectedSound} />
        </div>

        <SoundGenerateForm />
      </div>
    </div>
  );
}
