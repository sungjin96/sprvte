'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { type LiveLayer, buildLayerTree, flattenForPaint } from '@/types/liveLayer';
import { OutputSizeSelector, type OutputSize } from '@/components/asset/OutputSizeSelector';

// Konva relies on `window` — load client-side only
const KonvaComposite = dynamic(
  () => import('./KonvaComposite').then((m) => m.KonvaComposite),
  { ssr: false },
);

type GridSize = 'off' | 'auto' | number;
const GRID_OPTIONS: number[] = [4, 8, 16, 32, 64];

interface LiveCanvasProps {
  layers: LiveLayer[];
  activeLayerId: string | null;
  outputSize?: OutputSize;
  onOutputSizeChange?: (size: OutputSize) => void;
  onLockIn?: () => void;
}

const Icons = {
  ZoomIn: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <circle cx="6" cy="6" r="4" /><path d="M9 9l3.5 3.5M4 6h4M6 4v4" strokeLinecap="round" />
    </svg>
  ),
  ZoomOut: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <circle cx="6" cy="6" r="4" /><path d="M9 9l3.5 3.5M4 6h4" strokeLinecap="round" />
    </svg>
  ),
  Grid: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-3.5 h-3.5">
      <rect x="2" y="2" width="10" height="10" />
      <path d="M2 5.5h10M2 9h10M5.5 2v10M9 2v10" />
    </svg>
  ),
  Solo: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <rect x="2" y="2" width="10" height="10" rx="1.5" />
      <path d="M5 5h4v4H5z" fill="currentColor" />
    </svg>
  ),
  Reset: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <path d="M2 7a5 5 0 1 0 1.5-3.5" strokeLinecap="round" />
      <path d="M2 4v3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Save: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
      <path d="M3 2h8v10H3V2z" /><path d="M5 2v3h4V2M5 8h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function LiveCanvas({
  layers,
  activeLayerId,
  outputSize = 'regular',
  onOutputSizeChange,
  onLockIn,
}: LiveCanvasProps) {
  const t = useTranslations('entityWorkspace.live');
  const tSize = useTranslations('outputSize');
  const [zoom, setZoom] = useState(100);
  const [gridSize, setGridSize] = useState<GridSize>('auto');
  const [soloMode, setSoloMode] = useState(false);
  const [panResetKey, setPanResetKey] = useState(0);

  // Track stage container size for pixel-perfect display calc
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageBox, setStageBox] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setStageBox({ w: r.width, h: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Flatten the layer tree into paint order (parent → children, in order)
  const sortedLayers = flattenForPaint(buildLayerTree(layers));

  // Pixel-perfect display size: each art pixel = integer N display pixels.
  // Avoids fractional scaling that creates muddy sub-pixel boundaries.
  const displaySize: number | null = (() => {
    if (outputSize === 'regular') return null;
    if (stageBox.w === 0 || stageBox.h === 0) return null;
    const usable = Math.min(stageBox.w, stageBox.h) * (zoom / 100) - 32;
    const scale = Math.max(1, Math.floor(usable / (outputSize as number)));
    return (outputSize as number) * scale;
  })();
  const displayScale = displaySize && outputSize !== 'regular'
    ? Math.round(displaySize / (outputSize as number))
    : null;

  // Resolve effective grid:
  //   'off'  → no grid
  //   'auto' → match outputSize (pixel mode) or 32px (regular mode)
  //   number → that many art-pixels per cell (pixel mode), or display-pixels (regular)
  const effectiveGrid: number | null =
    gridSize === 'off' ? null
      : gridSize === 'auto' ? (outputSize === 'regular' ? 32 : (outputSize as number))
      : gridSize;

  // Grid cell size in display pixels.
  const gridCellPx: number | null = (() => {
    if (effectiveGrid === null) return null;
    if (outputSize !== 'regular' && displaySize) {
      const cells = Math.max(1, Math.min(outputSize as number, effectiveGrid));
      return (displaySize / (outputSize as number)) * cells;
    }
    return effectiveGrid;
  })();

  return (
    <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
      {/* Composite preview area */}
      <div
        ref={stageRef}
        className="relative bg-[rgba(0,0,0,0.4)]"
        style={{
          aspectRatio: '4/3',
          imageRendering: outputSize === 'regular' ? 'auto' : 'pixelated',
        }}
      >
        {/* Konva composite (handles layers + grid + zoom) */}
        <div className="absolute inset-0">
          {sortedLayers.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-mono text-[11px] text-[var(--text-3)]">empty composition</span>
            </div>
          ) : (
            <KonvaComposite
              layers={sortedLayers}
              activeLayerId={activeLayerId}
              width={stageBox.w}
              height={stageBox.h}
              outputSize={outputSize}
              displaySize={displaySize}
              gridCellPx={gridCellPx}
              soloMode={soloMode}
              zoom={zoom}
              onZoomChange={setZoom}
              panResetKey={panResetKey}
            />
          )}
        </div>

        {/* Active layer label */}
        {activeLayerId && (
          <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-[6px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--neon)]">
            ★ {layers.find((l) => l.id === activeLayerId)?.name ?? ''}
          </div>
        )}

        {/* Display scale indicator */}
        {displayScale !== null && outputSize !== 'regular' && (
          <div className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-[6px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px] font-mono text-[10px] uppercase tracking-[0.04em] text-[var(--text-2)]">
            {outputSize}×{outputSize} · {t('displayScale', { n: displayScale })}
          </div>
        )}

        {/* Save to gallery */}
        {onLockIn && sortedLayers.length > 0 && (
          <button
            type="button"
            onClick={onLockIn}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]"
          >
            {Icons.Save}
            {t('lockIn')}
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border)] bg-[rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(25, z - 25))}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
          title={t('toolbarZoom')}
        >
          {Icons.ZoomOut}
        </button>
        <span className="font-mono text-[11px] text-[var(--text-3)] min-w-[40px] text-center">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(200, z + 25))}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
          title={t('toolbarZoom')}
        >
          {Icons.ZoomIn}
        </button>

        <div className="h-4 w-px bg-[var(--border)]" />

        {/* Grid selector */}
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'w-7 h-7 rounded-[6px] flex items-center justify-center',
              gridSize !== 'off' ? 'text-[var(--neon)]' : 'text-[var(--text-3)]',
            )}
            title={t('toolbarGrid')}
          >
            {Icons.Grid}
          </span>
          <select
            value={typeof gridSize === 'number' ? String(gridSize) : gridSize}
            onChange={(e) => {
              const v = e.target.value;
              setGridSize(v === 'off' || v === 'auto' ? v : Number(v));
            }}
            className="bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[6px] text-[10px] font-mono text-[var(--text-2)] px-1.5 py-1 outline-none focus:border-[rgba(0,229,160,0.3)]"
          >
            <option value="off">{t('gridOff')}</option>
            <option value="auto">{t('gridAuto')}</option>
            {GRID_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}px</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSoloMode((s) => !s)}
          className={cn(
            'w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors duration-[100ms]',
            soloMode
              ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
              : 'text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--g2)]',
          )}
          title={t('toolbarSoloLayer')}
        >
          {Icons.Solo}
        </button>

        <button
          type="button"
          onClick={() => { setZoom(100); setGridSize('auto'); setSoloMode(false); setPanResetKey((k) => k + 1); }}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text-2)] hover:bg-[var(--g2)] transition-colors duration-[100ms] ml-auto"
          title={t('toolbarReset')}
        >
          {Icons.Reset}
        </button>
      </div>

      {/* Output size / pixelation control */}
      {onOutputSizeChange && (
        <div className="px-3 py-2.5 border-t border-[var(--border)] bg-[rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
              {tSize('label')}
            </span>
            <span className="font-mono text-[10px] text-[var(--text-3)] opacity-70">
              {outputSize === 'regular' ? tSize('regular') : `${outputSize}×${outputSize}`}
            </span>
          </div>
          <OutputSizeSelector value={outputSize} onChange={onOutputSizeChange} compact />
          {outputSize !== 'regular' && (
            <p className="mt-1.5 font-mono text-[9px] text-[var(--neon)] opacity-80">
              ✦ {tSize('cleanPixelation')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
