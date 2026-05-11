'use client';

import { useState, ChangeEvent, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { OutputSizeSelector, type OutputSize } from '@/components/asset/OutputSizeSelector';
import { GuideSheetForm } from '@/components/entity/GuideSheetForm';
import { cn } from '@/lib/utils';
import {
  EntityCategory,
  EntityMode,
  ReferenceType,
  CharacterGuideData,
  MapGuideData,
} from '@/types/entity';
import { ENTITY_CATEGORY_SVG } from './categoryIcons';

export type GuideDataAny = Partial<CharacterGuideData | MapGuideData>;
export type ReferenceUpload = { type: ReferenceType; dataUrl: string };

export interface EntityCreateData {
  name: string;
  category: EntityCategory;
  mode: EntityMode;
  description: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  outputSize: OutputSize;
  guideData: GuideDataAny;
  references: ReferenceUpload[];
}

interface EntityCreateFormProps {
  onSubmit: (data: EntityCreateData) => void;
  onCancel?: () => void;
  loading?: boolean;
  defaultCategory?: EntityCategory;
}

const CATEGORIES: EntityCategory[] = ['character', 'map', 'item', 'ui', 'effect'];

const IMAGE_MODELS = [
  { value: 'replicate-flux-schnell', label: 'FLUX.1 [schnell] (균형, 권장)' },
  { value: 'replicate-sdxl-lightning', label: 'SDXL Lightning (빠름, 가성비)' },
  { value: 'openai-gpt-image-2', label: 'GPT-Image-2 (프리미엄)' },
];

// Reference slots are uniform across categories — front/side/back covers most needs.
// Per-category specialization (tile sample, item style ref, etc.) deferred.
const REFERENCE_SLOTS: ReferenceType[] = ['front', 'side', 'back'];

function EntityCreateForm({ onSubmit, onCancel, loading, defaultCategory = 'character' }: EntityCreateFormProps) {
  const t = useTranslations('entities.form');
  const tCat = useTranslations('entities.category');
  const tGen = useTranslations('assets.generate');
  const tGuide = useTranslations('guide');
  const tRefType = useTranslations('guide.refType');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<EntityCategory>(defaultCategory);
  const [mode, setMode] = useState<EntityMode>('standard');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState<string>(IMAGE_MODELS[0].value);
  const [outputSize, setOutputSize] = useState<OutputSize>(64);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Quality-only state
  const [showGuide, setShowGuide] = useState(false);
  const [showRefs, setShowRefs] = useState(false);
  const [guideData, setGuideData] = useState<GuideDataAny>({});
  const [refs, setRefs] = useState<Record<ReferenceType, string | undefined>>({
    front: undefined, side: undefined, back: undefined, main: undefined, style: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isQuality = mode === 'quality';

  const handleCategoryChange = (cat: EntityCategory) => {
    setCategory(cat);
    // Different category = different guide schema → reset to avoid stale fields
    setGuideData({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = t('nameRequired');
    if (!prompt.trim()) e.prompt = tGen('promptRequired');
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const references: ReferenceUpload[] = REFERENCE_SLOTS
      .filter((s) => refs[s])
      .map((s) => ({ type: s, dataUrl: refs[s]! }));
    onSubmit({
      name: name.trim(),
      category,
      mode,
      description: description.trim(),
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      model,
      outputSize,
      guideData: isQuality ? guideData : {},
      references: isQuality ? references : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Category */}
      <FormField label={t('category')}>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border text-center transition-all',
                category === cat
                  ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
                  : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-2)] hover:border-[var(--border-hi)] hover:bg-[var(--g2)]',
              )}
            >
              <span className="w-5 h-5">{ENTITY_CATEGORY_SVG[cat]}</span>
              <span className="text-[11px] font-mono uppercase tracking-wide">{tCat(cat)}</span>
            </button>
          ))}
        </div>
      </FormField>

      {/* Name */}
      <FormField label={t('name')} required error={errors.name}>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
          placeholder={t('namePlaceholder')}
          hasError={!!errors.name}
          autoFocus
        />
      </FormField>

      {/* Prompt */}
      <FormField label={tGen('prompt')} required error={errors.prompt}>
        <Textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setErrors((p) => ({ ...p, prompt: '' })); }}
          placeholder={tGen('promptPlaceholderImage')}
          rows={3}
        />
      </FormField>

      {/* Mode */}
      <FormField label={t('mode')} hint={t('modeHint')}>
        <div className="grid grid-cols-2 gap-2">
          {(['standard', 'quality'] as EntityMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex flex-col gap-1 p-3.5 rounded-lg border text-left transition-all',
                mode === m
                  ? 'border-[var(--neon)] bg-[var(--neon-dim)]'
                  : 'border-[var(--border)] bg-[var(--g1)] hover:border-[var(--border-hi)] hover:bg-[var(--g2)]',
              )}
            >
              <span
                className={cn(
                  'text-[12px] font-semibold',
                  mode === m ? 'text-[var(--neon)]' : 'text-[var(--text)]',
                )}
              >
                {t(m)}
              </span>
              <span className="text-[11px] text-[var(--text-3)] leading-snug">
                {m === 'standard' ? t('standardDesc') : t('qualityDesc')}
              </span>
            </button>
          ))}
        </div>
      </FormField>

      {/* Model */}
      <FormField label={tGen('model')} hint={tGen('modelHint')}>
        <Select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={IMAGE_MODELS}
        />
      </FormField>

      {/* Output Size */}
      <FormField
        label={tGen('outputSize')}
        hint={outputSize === 'regular' ? tGen('outputSizeRegularHint') : tGen('outputSizePixelHint', { n: outputSize })}
      >
        <OutputSizeSelector value={outputSize} onChange={setOutputSize} />
      </FormField>

      {/* Quality-only sections */}
      {isQuality && (
        <>
          <CollapsibleSection
            title={tGuide('title')}
            hint={t('guideHint')}
            open={showGuide}
            onToggle={() => setShowGuide((p) => !p)}
          >
            <GuideSheetForm
              category={category}
              data={guideData}
              onChange={setGuideData}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title={tGuide('references')}
            hint={t('refsHint')}
            open={showRefs}
            onToggle={() => setShowRefs((p) => !p)}
          >
            <div className="grid grid-cols-3 gap-3">
              {REFERENCE_SLOTS.map((slot) => (
                <ReferenceUploadCell
                  key={slot}
                  label={tRefType(slot)}
                  dataUrl={refs[slot]}
                  onChange={(url) => setRefs((p) => ({ ...p, [slot]: url }))}
                  onClear={() => setRefs((p) => ({ ...p, [slot]: undefined }))}
                />
              ))}
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Advanced (negative prompt + description) */}
      <div className="border-t border-[var(--border)] pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced((p) => !p)}
          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
        >
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className={cn('w-3 h-3 transition-transform duration-[120ms]', showAdvanced && 'rotate-90')}
          >
            <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('advanced')}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-4">
            <FormField label={tGen('negativePrompt')} hint={tGen('negativePromptHint')}>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder={tGen('negativePromptPlaceholder')}
                rows={2}
              />
            </FormField>

            <FormField label={t('description')} hint={t('descriptionHint')}>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
                rows={2}
              />
            </FormField>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? t('submitting') : t('submitWithGenerate')}
        </Button>
      </div>
    </form>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  hint,
  open,
  onToggle,
  children,
}: {
  title: string;
  hint?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--g0)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-[var(--g1)] transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className={cn('w-3 h-3 transition-transform duration-[120ms] text-[var(--text-3)]', open && 'rotate-90')}
          >
            <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[12px] font-mono uppercase tracking-[0.06em] text-[var(--text-2)]">
            {title}
          </span>
        </span>
        {hint && !open && (
          <span className="text-[11px] text-[var(--text-3)] truncate">{hint}</span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Reference upload cell ─────────────────────────────────────────────────────
function ReferenceUploadCell({
  label,
  dataUrl,
  onChange,
  onClear,
}: {
  label: string;
  dataUrl?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') onChange(result);
    };
    reader.readAsDataURL(f);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'relative aspect-square rounded-xl overflow-hidden border',
          dataUrl ? 'border-[var(--border-hi)]' : 'border-dashed border-[var(--border)]',
          !dataUrl && 'bg-[var(--g1)]',
        )}
      >
        {dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity"
              title="Remove"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-red-400">
                <path d="M3 6h10M6 6V4h4v2M5 6l.5 7h5l.5-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 hover:bg-[var(--g2)] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-[var(--text-3)]">
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
            <span className="text-[10px] font-mono text-[var(--text-3)]">Upload</span>
          </button>
        )}
      </div>
      <span className="text-[11px] font-mono text-[var(--text-3)] text-center uppercase tracking-wide">
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

export { EntityCreateForm };
