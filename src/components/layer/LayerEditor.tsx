'use client';

import { useState, useCallback } from 'react';
import { BlendMode } from '@/types/asset';
import { LayerCanvas, LayerItem } from './LayerCanvas';
import { LayerPanel } from './LayerPanel';
import { LayerGenerateForm } from './LayerGenerateForm';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LayerEditorProps {
  initialLayers: LayerItem[];
  onSaveComposite?: (layers: LayerItem[]) => Promise<void>;
}

function LayerEditor({ initialLayers, onSaveComposite }: LayerEditorProps) {
  const [layers, setLayers] = useState<LayerItem[]>(initialLayers);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLayers[0]?.id ?? null,
  );
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [regenLayerId, setRegenLayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedLayer = layers.find((l) => l.id === selectedId) ?? null;

  // Mutation helpers
  const updateLayer = useCallback((id: string, patch: Partial<LayerItem['layerData']>) =>
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, layerData: { ...l.layerData, ...patch } } : l,
      ),
    ),
  []);

  const handleVisibilityToggle = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (layer) updateLayer(id, { visible: !layer.layerData.visible });
  };

  const handleOpacityChange = (id: string, value: number) => updateLayer(id, { opacity: value });
  const handleBlendModeChange = (id: string, mode: BlendMode) => updateLayer(id, { blendMode: mode });

  const handleReorder = (newLayers: LayerItem[]) => setLayers(newLayers);

  const handleDelete = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(layers.find((l) => l.id !== id)?.id ?? null);
  };

  const handleRegenerate = (id: string) => {
    setRegenLayerId(id);
  };

  const handleRemoveBg = (id: string) => {
    // Stub — will call POST /api/assets/[id]/remove-bg in Phase C
    console.log('Remove BG for layer:', id);
  };

  const handleRegenSubmit = async (layerId: string, prompt: string, _neg: string) => {
    // Stub — will enqueue regeneration job in Phase C
    console.log('Regenerate layer', layerId, prompt);
    setRegenLayerId(null);
  };

  const handleSaveComposite = async () => {
    if (!onSaveComposite) return;
    setSaving(true);
    try {
      await onSaveComposite(layers);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left: Canvas area */}
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* Canvas */}
        <div className="aspect-square w-full max-w-[512px] mx-auto">
          <LayerCanvas
            layers={layers}
            selectedLayerId={selectedId}
          />
        </div>

        {/* Save composite */}
        {onSaveComposite && (
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveComposite}
            disabled={saving}
            className="w-full max-w-[512px] mx-auto gap-2"
          >
            {saving ? <LoadingSpinner size="sm" /> : null}
            {saving ? 'Saving…' : 'Save Composite'}
          </Button>
        )}

        {/* Selected layer regenerate form */}
        {selectedLayer && (
          <div className="max-w-[512px] mx-auto w-full">
            <LayerGenerateForm
              layer={selectedLayer}
              onRegenerate={handleRegenSubmit}
            />
          </div>
        )}
      </div>

      {/* Right: Layer panel */}
      <div className="w-[280px] shrink-0 border-l border-[var(--border)] flex flex-col">
        <LayerPanel
          layers={layers}
          selectedLayerId={selectedId}
          onSelect={setSelectedId}
          onVisibilityToggle={handleVisibilityToggle}
          onOpacityChange={handleOpacityChange}
          onBlendModeChange={handleBlendModeChange}
          onReorder={handleReorder}
          onRegenerate={handleRegenerate}
          onRemoveBg={handleRemoveBg}
          onDelete={handleDelete}
          onAddLayer={() => setAddDialogOpen(true)}
        />
      </div>

      {/* Add layer dialog (stub) */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Layer"
        size="sm"
      >
        <p className="text-[13px] text-[var(--text-2)] mb-4">
          Generate a new transparent-background layer. It will be added on top of the existing layers.
        </p>
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={() => setAddDialogOpen(false)}
        >
          Coming in Phase C
        </Button>
      </Dialog>
    </div>
  );
}

export { LayerEditor };
