'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AssetType, IMAGE_ASSET_TYPES, AUDIO_ASSET_TYPES } from '@/types/asset';
import { FormField } from '@/components/ui/FormField';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { TypeChip } from '@/components/ui/TypeChip';
import { Select } from '@/components/ui/Select';
import { OutputSizeSelector, type OutputSize } from './OutputSizeSelector';
import { AnimationConfig, AnimationConfigData } from './AnimationConfig';
import { AudioConfig, AudioConfigData } from './AudioConfig';

const ALL_TYPES: AssetType[] = [
  'character', 'background', 'ui', 'sprite_sheet', 'effect', 'bgm', 'sfx', 'ambient',
];

// Available models per category (mock — wired to settings/providers in Phase B)
const MODELS_BY_CATEGORY: Record<'image' | 'audio' | 'animation', { value: string; label: string }[]> = {
  image: [
    { value: 'replicate-flux-schnell',  label: 'FLUX.1 [schnell] (균형, 권장)' },
    { value: 'replicate-sdxl-lightning', label: 'SDXL Lightning (빠름, 가성비)' },
    { value: 'openai-gpt-image-2',       label: 'GPT-Image-2 (프리미엄)' },
  ],
  audio: [
    { value: 'mubert',         label: 'Mubert (BGM, 가성비)' },
    { value: 'elevenlabs-sfx', label: 'ElevenLabs SFX (균형)' },
    { value: 'suno-v4',        label: 'Suno v4 (프리미엄)' },
  ],
  animation: [
    { value: 'autosprite',         label: 'AutoSprite (알고리즘, 최저가)' },
    { value: 'animatediff',        label: 'AnimateDiff (AI, 균형)' },
    { value: 'runway-gen3-turbo',  label: 'Runway Gen-3 Turbo (프리미엄)' },
  ],
};

function modelsForType(type: AssetType): { value: string; label: string }[] {
  if (type === 'sprite_sheet') return MODELS_BY_CATEGORY.animation;
  if (AUDIO_ASSET_TYPES.includes(type)) return MODELS_BY_CATEGORY.audio;
  return MODELS_BY_CATEGORY.image;
}

export interface GenerateFormData {
  name: string;
  type: AssetType;
  prompt: string;
  negativePrompt: string;
  model: string;
  outputSize?: OutputSize;
  animation?: AnimationConfigData;
  audio?: AudioConfigData;
}

interface AssetGenerateFormProps {
  onSubmit: (data: GenerateFormData) => void;
  loading?: boolean;
  defaultType?: AssetType;
}

function AssetGenerateForm({ onSubmit, loading, defaultType = 'character' }: AssetGenerateFormProps) {
  const t = useTranslations('assets.generate');
  const tType = useTranslations('assets.type');
  const [type, setType] = useState<AssetType>(defaultType);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [outputSize, setOutputSize] = useState<OutputSize>(64);
  const [animation, setAnimation] = useState<AnimationConfigData>({ frameCount: 8, animationType: 'walk', fps: 12 });
  const [audio, setAudio] = useState<AudioConfigData>({ duration: 30, genre: 'Fantasy', mood: 'Epic', bpm: 120 });
  const [model, setModel] = useState<string>(modelsForType(defaultType)[0].value);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset model when type category changes
  const handleTypeChange = (newType: AssetType) => {
    setType(newType);
    const models = modelsForType(newType);
    if (!models.find((m) => m.value === model)) {
      setModel(models[0].value);
    }
  };

  const isImage = IMAGE_ASSET_TYPES.includes(type);
  const isAudio = AUDIO_ASSET_TYPES.includes(type);
  const isSpriteSheet = type === 'sprite_sheet';

  const validate = () => {
    const e: Record<string, string> = {};
    if (!prompt.trim()) e.prompt = t('promptRequired');
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSubmit({
      name: name.trim(),
      type,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      model,
      outputSize: isImage ? outputSize : undefined,
      animation: isSpriteSheet ? animation : undefined,
      audio: isAudio ? audio : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <FormField label={t('type')}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map((typeKey) => (
            <TypeChip
              key={typeKey}
              active={type === typeKey}
              onClick={() => handleTypeChange(typeKey)}
            >
              {tType(typeKey)}
            </TypeChip>
          ))}
        </div>
      </FormField>

      {/* Model selector */}
      <FormField label={t('model')} hint={t('modelHint')}>
        <Select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          options={modelsForType(type)}
        />
      </FormField>

      {/* Name (optional) */}
      <FormField label={t('name')} hint={t('nameHint')}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('namePlaceholder', { type: tType(type), date: new Date().toISOString().slice(0, 10) })}
        />
      </FormField>

      {/* Prompt */}
      <FormField label={t('prompt')} required error={errors.prompt}>
        <Textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setErrors((p) => ({ ...p, prompt: '' })); }}
          placeholder={isAudio ? t('promptPlaceholderAudio') : t('promptPlaceholderImage')}
          rows={3}
          hasError={!!errors.prompt}
        />
      </FormField>

      {/* Negative prompt (image only) */}
      {isImage && (
        <FormField label={t('negativePrompt')} hint={t('negativePromptHint')}>
          <Textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder={t('negativePromptPlaceholder')}
            rows={2}
          />
        </FormField>
      )}

      {/* Unified Output Size (no pixelation OR pixel art at N) */}
      {isImage && (
        <FormField
          label={t('outputSize')}
          hint={outputSize === 'regular' ? t('outputSizeRegularHint') : t('outputSizePixelHint', { n: outputSize })}
        >
          <OutputSizeSelector value={outputSize} onChange={setOutputSize} />
        </FormField>
      )}

      {/* Animation config (sprite sheet only) */}
      {isSpriteSheet && (
        <AnimationConfig value={animation} onChange={setAnimation} />
      )}

      {/* Audio config (audio types) */}
      {isAudio && (
        <AudioConfig value={audio} onChange={setAudio} />
      )}

      {/* Submit */}
      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? t('generating') : t('generateType', { type: tType(type) })}
      </Button>
    </form>
  );
}

export { AssetGenerateForm };
