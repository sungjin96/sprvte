'use client';

import { useTranslations } from 'next-intl';
import { EntityCategory, CharacterGuideData, MapGuideData } from '@/types/entity';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Slider } from '@/components/ui/Slider';
import { ColorPaletteEditor } from '@/components/ui/ColorSwatch';

// ── Character fields ──────────────────────────────────────────────────────────

interface CharacterGuideFormProps {
  data: Partial<CharacterGuideData>;
  onChange: (data: Partial<CharacterGuideData>) => void;
}

function CharacterGuideForm({ data, onChange }: CharacterGuideFormProps) {
  const t = useTranslations('guide.character');
  const set = <K extends keyof CharacterGuideData>(key: K, value: CharacterGuideData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('physique')} hint={t('physiqueHint')}>
          <Input
            value={data.physique ?? ''}
            onChange={(e) => set('physique', e.target.value)}
            placeholder={t('physiquePlaceholder')}
          />
        </FormField>
        <FormField label={t('height')}>
          <Input
            value={data.height ?? ''}
            onChange={(e) => set('height', e.target.value)}
            placeholder={t('heightPlaceholder')}
          />
        </FormField>
      </div>

      <FormField label={t('features')} hint={t('featuresHint')}>
        <Input
          value={data.features ?? ''}
          onChange={(e) => set('features', e.target.value)}
          placeholder={t('featuresPlaceholder')}
        />
      </FormField>

      <FormField label={t('bodyTraits')} hint={t('bodyTraitsHint')}>
        <Input
          value={data.bodyTraits ?? ''}
          onChange={(e) => set('bodyTraits', e.target.value)}
          placeholder={t('bodyTraitsPlaceholder')}
        />
      </FormField>

      <FormField label={t('outfit')}>
        <Input
          value={data.outfit ?? ''}
          onChange={(e) => set('outfit', e.target.value)}
          placeholder={t('outfitPlaceholder')}
        />
      </FormField>

      <FormField label={t('personality')} hint={t('personalityHint')}>
        <Input
          value={data.personality ?? ''}
          onChange={(e) => set('personality', e.target.value)}
          placeholder={t('personalityPlaceholder')}
        />
      </FormField>

      <FormField label={t('palette')} hint={t('paletteHint')}>
        <ColorPaletteEditor
          colors={data.palette ?? []}
          onChange={(colors) => set('palette', colors)}
        />
      </FormField>

      <FormField label={t('notes')}>
        <Textarea
          value={data.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={3}
        />
      </FormField>
    </div>
  );
}

// ── Map fields ────────────────────────────────────────────────────────────────

interface MapGuideFormProps {
  data: Partial<MapGuideData>;
  onChange: (data: Partial<MapGuideData>) => void;
}

function MapGuideForm({ data, onChange }: MapGuideFormProps) {
  const t = useTranslations('guide.map');
  const set = <K extends keyof MapGuideData>(key: K, value: MapGuideData[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('theme')}>
          <Input
            value={data.theme ?? ''}
            onChange={(e) => set('theme', e.target.value)}
            placeholder={t('themePlaceholder')}
          />
        </FormField>
        <FormField label={t('atmosphere')}>
          <Input
            value={data.atmosphere ?? ''}
            onChange={(e) => set('atmosphere', e.target.value)}
            placeholder={t('atmospherePlaceholder')}
          />
        </FormField>
      </div>

      <FormField label={t('lighting')}>
        <Input
          value={data.lighting ?? ''}
          onChange={(e) => set('lighting', e.target.value)}
          placeholder={t('lightingPlaceholder')}
        />
      </FormField>

      <FormField label={t('palette')}>
        <ColorPaletteEditor
          colors={data.palette ?? []}
          onChange={(colors) => set('palette', colors)}
        />
      </FormField>

      <FormField label={t('tileSize')} hint={t('tileSizeHint')}>
        <Slider
          min={16}
          max={512}
          step={16}
          value={data.tileSize ?? 64}
          onChange={(e) => set('tileSize', Number(e.target.value))}
          label={t('tileSize')}
          showValue
          valueSuffix="px"
        />
      </FormField>

      <FormField label={t('notes')}>
        <Textarea
          value={data.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('notesPlaceholder')}
          rows={3}
        />
      </FormField>
    </div>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

interface GuideSheetFormProps {
  category: EntityCategory;
  data: Partial<CharacterGuideData | MapGuideData>;
  onChange: (data: Partial<CharacterGuideData | MapGuideData>) => void;
}

function GuideSheetForm({ category, data, onChange }: GuideSheetFormProps) {
  const t = useTranslations('guide.generic');
  if (category === 'character') {
    return <CharacterGuideForm data={data as Partial<CharacterGuideData>} onChange={onChange} />;
  }
  if (category === 'map') {
    return <MapGuideForm data={data as Partial<MapGuideData>} onChange={onChange} />;
  }
  // Item / UI / Audio / Effect — generic notes field
  return (
    <FormField label={t('label')}>
      <Textarea
        value={(data as { notes?: string }).notes ?? ''}
        onChange={(e) => onChange({ notes: e.target.value })}
        placeholder={t('placeholder')}
        rows={5}
      />
    </FormField>
  );
}

export { GuideSheetForm };
