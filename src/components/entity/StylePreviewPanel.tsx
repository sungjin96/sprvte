'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { OutputSizeSelector, type OutputSize } from '@/components/asset/OutputSizeSelector';

interface StyleGuideRow {
  label: string;
  value: string;
}

export interface SeedConfig {
  model: string;
  outputSize: OutputSize;
}

interface StylePreviewPanelProps {
  referenceImages: { type: string; imageUrl?: string | null }[];
  guideSummary: StyleGuideRow[];
  palette: string[];
  onStartCanvas: (config: SeedConfig) => void;
  isGenerating?: 'idle' | 'generating' | 'splitting';
}

const MODELS = [
  { value: 'replicate-flux-schnell',  label: 'FLUX.1 [schnell] (균형)' },
  { value: 'replicate-sdxl-lightning', label: 'SDXL Lightning (가성비)' },
  { value: 'openai-gpt-image-2',       label: 'GPT-Image-2 (프리미엄)' },
];

export function StylePreviewPanel({
  referenceImages,
  guideSummary,
  palette,
  onStartCanvas,
  isGenerating = 'idle',
}: StylePreviewPanelProps) {
  const t = useTranslations('entityWorkspace.stylePreview');
  const tGen = useTranslations('assets.generate');
  const tSize = useTranslations('outputSize');
  const tRefType = useTranslations('guide.refType');
  const [pressed, setPressed] = useState(false);
  const [model, setModel] = useState(MODELS[0].value);
  const [outputSize, setOutputSize] = useState<OutputSize>(64);

  const busy = isGenerating !== 'idle';

  const handleStart = () => {
    onStartCanvas({ model, outputSize });
  };

  return (
    <div className="max-w-[640px] mx-auto p-6">
      {/* Reference images */}
      <div className="mb-6">
        <div className="flex gap-3">
          {referenceImages.map((ref) => (
            <div key={ref.type} className="flex-1">
              <div className="aspect-square rounded-[12px] border border-[var(--border-hi)] bg-[var(--g1)] overflow-hidden">
                {ref.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ref.imageUrl} alt={ref.type} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[10px] uppercase text-[var(--text-3)]">
                    no ref
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
                {tRefType(ref.type as 'front' | 'side' | 'back' | 'main' | 'style')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Style guide summary */}
      <section className="mb-6 rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
          {t('guideTitle')}
        </h3>
        <dl className="space-y-2">
          {guideSummary.map((row) => (
            <div key={row.label} className="flex items-baseline gap-3 text-[13px]">
              <dt className="w-[80px] shrink-0 text-[var(--text-3)]">{row.label}</dt>
              <dd className="flex-1 text-[var(--text)]">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Color palette */}
      <section className="mb-6 rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
          {t('paletteTitle')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {palette.map((color) => (
            <div
              key={color}
              className="w-10 h-10 rounded-[10px] border border-[var(--border-hi)] shrink-0"
              style={{ background: color }}
              title={color}
            />
          ))}
        </div>
      </section>

      {/* Generation Settings */}
      <section className="mb-6 rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5 space-y-4">
        {/* AI Model */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
            {tGen('model')}
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[12px] font-mono text-[var(--text)] px-3 py-2 outline-none focus:border-[rgba(0,229,160,0.3)]"
          >
            {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Output Size — unified */}
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
            {tSize('label')}
          </label>
          <OutputSizeSelector value={outputSize} onChange={setOutputSize} />
          <p className="mt-2 font-mono text-[10px] text-[var(--text-3)] opacity-70">
            {outputSize === 'regular' ? tSize('regularHint') : `${outputSize}×${outputSize} ${tSize('pixelArt')} · ${tSize('cleanPixelation')}`}
          </p>
        </div>
      </section>

      {/* Start CTA */}
      <button
        type="button"
        disabled={busy}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onClick={handleStart}
        className={cn(
          'w-full px-4 py-4 rounded-[14px] flex items-center justify-center gap-2',
          'text-[14px] font-semibold border transition-all duration-[160ms]',
          !busy && [
            'text-black bg-[var(--neon)] border-transparent',
            'shadow-[0_0_24px_var(--neon-glow)] hover:shadow-[0_0_36px_var(--neon-glow)] hover:brightness-110',
            pressed && 'scale-[0.98] shadow-[0_0_12px_var(--neon-glow)]',
          ],
          busy && [
            'text-[var(--neon)] bg-[var(--neon-dim)] border-[rgba(0,229,160,0.3)] cursor-not-allowed',
          ],
        )}
      >
        {busy ? (
          <>
            <span className="inline-block w-4 h-4 rounded-full border-2 border-[rgba(0,229,160,0.3)] border-t-[var(--neon)] animate-spin" />
            <span>{isGenerating === 'splitting' ? t('seedSplitting') : t('seedGenerating')}</span>
          </>
        ) : (
          <>
            <span>{t('startCanvas')}</span>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
              <path d="M2 7h10M8 3l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {!busy && (
        <p className="mt-2 text-center font-mono text-[10px] text-[var(--text-3)]">
          {t('startCanvasHint')}
        </p>
      )}
    </div>
  );
}
