'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BlendMode } from '@/types/asset';
import { LayerItem } from './LayerCanvas';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';

const BLEND_OPTIONS: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'add', label: 'Add' },
  { value: 'soft-light', label: 'Soft Light' },
];

interface LayerCardProps {
  layer: LayerItem;
  selected: boolean;
  onSelect: () => void;
  onVisibilityToggle: () => void;
  onOpacityChange: (value: number) => void;
  onBlendModeChange: (mode: BlendMode) => void;
  onRegenerate: () => void;
  onRemoveBg: () => void;
  onDelete: () => void;
}

function LayerCard({
  layer,
  selected,
  onSelect,
  onVisibilityToggle,
  onOpacityChange,
  onBlendModeChange,
  onRegenerate,
  onRemoveBg,
  onDelete,
}: LayerCardProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'rounded-xl border cursor-pointer transition-all',
        selected
          ? 'border-[var(--neon)] bg-[rgba(0,229,160,0.04)]'
          : 'border-[var(--border)] bg-[var(--g1)] hover:border-[var(--border-hi)] hover:bg-[var(--g2)]',
      )}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 p-3">
        {/* Drag handle */}
        <svg
          viewBox="0 0 12 16"
          fill="currentColor"
          className="w-3 h-4 text-[var(--text-3)] shrink-0 cursor-grab"
          onClick={(e) => e.stopPropagation()}
        >
          <circle cx="3" cy="4" r="1.2" />
          <circle cx="9" cy="4" r="1.2" />
          <circle cx="3" cy="8" r="1.2" />
          <circle cx="9" cy="8" r="1.2" />
          <circle cx="3" cy="12" r="1.2" />
          <circle cx="9" cy="12" r="1.2" />
        </svg>

        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] shrink-0 relative bg-[var(--g2)]">
          {layer.fileUrl && (
            <Image src={layer.fileUrl} alt={layer.name} fill className="object-cover" />
          )}
        </div>

        {/* Name */}
        <span className="flex-1 text-[12px] text-[var(--text)] truncate font-medium">{layer.name}</span>

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onVisibilityToggle(); }}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0',
            layer.layerData.visible
              ? 'text-[var(--text-2)] hover:text-[var(--text)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)]',
          )}
          title={layer.layerData.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.layerData.visible ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4">
              <ellipse cx="8" cy="8" rx="5" ry="4" />
              <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-4 h-4">
              <path d="M2 2l12 12M6.5 6.7A3 3 0 0 0 9.3 9.5M3.5 4.5A8 8 0 0 0 2 8c1.5 3 4 4 6 4a7 7 0 0 0 3-1M5 3c1-.4 2-.5 3-.5 2 0 4.5 1 6 5a9 9 0 0 1-.7 1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Expanded controls (only when selected) */}
      {selected && (
        <div
          className="px-3 pb-3 space-y-3 border-t border-[var(--border)] pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Opacity */}
          <Slider
            min={0}
            max={100}
            step={1}
            value={layer.layerData.opacity}
            onChange={onOpacityChange}
            label="Opacity"
            unit="%"
          />

          {/* Blend mode */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-3)] w-16 shrink-0">Blend</span>
            <Select
              value={layer.layerData.blendMode}
              onChange={(e) => onBlendModeChange(e.target.value as BlendMode)}
              options={BLEND_OPTIONS}
              className="flex-1 h-7 text-[12px]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={onRegenerate}
              className="flex-1 h-7 text-[11px] font-mono rounded-lg border border-[var(--neon)] text-[var(--neon)] bg-[var(--neon-dim)] hover:bg-[rgba(0,229,160,0.1)] transition-colors"
            >
              Regenerate
            </button>
            <button
              type="button"
              onClick={onRemoveBg}
              className="flex-1 h-7 text-[11px] font-mono rounded-lg border border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-hi)] hover:bg-[var(--g2)] transition-colors"
            >
              Remove BG
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete layer"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M2 4h10M5 4V2.5h4V4M5.5 4l.5 7h2l.5-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { LayerCard };
