'use client';

import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import type { AnimationSettings, AnimationLoopMode } from '@/types/asset';

interface FrameInspectorProps {
  settings: AnimationSettings;
  selectedIndex: number | null;
  onChangeFrameDuration: (index: number, durationMs: number) => void;
  onChangeFps: (fps: number) => void;
  onChangeLoop: (loop: AnimationLoopMode) => void;
  onDeleteFrame: (index: number) => void;
  onDuplicateFrame: (index: number) => void;
  labels: {
    title: string;
    noFrameSelected: string;
    selectedFrame: string;
    of: string;
    duration: string;
    durationMs: string;
    fps: string;
    loop: string;
    loopModes: { loop: string; once: string; pingpong: string };
    deleteFrame: string;
    duplicateFrame: string;
    regenerate: string;
    regenerateComingSoon: string;
    minFrameCountReached: string;
  };
}

export function FrameInspector({
  settings,
  selectedIndex,
  onChangeFrameDuration,
  onChangeFps,
  onChangeLoop,
  onDeleteFrame,
  onDuplicateFrame,
  labels,
}: FrameInspectorProps) {
  const hasSelection = selectedIndex !== null && selectedIndex >= 0 && selectedIndex < settings.frameCount;
  const currentDuration = hasSelection ? settings.frameDurations[selectedIndex] : 0;
  const canDelete = settings.frameCount > 1;

  const loopOptions = [
    { value: 'loop', label: labels.loopModes.loop },
    { value: 'once', label: labels.loopModes.once },
    { value: 'pingpong', label: labels.loopModes.pingpong },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-[12px] font-mono uppercase tracking-[0.06em] text-[var(--text-3)]">
          {labels.title}
        </h3>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {/* Global settings */}
        <div className="space-y-4">
          <FormField label={labels.fps}>
            <Slider
              min={1}
              max={60}
              step={1}
              value={settings.fps}
              onChange={(e) => onChangeFps(Number(e.target.value))}
              showValue
              valueSuffix=" fps"
            />
          </FormField>

          <FormField label={labels.loop}>
            <Select
              value={settings.loop}
              onChange={(e) => onChangeLoop(e.target.value as AnimationLoopMode)}
              options={loopOptions}
            />
          </FormField>
        </div>

        {/* Per-frame */}
        <div className="pt-4 border-t border-[var(--border)] space-y-4">
          {!hasSelection ? (
            <p className="text-[12px] text-[var(--text-3)] text-center py-6">
              {labels.noFrameSelected}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--text-3)]">
                  {labels.selectedFrame}
                </span>
                <span className="font-mono text-[11px] text-[var(--text-2)]">
                  {selectedIndex + 1} {labels.of} {settings.frameCount}
                </span>
              </div>

              <FormField label={labels.duration}>
                <Slider
                  min={16}
                  max={2000}
                  step={1}
                  value={currentDuration}
                  onChange={(e) =>
                    onChangeFrameDuration(selectedIndex, Number(e.target.value))
                  }
                  showValue
                  valueSuffix={labels.durationMs}
                />
              </FormField>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => onDuplicateFrame(selectedIndex)}
                >
                  {labels.duplicateFrame}
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-[rgba(255,100,100,0.9)] hover:text-[rgba(255,120,120,1)]"
                  disabled={!canDelete}
                  title={!canDelete ? labels.minFrameCountReached : undefined}
                  onClick={() => onDeleteFrame(selectedIndex)}
                >
                  {labels.deleteFrame}
                </Button>
                <Button
                  variant="ghost"
                  disabled
                  title={labels.regenerateComingSoon}
                  className="justify-start opacity-50"
                >
                  {labels.regenerate}
                  <span className="ml-auto text-[9px] font-mono text-[var(--text-3)] uppercase">
                    v6
                  </span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
