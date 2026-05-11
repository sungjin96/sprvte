'use client';

import { FormField } from '@/components/ui/FormField';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';

export interface AnimationConfigData {
  frameCount: number;
  animationType: string;
  fps: number;
}

const ANIMATION_TYPES = [
  { value: 'idle', label: 'Idle' },
  { value: 'walk', label: 'Walk' },
  { value: 'run', label: 'Run' },
  { value: 'attack', label: 'Attack' },
  { value: 'jump', label: 'Jump' },
  { value: 'die', label: 'Die' },
  { value: 'custom', label: 'Custom' },
];

interface AnimationConfigProps {
  value: AnimationConfigData;
  onChange: (data: AnimationConfigData) => void;
}

function AnimationConfig({ value, onChange }: AnimationConfigProps) {
  const set = <K extends keyof AnimationConfigData>(key: K, v: AnimationConfigData[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--g1)]">
      <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">Animation Settings</span>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type">
          <Select
            value={value.animationType}
            onChange={(e) => set('animationType', e.target.value)}
            options={ANIMATION_TYPES}
          />
        </FormField>
        <FormField label="Frames">
          <NumberInput
            value={value.frameCount}
            onChange={(v) => set('frameCount', v)}
            min={2}
            max={32}
          />
        </FormField>
      </div>

      <FormField label="FPS">
        <Slider
          min={4}
          max={30}
          step={1}
          value={value.fps}
          onChange={(v) => set('fps', v)}
          label="FPS"
          unit=" fps"
        />
      </FormField>
    </div>
  );
}

export { AnimationConfig };
