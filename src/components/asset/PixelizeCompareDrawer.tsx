'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { usePixelatedImage } from '@/lib/image/usePixelatedImage';
import { useCredits } from '@/lib/credits/CreditsContext';
import { fetchAIPixelate, aiCacheKey, AI_PIXELATE_COST } from '@/lib/image/aiPixelate';
import { cn } from '@/lib/utils';
import type { OutputSize } from '@/components/asset/OutputSizeSelector';
import {
  PixelizeOptionsPanel,
  DEFAULT_OPTIONS,
  type PixelizeOptions,
  type PresetKind,
} from './PixelizeOptionsPanel';
import { PixelEditor } from './pixel-edit/PixelEditor';

interface PixelizeCompareDrawerProps {
  open: boolean;
  onClose: () => void;
  sourceUrl: string;
  assetName?: string;
  /** Called with chosen size + options (+ optional AI dataURL when AI selected). */
  onSelect?: (size: OutputSize, options: PixelizeOptions, aiDataUrl?: string) => void;
}

const COMPARE_SIZES: { size: OutputSize; label: string; aiRecommended: boolean }[] = [
  { size: 'regular', label: 'Original',  aiRecommended: false },
  { size: 8,    label: '8',    aiRecommended: true  },
  { size: 16,   label: '16',   aiRecommended: true  },
  { size: 32,   label: '32',   aiRecommended: true  },
  { size: 64,   label: '64',   aiRecommended: false },
  { size: 128,  label: '128',  aiRecommended: false },
  { size: 256,  label: '256',  aiRecommended: false },
  { size: 512,  label: '512',  aiRecommended: false },
];

const AI_BULK_SIZES: Exclude<OutputSize, 'regular'>[] = [8, 16, 32];

