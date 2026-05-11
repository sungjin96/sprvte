'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AssetType, IMAGE_ASSET_TYPES } from '@/types/asset';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Button } from '@/components/ui/Button';

interface BatchGenerateFormProps {
  onSubmit: (prompts: string[], type: AssetType) => void;
  loading?: boolean;
}

function BatchGenerateForm({ onSubmit, loading }: BatchGenerateFormProps) {
  const t = useTranslations('assets.batch');
  const tType = useTranslations('assets.type');
  const tGen = useTranslations('assets.generate');
  const [type, setType] = useState<AssetType>('character');
  const [promptsText, setPromptsText] = useState('');
  const [count, setCount] = useState(3);
  const [mode, setMode] = useState<'manual' | 'family'>('manual');

  const typeOptions = IMAGE_ASSET_TYPES.map((typeKey) => ({ value: typeKey, label: tType(typeKey) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'manual') {
      const prompts = promptsText.split('\n').map((p) => p.trim()).filter(Boolean);
      if (!prompts.length) return;
      onSubmit(prompts, type);
    } else {
      // Family mode — generate placeholder prompts
      const base = promptsText.trim();
      if (!base) return;
      const variants = ['idle', 'walk', 'run', 'attack', 'jump'].slice(0, count);
      onSubmit(variants.map((v) => `${base}, ${v} animation`), 'sprite_sheet');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['manual', 'family'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-[12px] font-mono rounded-lg border transition-all ${
              mode === m
                ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
                : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)]'
            }`}
          >
            {m === 'manual' ? t('modeManual') : t('modeFamily')}
          </button>
        ))}
      </div>

      {mode === 'manual' ? (
        <>
          <FormField label={tGen('type')}>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as AssetType)}
              options={typeOptions}
            />
          </FormField>
          <FormField label={t('promptsLabel')} hint={t('promptsHint')}>
            <Textarea
              value={promptsText}
              onChange={(e) => setPromptsText(e.target.value)}
              rows={6}
              placeholder={t('promptsPlaceholder')}
            />
          </FormField>
        </>
      ) : (
        <>
          <FormField label={t('basePromptLabel')} hint={t('basePromptHint')}>
            <Textarea
              value={promptsText}
              onChange={(e) => setPromptsText(e.target.value)}
              rows={3}
              placeholder={t('basePromptPlaceholder')}
            />
          </FormField>
          <FormField label={t('variantCount')}>
            <NumberInput value={count} onChange={setCount} min={2} max={8} />
          </FormField>
        </>
      )}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

export { BatchGenerateForm };
