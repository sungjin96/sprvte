'use client';

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { BlendMode } from '@/types/asset';
import { LayerItem } from './LayerCanvas';
import { LayerCard } from './LayerCard';
import { Button } from '@/components/ui/Button';

interface LayerPanelProps {
  layers: LayerItem[];
  selectedLayerId: string | null;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string) => void;
  onOpacityChange: (id: string, value: number) => void;
  onBlendModeChange: (id: string, mode: BlendMode) => void;
  onReorder: (newLayers: LayerItem[]) => void;
  onRegenerate: (id: string) => void;
  onRemoveBg: (id: string) => void;
  onDelete: (id: string) => void;
  onAddLayer: () => void;
}

function LayerPanel({
  layers,
  selectedLayerId,
  onSelect,
  onVisibilityToggle,
  onOpacityChange,
  onBlendModeChange,
  onReorder,
  onRegenerate,
  onRemoveBg,
  onDelete,
  onAddLayer,
}: LayerPanelProps) {
  const dragId = useRef<string | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Sorted copy (top of UI = highest zIndex)
  const sorted = [...layers].sort((a, b) => b.layerData.zIndex - a.layerData.zIndex);

  const handleDragStart = (id: string) => { dragId.current = id; };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (!dragId.current) return;
    const from = sorted.findIndex((l) => l.id === dragId.current);
    if (from === -1 || from === dropIdx) { dragId.current = null; setOverIdx(null); return; }

    const newSorted = [...sorted];
    const [moved] = newSorted.splice(from, 1);
    newSorted.splice(dropIdx, 0, moved);

    // Re-assign zIndex based on position (top = highest)
    const reordered = newSorted.map((l, i) => ({
      ...l,
      layerData: { ...l.layerData, zIndex: newSorted.length - i },
    }));
    onReorder(reordered);
    dragId.current = null;
    setOverIdx(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
        <span className="text-[12px] font-semibold text-[var(--text)]">Layers</span>
        <Button type="button" variant="ghost" onClick={onAddLayer} className="h-7 px-2 text-[11px] gap-1">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <path d="M6 1v10M1 6h10" strokeLinecap="round" />
          </svg>
          Add Layer
        </Button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 && (
          <p className="text-center text-[12px] text-[var(--text-3)] py-8">
            No layers yet. Add a layer to start compositing.
          </p>
        )}
        {sorted.map((layer, idx) => (
          <div
            key={layer.id}
            draggable
            onDragStart={() => handleDragStart(layer.id)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={() => { dragId.current = null; setOverIdx(null); }}
            className={cn(overIdx === idx && 'ring-1 ring-[var(--neon)] rounded-xl')}
          >
            <LayerCard
              layer={layer}
              selected={selectedLayerId === layer.id}
              onSelect={() => onSelect(layer.id)}
              onVisibilityToggle={() => onVisibilityToggle(layer.id)}
              onOpacityChange={(v) => onOpacityChange(layer.id, v)}
              onBlendModeChange={(m) => onBlendModeChange(layer.id, m)}
              onRegenerate={() => onRegenerate(layer.id)}
              onRemoveBg={() => onRemoveBg(layer.id)}
              onDelete={() => onDelete(layer.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { LayerPanel };
