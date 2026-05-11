'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { LayerItem } from './LayerCanvas';

interface LayerGenerateFormProps {
  layer: LayerItem;
  onRegenerate: (layerId: string, prompt: string, negativePrompt: string) => void;
  loading?: boolean;
}

function LayerGenerateForm({ layer, onRegenerate, loading }: LayerGenerateFormProps) {
  const t = useTranslations('assets.layer');
  const existingPrompt = (layer.layerData as unknown as Record<string, string>)?.prompt ?? '';
  const [prompt, setPrompt] = useState(existingPrompt);
  const [negativePrompt, setNegativePrompt] = useState(t('negativePromptDefault'));
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) { setError(t('promptRequired')); return; }
    onRegenerate(layer.id, prompt.trim(), negativePrompt.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wide mb-1">
          {t('regenerateTitle')} <span className="text-[var(--text-2)]">{layer.name}</span>
        </p>
        <p className="text-[11px] text-[var(--text-3)] leading-snug">
          {t('regenerateBody')}
        </p>
      </div>

      <FormField label={t('prompt')} required error={error}>
        <Textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setError(''); }}
          placeholder={t('promptPlaceholder')}
          rows={3}
          hasError={!!error}
        />
      </FormField>

      <FormField label={t('negativePrompt')}>
        <Textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          rows={2}
        />
      </FormField>

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}

export { LayerGenerateForm };
