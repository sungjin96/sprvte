'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { FormField } from '@/components/ui/FormField';
import {
  OutputSizeSelector,
  type OutputSize,
} from '@/components/asset/OutputSizeSelector';

export interface CreateAnimationData {
  name: string;
  prompt: string;
  negativePrompt: string;
  animationType: string;
  frameCount: number;
  fps: number;
  outputSize: OutputSize;
  model: string;
}

interface CreateAnimationDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called with form data + a generated mock asset id.
   * Real backend: enqueue BullMQ job → returns asset id when ready.
   */
  onCreated: (data: CreateAnimationData, mockAssetId: string) => void;
  /** Optional context — entity name + autoPrompt prefill. */
  entityName?: string;
  defaultPrompt?: string;
}

const ANIMATION_TYPES = [
  { value: 'idle',   label: '대기 (Idle)' },
  { value: 'walk',   label: '걷기 (Walk)' },
  { value: 'run',    label: '달리기 (Run)' },
  { value: 'attack', label: '공격 (Attack)' },
  { value: 'jump',   label: '점프 (Jump)' },
  { value: 'die',    label: '사망 (Die)' },
  { value: 'custom', label: '커스텀' },
];

const MODELS = [
  { value: 'autosprite',        label: 'AutoSprite (알고리즘, 최저가)' },
  { value: 'animatediff',       label: 'AnimateDiff (AI, 균형, 권장)' },
  { value: 'runway-gen3-turbo', label: 'Runway Gen-3 Turbo (프리미엄)' },
];

export function CreateAnimationDialog({
  open,
  onClose,
  onCreated,
  entityName,
  defaultPrompt = '',
}: CreateAnimationDialogProps) {
  const t = useTranslations('createAnimation');

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [animationType, setAnimationType] = useState('walk');
  const [frameCount, setFrameCount] = useState(8);
  const [fps, setFps] = useState(12);
  const [outputSize, setOutputSize] = useState<OutputSize>(64);
  const [model, setModel] = useState(MODELS[1].value);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!prompt.trim()) errs.prompt = t('promptRequired');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    // Mock — pretend BullMQ job runs and produces an asset.
    // For now we route to the demo sprite_sheet asset so the user can
    // experience the full animation editor flow.
    const mockAssetId = 'ast-anim-1';
    setTimeout(() => {
      onCreated(
        {
          name: name.trim() || `${entityName ?? 'Asset'} ${animationType}`,
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim(),
          animationType,
          frameCount,
          fps,
          outputSize,
          model,
        },
        mockAssetId,
      );
      setSubmitting(false);
    }, 800);
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('title')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {entityName && (
          <p className="font-mono text-[11px] text-[var(--text-3)]">
            {t('forEntity')}: <span className="text-[var(--neon)]">{entityName}</span>
          </p>
        )}

        <FormField label={t('animationType')} hint={t('animationTypeHint')}>
          <Select
            value={animationType}
            onChange={(e) => setAnimationType(e.target.value)}
            options={ANIMATION_TYPES}
          />
        </FormField>

        <FormField label={t('name')} hint={t('nameHint')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${entityName ?? 'Alice'} ${animationType}`}
          />
        </FormField>

        <FormField label={t('prompt')} required error={errors.prompt}>
          <Textarea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setErrors((p) => ({ ...p, prompt: '' })); }}
            placeholder={t('promptPlaceholder')}
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('frameCount')}>
            <Slider
              min={2}
              max={32}
              step={1}
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              showValue
              valueSuffix=" frames"
            />
          </FormField>
          <FormField label={t('fps')}>
            <Slider
              min={4}
              max={30}
              step={1}
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              showValue
              valueSuffix=" fps"
            />
          </FormField>
        </div>

        <FormField label={t('outputSize')} hint={t('outputSizeHint')}>
          <OutputSizeSelector value={outputSize} onChange={setOutputSize} compact />
        </FormField>

        <FormField label={t('model')} hint={t('modelHint')}>
          <Select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            options={MODELS}
          />
        </FormField>

        {/* Advanced */}
        <div className="border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((p) => !p)}
            className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-3)] hover:text-[var(--text-2)]"
          >
            <svg
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className={`w-3 h-3 transition-transform duration-[120ms] ${showAdvanced ? 'rotate-90' : ''}`}
            >
              <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('advanced')}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-4">
              <FormField label={t('negativePrompt')} hint={t('negativePromptHint')}>
                <Textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder={t('negativePromptPlaceholder')}
                  rows={2}
                />
              </FormField>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            {t('cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? t('generating') : t('createAndOpen')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
