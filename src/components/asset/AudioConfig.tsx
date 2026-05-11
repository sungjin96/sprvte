'use client';

import { FormField } from '@/components/ui/FormField';
import { NumberInput } from '@/components/ui/NumberInput';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';

export interface AudioConfigData {
  duration: number;
  genre: string;
  mood: string;
  bpm: number;
}

const GENRE_OPTIONS = [
  'Fantasy', 'Sci-Fi', 'Horror', 'Action', 'Ambient', 'Casual', 'RPG', 'Custom',
].map((v) => ({ value: v, label: v }));

const MOOD_OPTIONS = [
  'Epic', 'Calm', 'Tense', 'Mysterious', 'Happy', 'Sad', 'Dark', 'Playful',
].map((v) => ({ value: v, label: v }));

interface AudioConfigProps {
  value: AudioConfigData;
  onChange: (data: AudioConfigData) => void;
}

function AudioConfig({ value, onChange }: AudioConfigProps) {
  const set = <K extends keyof AudioConfigData>(key: K, v: AudioConfigData[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--g1)]">
      <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">Audio Settings</span>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Genre">
          <Select
            value={value.genre}
            onChange={(e) => set('genre', e.target.value)}
            options={GENRE_OPTIONS}
          />
        </FormField>
        <FormField label="Mood">
          <Select
            value={value.mood}
            onChange={(e) => set('mood', e.target.value)}
            options={MOOD_OPTIONS}
          />
        </FormField>
      </div>

      <FormField label="Duration (seconds)">
        <NumberInput
          value={value.duration}
          onChange={(v) => set('duration', v)}
          min={3}
          max={180}
        />
      </FormField>

      <FormField label="BPM">
        <Slider
          min={40}
          max={200}
          step={1}
          value={value.bpm}
          onChange={(v) => set('bpm', v)}
          label="Tempo"
          unit=" bpm"
        />
      </FormField>
    </div>
  );
}

export { AudioConfig };
