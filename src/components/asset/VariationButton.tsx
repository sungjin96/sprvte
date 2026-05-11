'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Slider } from '@/components/ui/Slider';

interface VariationButtonProps {
  assetId: string;
  onSuccess?: (newAssetId: string) => void;
}

function VariationButton({ assetId, onSuccess }: VariationButtonProps) {
  const t = useTranslations('assets.actions');
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [strength, setStrength] = useState(70);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/variation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, strength: strength / 100 }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onSuccess?.(data.id);
      setOpen(false);
    } catch {
      // toast error in Phase C
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)} className="gap-1.5">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
          <path d="M2 8a6 6 0 1 0 6-6" strokeLinecap="round" />
          <path d="M2 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('variation')}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('variationDialogTitle')} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('variationPrompt')} hint={t('variationPromptHint')}>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('variationPromptPlaceholder')}
              rows={3}
            />
          </FormField>
          <FormField label={t('variationStrength')}>
            <Slider min={10} max={100} step={5} value={strength} onChange={setStrength} label={t('variationStrengthLabel')} unit="%" />
          </FormField>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? t('variationSubmitting') : t('variationSubmit')}
          </Button>
        </form>
      </Dialog>
    </>
  );
}

export { VariationButton };
