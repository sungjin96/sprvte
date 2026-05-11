'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ColorPaletteEditor } from '@/components/ui/ColorSwatch';
import { PROJECT_GENRES, PROJECT_ART_STYLES } from '@/types/project';

interface ProjectCreateData {
  name: string;
  genre: string;
  artStyle: string;
  basePrompt: string;
  colorPalette: string[];
}

interface ProjectCreateFormProps {
  onSubmit: (data: ProjectCreateData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

function ProjectCreateForm({ onSubmit, onCancel, loading }: ProjectCreateFormProps) {
  const t = useTranslations('projects.form');
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [artStyle, setArtStyle] = useState('');
  const [basePrompt, setBasePrompt] = useState('');
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const genreOptions = [{ value: '', label: t('genrePlaceholder') }, ...PROJECT_GENRES.map((g) => ({ value: g.value, label: t(`genres.${g.value}`) }))];
  const styleOptions = [{ value: '', label: t('artStylePlaceholder') }, ...PROJECT_ART_STYLES.map((s) => ({ value: s.value, label: t(`artStyles.${s.value}`) }))];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('nameRequired');
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({ name: name.trim(), genre, artStyle, basePrompt: basePrompt.trim(), colorPalette });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormField label={t('name')} required error={errors.name}>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
          placeholder={t('namePlaceholder')}
          hasError={!!errors.name}
          autoFocus
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('genre')}>
          <Select value={genre} onChange={(e) => setGenre(e.target.value)} options={genreOptions} />
        </FormField>
        <FormField label={t('artStyle')}>
          <Select value={artStyle} onChange={(e) => setArtStyle(e.target.value)} options={styleOptions} />
        </FormField>
      </div>

      <FormField label={t('basePrompt')} hint={t('basePromptHint')}>
        <Textarea
          value={basePrompt}
          onChange={(e) => setBasePrompt(e.target.value)}
          placeholder={t('basePromptPlaceholder')}
          rows={3}
        />
      </FormField>

      <FormField label={t('colorPalette')} hint={t('colorPaletteHint')}>
        <ColorPaletteEditor colors={colorPalette} onChange={setColorPalette} />
      </FormField>

      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>{t('cancel')}</Button>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}

export { ProjectCreateForm };
