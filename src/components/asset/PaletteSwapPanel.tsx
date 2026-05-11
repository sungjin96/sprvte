'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface ColorMapping {
  from: string;
  to: string;
}

interface PaletteSwapPanelProps {
  assetId: string;
  onSuccess?: (newAssetId: string) => void;
}

function PaletteSwapPanel({ assetId, onSuccess }: PaletteSwapPanelProps) {
  const [mappings, setMappings] = useState<ColorMapping[]>([{ from: '#ffffff', to: '#ff0000' }]);
  const [loading, setLoading] = useState(false);

  const addMapping = () => setMappings((p) => [...p, { from: '#000000', to: '#000000' }]);
  const removeMapping = (i: number) => setMappings((p) => p.filter((_, idx) => idx !== i));
  const updateMapping = (i: number, key: keyof ColorMapping, val: string) =>
    setMappings((p) => p.map((m, idx) => (idx === i ? { ...m, [key]: val } : m)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/palette-swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onSuccess?.(data.id);
    } catch {
      // toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">Palette Swap</span>
        <button
          type="button"
          onClick={addMapping}
          className="text-[11px] font-mono text-[var(--text-3)] hover:text-[var(--neon)] transition-colors"
        >
          + Add color
        </button>
      </div>

      {mappings.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            value={m.from}
            onChange={(e) => updateMapping(i, 'from', e.target.value)}
            className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
          />
          <svg viewBox="0 0 16 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-[var(--text-3)] shrink-0">
            <path d="M1 4h12M9 1l4 3-4 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="color"
            value={m.to}
            onChange={(e) => updateMapping(i, 'to', e.target.value)}
            className="w-8 h-8 rounded-lg border border-[var(--border)] cursor-pointer bg-transparent"
          />
          <span className="text-[11px] font-mono text-[var(--text-3)] flex-1">{m.from} → {m.to}</span>
          {mappings.length > 1 && (
            <button type="button" onClick={() => removeMapping(i)} className="text-[var(--text-3)] hover:text-red-400 transition-colors">
              <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M1 1l8 8M9 1L1 9" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      ))}

      <Button type="submit" variant="ghost" disabled={loading} className="w-full">
        {loading ? 'Applying…' : 'Apply Palette Swap'}
      </Button>
    </form>
  );
}

export { PaletteSwapPanel };
