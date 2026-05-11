'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { LiveLayer, LayerEditEntry } from '@/types/liveLayer';

interface LiveChatProps {
  activeLayer: LiveLayer | null;
  history: LayerEditEntry[];
  onSubmit: (prompt: string) => void;
  onRevert?: (entryId: string) => void;
  estimatedSeconds?: number;
  estimatedCredits?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  return new Date(iso).toLocaleDateString();
}

export function LiveChat({
  activeLayer,
  history,
  onSubmit,
  onRevert,
  estimatedSeconds = 3,
  estimatedCredits = 1,
}: LiveChatProps) {
  const t = useTranslations('entityWorkspace.live');
  const [prompt, setPrompt] = useState('');

  const isGenerating = activeLayer?.status === 'generating';
  const isFailed = activeLayer?.status === 'failed';
  const canSubmit = activeLayer && !isGenerating && !activeLayer.locked && prompt.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(prompt.trim());
    setPrompt('');
  };

  if (!activeLayer) {
    return (
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--g1)] p-4">
        <p className="text-[12px] text-[var(--text-3)] text-center leading-relaxed">
          {t('noActiveLayer')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--g1)] p-4">
      {/* Active layer indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            {t('activeLayerLabel')}
          </span>
          <span className="text-[12px] font-medium text-[var(--neon)] flex items-center gap-1">
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <path d="M7 1l1.8 3.6L13 5.2l-3 2.9.7 4.1L7 10.3l-3.7 2L4 8.1 1 5.2l4.2-.6L7 1z" />
            </svg>
            {activeLayer.name}
          </span>
        </div>
      </div>

      {/* Generating state */}
      {isGenerating && (
        <div className="rounded-[10px] bg-[rgba(0,229,160,0.04)] border border-[rgba(0,229,160,0.2)] p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-[var(--border-hi)] border-t-[var(--neon)] animate-spin" />
            <span className="text-[12px] text-[var(--neon)]">{t('sending')}</span>
          </div>
          <div className="h-1 rounded-full bg-[var(--g2)] overflow-hidden">
            <div className="h-full bg-[var(--neon)] animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="rounded-[10px] bg-[rgba(255,60,60,0.06)] border border-[rgba(255,60,60,0.2)] p-3 mb-3">
          <p className="text-[12px] text-[rgba(255,100,100,0.95)] mb-2">
            {t('regenError', { reason: activeLayer.errorMessage ?? 'unknown' })}
          </p>
          <button
            type="button"
            className="px-2.5 py-1 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g2)] border border-[var(--border)] hover:bg-[var(--g3)] hover:text-[var(--text)] transition-all duration-[100ms]"
          >
            {t('retry')}
          </button>
        </div>
      )}

      {/* Prompt input */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('promptPlaceholder')}
          disabled={isGenerating || activeLayer.locked}
          rows={2}
          className={cn(
            'w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px]',
            'text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)]',
            'px-3.5 py-2.5 outline-none transition-colors duration-[120ms] resize-none',
            'focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="font-mono text-[10px] text-[var(--text-3)]">
            {t('estimatedTime', { sec: estimatedSeconds })} · {t('estimatedCost', { n: estimatedCredits })}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px]',
              'text-[12px] font-semibold border transition-all duration-[120ms]',
              canSubmit
                ? 'text-black bg-[var(--neon)] border-transparent shadow-[0_0_12px_var(--neon-glow)] hover:brightness-110'
                : 'text-[var(--text-3)] bg-[var(--g1)] border-[var(--border)] cursor-not-allowed',
            )}
          >
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <path d="M2 7l10-5-3 5 3 5z" />
            </svg>
            {isGenerating ? t('sending') : t('send')}
          </button>
        </div>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
            {t('history')}
          </p>
          <ul className="space-y-1.5">
            {history.slice(0, 5).map((entry, idx) => {
              // Only the most recent entry is revertible (D4: single-step undo).
              const canRevert = idx === 0 && Boolean(activeLayer?.previousImageUrl);
              return (
                <li
                  key={entry.id}
                  className="group flex items-center justify-between gap-2 text-[12px] text-[var(--text-2)] py-1"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3 shrink-0 text-[var(--text-3)]">
                      <path d="M3 6a3 3 0 1 0 1-2.2" strokeLinecap="round" />
                      <path d="M3 3v3h3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="truncate">{entry.prompt}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-[var(--text-3)]">{timeAgo(entry.timestamp)}</span>
                    {onRevert && canRevert && (
                      <button
                        type="button"
                        onClick={() => onRevert(entry.id)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono text-[var(--neon)] hover:bg-[var(--neon-dim)] transition-all duration-[100ms]"
                        title={t('actionRevert')}
                      >
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
                          <path d="M2 5a3 3 0 1 0 1-2.2" strokeLinecap="round" />
                          <path d="M2 2v3h3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('actionRevert')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