export function PixelizeCompareDrawer({
  open,
  onClose,
  sourceUrl,
  assetName,
  onSelect,
}: PixelizeCompareDrawerProps) {
  const t = useTranslations('pixelizeCompare');
  const { credits, charge, refund } = useCredits();

  const [selected, setSelected] = useState<OutputSize | null>(null);
  const [selectedMode, setSelectedMode] = useState<'algorithm' | 'ai'>('algorithm');
  const [options, setOptions] = useState<PixelizeOptions>(DEFAULT_OPTIONS);
  const [preset, setPreset] = useState<PresetKind>('sharp');

  // Mode machine: 'compare' (default grid) ↔ 'edit' (pixel editor)
  const [mode, setMode] = useState<'compare' | 'edit'>('compare');
  const [editingSize, setEditingSize] = useState<Exclude<OutputSize, 'regular'> | null>(null);
  const [editingSourceUrl, setEditingSourceUrl] = useState<string>('');
  // Touched cards: size → edited dataURL (overrides algorithm/AI for display)
  const [editedCache, setEditedCache] = useState<Map<OutputSize, string>>(new Map());

  // AI cache (in-memory, drawer session only — D-Q2.b mock)
  const [aiCache, setAiCache] = useState<Map<string, string>>(new Map());
  const [aiPending, setAiPending] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);

  // Per-card view mode: which (size) is currently showing AI vs algorithm
  const [showAi, setShowAi] = useState<Set<OutputSize>>(new Set());

  const requestAI = useCallback(
    async (size: Exclude<OutputSize, 'regular'>) => {
      const key = aiCacheKey(sourceUrl, size);
      if (aiCache.has(key) || aiPending.has(key)) {
        // Cached or in flight — just toggle view to AI
        setShowAi((prev) => new Set(prev).add(size));
        return;
      }

      // Charge first (D-Q3.a). Refund on failure.
      const ok = charge(AI_PIXELATE_COST);
      if (!ok) {
        setAiError(t('ai.insufficient'));
        setTimeout(() => setAiError(null), 3000);
        return;
      }

      setAiPending((prev) => new Set(prev).add(key));
      setShowAi((prev) => new Set(prev).add(size));
      setAiError(null);

      try {
        const dataUrl = await fetchAIPixelate(sourceUrl, size);
        setAiCache((prev) => new Map(prev).set(key, dataUrl));
      } catch (err) {
        refund(AI_PIXELATE_COST);
        const msg = err instanceof Error ? err.message : 'AI request failed';
        setAiError(msg);
        setTimeout(() => setAiError(null), 5000);
        // remove from showAi so UI reverts to algorithm
        setShowAi((prev) => {
          const next = new Set(prev);
          next.delete(size);
          return next;
        });
      } finally {
        setAiPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [sourceUrl, aiCache, aiPending, charge, refund, t],
  );

  const requestAIBulk = useCallback(async () => {
    // Filter out already-cached sizes for cost accuracy
    const toRun = AI_BULK_SIZES.filter((s) => !aiCache.has(aiCacheKey(sourceUrl, s)));
    if (toRun.length === 0) return;
    // Run in parallel — each requestAI handles its own charge
    await Promise.all(toRun.map((s) => requestAI(s)));
  }, [sourceUrl, aiCache, requestAI]);

  const handleSave = () => {
    if (selected === null) return;
    let aiDataUrl: string | undefined;
    // Edited touch-up wins over AI/algorithm
    if (selected !== 'regular') {
      const edited = editedCache.get(selected);
      if (edited) aiDataUrl = edited;
      else if (selectedMode === 'ai') {
        aiDataUrl = aiCache.get(aiCacheKey(sourceUrl, selected as Exclude<OutputSize, 'regular'>));
      }
    }
    onSelect?.(selected, options, aiDataUrl);
    onClose();
  };

  // Enter edit mode for a specific card
  const enterEditMode = useCallback(
    (size: Exclude<OutputSize, 'regular'>, currentUrl: string) => {
      setEditingSize(size);
      setEditingSourceUrl(currentUrl);
      setMode('edit');
    },
    [],
  );

  const exitEditMode = () => {
    setMode('compare');
    setEditingSize(null);
    setEditingSourceUrl('');
  };

  const handleEditSave = (dataUrl: string) => {
    if (editingSize === null) return;
    setEditedCache((prev) => new Map(prev).set(editingSize, dataUrl));
    setSelected(editingSize);
    exitEditMode();
  };

  // Edit mode renders PixelEditor exclusively
  if (mode === 'edit' && editingSize !== null) {
    return (
      <Drawer open={open} onClose={exitEditMode} title={t('editTitle')} width="min(1280px, 95vw)">
        <div className="-m-5 h-[calc(100%+2.5rem)]">
          <PixelEditor
            sourceUrl={editingSourceUrl}
            size={editingSize}
            onSave={handleEditSave}
            onCancel={exitEditMode}
          />
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} title={t('title')} width="min(1280px, 95vw)">
      <div className="flex flex-col h-full gap-5">
        <div className="flex items-center justify-between shrink-0">
          {assetName && (
            <p className="text-[12px] text-[var(--text-3)]">
              {t('subjectLabel')}: <span className="text-[var(--text-2)]">{assetName}</span>
            </p>
          )}
          <span className="font-mono text-[11px] text-[var(--text-3)]">
            {t('ai.creditsBalance', { n: credits.toLocaleString() })}
          </span>
        </div>

        {aiError && (
          <div className="px-3 py-2 rounded-md border border-[rgba(255,80,80,0.3)] bg-[rgba(255,80,80,0.08)] text-[12px] text-[rgba(255,160,160,0.95)] shrink-0">
            {aiError}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 grid grid-cols-[280px_1fr] gap-5 min-h-0 overflow-hidden">
          <div className="overflow-y-auto pr-2 -mr-2">
            <PixelizeOptionsPanel
              options={options}
              onChange={setOptions}
              preset={preset}
              onPresetChange={setPreset}
            />
          </div>

          <div className="overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[12px] text-[var(--text-2)]">{t('hint')}</p>
              <Button
                variant="ghost"
                onClick={requestAIBulk}
                className="text-[11px] gap-1.5 border border-[rgba(0,229,160,0.3)]"
                title={t('ai.bulkTooltip')}
              >
                <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                  <path d="M6 1l1.4 3.6L11 5.2l-3 2.5.6 3.7L6 9.6 3.4 11.4 4 7.7 1 5.2l3.6-.6L6 1z" />
                </svg>
                {t('ai.bulkButton', { cost: AI_PIXELATE_COST * AI_BULK_SIZES.length })}
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {COMPARE_SIZES.map(({ size, label, aiRecommended }) => {
                const key = size !== 'regular' ? aiCacheKey(sourceUrl, size) : '';
                const aiUrl = key ? aiCache.get(key) ?? null : null;
                const pending = key ? aiPending.has(key) : false;
                const isShowingAi = showAi.has(size) && (aiUrl !== null || pending);
                const editedUrl = editedCache.get(size) ?? null;
                return (
                  <CompareCard
                    key={String(size)}
                    sourceUrl={sourceUrl}
                    size={size}
                    label={label}
                    options={options}
                    selected={selected === size}
                    aiRecommended={aiRecommended}
                    aiUrl={aiUrl}
                    aiPending={pending}
                    isShowingAi={isShowingAi}
                    editedUrl={editedUrl}
                    onClick={() => {
                      setSelected(size);
                      setSelectedMode(isShowingAi && aiUrl ? 'ai' : 'algorithm');
                    }}
                    onRequestAI={
                      size !== 'regular'
                        ? () => requestAI(size as Exclude<OutputSize, 'regular'>)
                        : undefined
                    }
                    onToggleMode={() => {
                      if (!aiUrl) return;
                      const next = !isShowingAi;
                      setShowAi((prev) => {
                        const s = new Set(prev);
                        if (next) s.add(size); else s.delete(size);
                        return s;
                      });
                      if (selected === size) setSelectedMode(next ? 'ai' : 'algorithm');
                    }}
                    onEdit={
                      size !== 'regular'
                        ? (currentUrl) => enterEditMode(size as Exclude<OutputSize, 'regular'>, currentUrl)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] shrink-0">
          <span className="font-mono text-[11px] text-[var(--text-3)]">
            {selected !== null
              ? t('selectedSizeWithMode', {
                  size: selected === 'regular' ? t('original') : String(selected),
                  mode: selectedMode === 'ai' ? t('ai.modeAi') : t('ai.modeAlgo'),
                })
              : t('noSelection')}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button variant="primary" disabled={selected === null} onClick={handleSave}>
              {t('saveSelected')}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

function CompareCard({
  sourceUrl,
  size,
  label,
  options,
  selected,
  aiRecommended,
  aiUrl,
  aiPending,
  isShowingAi,
  editedUrl,
  onClick,
  onRequestAI,
  onToggleMode,
  onEdit,
}: {
  sourceUrl: string;
  size: OutputSize;
  label: string;
  options: PixelizeOptions;
  selected: boolean;
  aiRecommended: boolean;
  aiUrl: string | null;
  aiPending: boolean;
  isShowingAi: boolean;
  editedUrl: string | null;
  onClick: () => void;
  onRequestAI?: () => void;
  onToggleMode: () => void;
  onEdit?: (currentUrl: string) => void;
}) {
  const t = useTranslations('pixelizeCompare');
  const algorithmUrl = usePixelatedImage(sourceUrl, size, options);

  // Display priority: edited > (AI when toggled) > algorithm
  const displayUrl = editedUrl
    ? editedUrl
    : isShowingAi
      ? aiPending
        ? algorithmUrl // show algorithm while AI is loading
        : aiUrl ?? algorithmUrl
      : algorithmUrl;

  const showSpinner = isShowingAi && aiPending;
  const hasAi = aiUrl !== null;

  return (
    <div
      role="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col rounded-[10px] border overflow-hidden text-left transition-all duration-[120ms] cursor-pointer',
        selected
          ? 'border-[var(--neon)] shadow-[0_0_0_1px_var(--neon),0_0_16px_var(--neon-glow)] bg-[var(--neon-dim)]'
          : 'border-[var(--border)] bg-[var(--g1)] hover:border-[rgba(0,229,160,0.35)] hover:bg-[var(--g2)]',
      )}
    >
      <div className="aspect-square w-full bg-[rgba(0,0,0,0.4)] relative overflow-hidden">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt={label}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ imageRendering: size === 'regular' ? 'auto' : 'pixelated' }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[10px] text-[var(--text-3)]">…</span>
          </div>
        )}

        {/* Spinner during AI fetch */}
        {showSpinner && (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)]">
            <div className="flex flex-col items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-[var(--border-hi)] border-t-[var(--neon)] animate-spin" />
              <span className="font-mono text-[10px] text-[var(--neon)] tracking-[0.08em]">{t('ai.generating')}</span>
            </div>
          </div>
        )}

        {/* Selected check */}
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--neon)] flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 12 12" fill="none" stroke="#000" strokeWidth="2" className="w-3 h-3">
              <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* AI recommended badge (top-left, only on aiRecommended sizes without AI yet) */}
        {aiRecommended && !hasAi && !aiPending && onRequestAI && (
          <span className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[rgba(0,229,160,0.15)] border border-[var(--neon)] backdrop-blur-[4px] font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--neon)] pointer-events-none">
            <svg viewBox="0 0 8 8" fill="currentColor" className="w-2 h-2">
              <path d="M4 0l1 3 3 .5-2.2 2 .5 2.5L4 6.5 1.7 8l.5-2.5L0 3.5 3 3z" />
            </svg>
            {t('ai.recommended')}
          </span>
        )}

        {/* Mode toggle (when AI is available) */}
        {hasAi && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleMode(); }}
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[4px] bg-[rgba(0,0,0,0.7)] border border-[var(--neon)] backdrop-blur-[4px] font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--neon)] hover:bg-[var(--neon-dim)]"
          >
            {isShowingAi ? t('ai.viewingAi') : t('ai.viewingAlgo')}
          </button>
        )}

        {/* AI request button (hover) — bottom-left */}
        {onRequestAI && !hasAi && !aiPending && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRequestAI(); }}
            className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.75)] border border-[var(--neon)] backdrop-blur-[4px] font-mono text-[10px] text-[var(--neon)] opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms] hover:bg-[var(--neon-dim)]"
            title={t('ai.requestTooltip')}
          >
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
              <path d="M6 1l1.4 3.6L11 5.2l-3 2.5.6 3.7L6 9.6 3.4 11.4 4 7.7 1 5.2l3.6-.6L6 1z" />
            </svg>
            {t('ai.requestButton', { cost: AI_PIXELATE_COST })}
          </button>
        )}

        {/* Touch-up button — always visible (not hover-only) for discoverability. */}
        {onEdit && displayUrl && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(displayUrl); }}
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-[rgba(0,0,0,0.75)] border border-[var(--border-hi)] backdrop-blur-[4px] font-mono text-[10px] text-[var(--text-2)] hover:border-[var(--neon)] hover:text-[var(--neon)] transition-colors duration-[120ms]"
            title={t('touchUp.tooltip')}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-2.5 h-2.5">
              <path d="M2 12L4 11L11 4L10 3L3 10L2 12Z" strokeLinejoin="round" />
            </svg>
            {t('touchUp.button')}
          </button>
        )}

        {/* EDITED badge (top-right corner, opposite of AI toggle which uses top-left) */}
        {editedUrl && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[rgba(0,229,160,0.15)] border border-[var(--neon)] backdrop-blur-[4px] font-mono text-[9px] uppercase tracking-[0.06em] text-[var(--neon)] pointer-events-none">
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-2 h-2">
              <path d="M1 7L2 6.5L6.5 2L6 1.5L1.5 6L1 7Z" strokeLinejoin="round" />
            </svg>
            {t('touchUp.editedBadge')}
          </span>
        )}
      </div>

      <div className="px-3 py-2 flex items-baseline justify-between">
        <span className={cn(
          'font-mono text-[12px] font-medium',
          selected ? 'text-[var(--neon)]' : 'text-[var(--text-2)]',
        )}>
          {label}
        </span>
        {typeof size === 'number' && (
          <span className="font-mono text-[10px] text-[var(--text-3)]">
            {size}×{size}
          </span>
        )}
      </div>
    </div>
  );
}
