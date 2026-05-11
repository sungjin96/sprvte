'use client';

import { useTranslations } from 'next-intl';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { cn } from '@/lib/utils';
import type { UsePixelatedImageOptions } from '@/lib/image/usePixelatedImage';
import type { QuantizerKind, DitherKind } from '@/lib/image/quantize';

export type PresetKind = 'sharp' | 'smooth' | 'custom';

/**
 * Required form of pixelize options — all fields present so the panel
 * always renders the slider's current value.
 */
export type PixelizeOptions = Required<Pick<UsePixelatedImageOptions,
  'paletteSize' | 'maxSaturation' | 'quantizer' | 'dithering' | 'bilateral'
  | 'splitL' | 'snapSThreshold' | 'linearA' | 'linearB'
>>;

export const DEFAULT_OPTIONS: PixelizeOptions = {
  paletteSize: 32,
  maxSaturation: 0.85,
  quantizer: 'wuquant',
  dithering: 'none',
  bilateral: false,
  splitL: 0.5,
  snapSThreshold: 0.18,
  linearA: 1.18,
  linearB: -12,
};

const PRESETS: Record<Exclude<PresetKind, 'custom'>, PixelizeOptions> = {
  sharp: { ...DEFAULT_OPTIONS },
  smooth: {
    ...DEFAULT_OPTIONS,
    bilateral: true,
    dithering: 'floyd-steinberg',
    linearA: 1.05,
    linearB: -5,
    splitL: 0.5,
    snapSThreshold: 0.30, // be more conservative — preserve subtle shading
  },
};

export function applyPreset(preset: Exclude<PresetKind, 'custom'>): PixelizeOptions {
  return { ...PRESETS[preset] };
}

interface PixelizeOptionsPanelProps {
  options: PixelizeOptions;
  onChange: (next: PixelizeOptions) => void;
  preset: PresetKind;
  onPresetChange: (preset: PresetKind) => void;
}

const QUANTIZER_OPTS = [
  { value: 'wuquant',  label: 'Wu (빠름·기본)' },
  { value: 'rgbquant', label: 'RGB-Quant (k-means)' },
  { value: 'neuquant', label: 'NeuQuant (신경망)' },
];

const DITHER_OPTS = [
  { value: 'none',            label: 'None (선명)' },
  { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
  { value: 'atkinson',        label: 'Atkinson' },
  { value: 'stucki',          label: 'Stucki' },
  { value: 'sierra',          label: 'Sierra' },
];

const PRESET_OPTS = [
  { value: 'sharp',  label: 'Sharp Blocky (기본)' },
  { value: 'smooth', label: 'Smooth AI-to-Pixel' },
  { value: 'custom', label: 'Custom' },
];

export function PixelizeOptionsPanel({
  options,
  onChange,
  preset,
  onPresetChange,
}: PixelizeOptionsPanelProps) {
  const t = useTranslations('pixelizeCompare');

  const set = <K extends keyof PixelizeOptions>(key: K, value: PixelizeOptions[K]) => {
    onChange({ ...options, [key]: value });
    onPresetChange('custom');
  };

  const handlePreset = (p: PresetKind) => {
    onPresetChange(p);
    if (p !== 'custom') onChange(applyPreset(p));
  };

  const handleReset = () => {
    onPresetChange('sharp');
    onChange(applyPreset('sharp'));
  };

  return (
    <div className="flex flex-col gap-4 text-[12px]">
      {/* Preset */}
      <FormField label={t('opts.preset')}>
        <Select
          value={preset}
          onChange={(e) => handlePreset(e.target.value as PresetKind)}
          options={PRESET_OPTS}
        />
      </FormField>

      <Section title={t('opts.coreSection')}>
        <SliderRow
          label={t('opts.paletteSize')}
          value={options.paletteSize}
          min={2} max={256} step={1}
          onChange={(v) => set('paletteSize', v)}
        />

        <SliderRow
          label={t('opts.splitL')}
          help={t('opts.splitLHelp')}
          value={options.splitL}
          min={0} max={1} step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => set('splitL', v)}
        />

        <SliderRow
          label={t('opts.snapSThreshold')}
          help={t('opts.snapSThresholdHelp')}
          value={options.snapSThreshold}
          min={0} max={1} step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => set('snapSThreshold', v)}
        />

        <SliderRow
          label={t('opts.maxSaturation')}
          value={options.maxSaturation}
          min={0} max={1} step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => set('maxSaturation', v)}
        />
      </Section>

      <Section title={t('opts.contrastSection')}>
        <SliderRow
          label={t('opts.linearA')}
          value={options.linearA}
          min={0.5} max={2} step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => set('linearA', v)}
        />
        <SliderRow
          label={t('opts.linearB')}
          value={options.linearB}
          min={-50} max={50} step={1}
          format={(v) => String(v)}
          onChange={(v) => set('linearB', v)}
        />
      </Section>

      <Section title={t('opts.algoSection')}>
        <FormField label={t('opts.quantizer')}>
          <Select
            value={options.quantizer}
            onChange={(e) => set('quantizer', e.target.value as QuantizerKind)}
            options={QUANTIZER_OPTS}
          />
        </FormField>

        <FormField label={t('opts.dithering')}>
          <Select
            value={options.dithering}
            onChange={(e) => set('dithering', e.target.value as DitherKind)}
            options={DITHER_OPTS}
          />
        </FormField>

        <label className="flex items-center gap-2 text-[12px] text-[var(--text-2)] cursor-pointer">
          <input
            type="checkbox"
            checked={options.bilateral}
            onChange={(e) => set('bilateral', e.target.checked)}
            className="w-3.5 h-3.5 accent-[var(--neon)]"
          />
          <span>{t('opts.bilateral')}</span>
        </label>
      </Section>

      <Button variant="ghost" onClick={handleReset} className="mt-2 text-[11px]">
        {t('opts.reset')}
      </Button>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 pb-3 border-b border-[var(--border)]">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function SliderRow({
  label,
  help,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  help?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-[var(--text-2)]">{label}</span>
        <span className="font-mono text-[11px] text-[var(--neon)]">
          {format ? format(value) : value}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {help && (
        <span className={cn('text-[10px] text-[var(--text-3)] opacity-70 leading-snug')}>
          {help}
        </span>
      )}
    </div>
  );
}
