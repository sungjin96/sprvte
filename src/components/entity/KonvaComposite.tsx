'use client';

import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Line } from 'react-konva';
import type Konva from 'konva';
import { usePixelatedImage } from '@/lib/image/usePixelatedImage';
import type { OutputSize } from '@/components/asset/OutputSizeSelector';
import type { LiveLayer } from '@/types/liveLayer';

interface KonvaCompositeProps {
  layers: LiveLayer[]; // already in paint order, visible-only
  activeLayerId: string | null;
  width: number;
  height: number;
  outputSize: OutputSize;
  /** Computed integer-multiple display size for pixel-perfect render. */
  displaySize: number | null;
  /** Grid cell size in display pixels (null = no grid). */
  gridCellPx: number | null;
  soloMode: boolean;
  zoom: number; // 25..200
  onLayerClick?: (id: string) => void;
  /** Cmd/Ctrl + scroll → wheel zoom. Parent updates zoom state. */
  onZoomChange?: (next: number) => void;
  /** Reset signal — pan offset clears when this value changes. */
  panResetKey?: number;
}

/**
 * Hook: load an image URL into an HTMLImageElement that Konva can paint.
 * Pixelation preview happens upstream (usePixelatedImage), output is the
 * source URL we feed Konva.
 */
function useKonvaImage(src: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    let cancelled = false;
    el.onload = () => { if (!cancelled) setImg(el); };
    el.onerror = () => { if (!cancelled) setImg(null); };
    el.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return img;
}

function LayerNode({
  layer,
  isActive,
  outputSize,
  displaySize,
  stageW,
  stageH,
  soloMode,
  onClick,
}: {
  layer: LiveLayer;
  isActive: boolean;
  outputSize: OutputSize;
  displaySize: number | null;
  stageW: number;
  stageH: number;
  soloMode: boolean;
  onClick?: () => void;
}) {
  const isPixel = outputSize !== 'regular';
  const previewUrl = usePixelatedImage(layer.imageUrl ?? null, outputSize);
  const img = useKonvaImage(previewUrl);
  const ref = useRef<Konva.Image | null>(null);

  // Hide non-active layers in solo mode
  if (soloMode && !isActive) return null;
  if (!layer.visible || !img) return null;

  // Pixel-perfect: paint at displaySize × displaySize, centered
  // Regular: fit to stage with object-contain logic
  let w: number, h: number, x: number, y: number;
  if (isPixel && displaySize !== null) {
    w = displaySize;
    h = displaySize;
    x = (stageW - w) / 2;
    y = (stageH - h) / 2;
  } else {
    const ar = img.width / img.height;
    const stageAr = stageW / stageH;
    if (ar > stageAr) {
      w = stageW;
      h = stageW / ar;
    } else {
      h = stageH;
      w = stageH * ar;
    }
    x = (stageW - w) / 2;
    y = (stageH - h) / 2;
  }

  return (
    <KImage
      ref={ref}
      image={img}
      x={x}
      y={y}
      width={w}
      height={h}
      opacity={isActive ? 1 : (soloMode ? 1 : 0.6)}
      shadowEnabled={isActive}
      shadowColor="#00E5A0"
      shadowBlur={isActive ? 24 : 0}
      shadowOpacity={isActive ? 0.7 : 0}
      stroke={isActive ? '#00E5A0' : undefined}
      strokeWidth={isActive ? 1 : 0}
      strokeEnabled={isActive}
      perfectDrawEnabled={false}
      imageSmoothingEnabled={!isPixel}
      onClick={onClick}
      onTap={onClick}
    />
  );
}

export function KonvaComposite({
  layers,
  activeLayerId,
  width,
  height,
  outputSize,
  displaySize,
  gridCellPx,
  soloMode,
  zoom,
  onLayerClick,
  onZoomChange,
  panResetKey,
}: KonvaCompositeProps) {
  // Pan offset in stage display pixels. Empty-area drag updates this.
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panningRef = useRef<{ startMouse: { x: number; y: number }; startPan: { x: number; y: number } } | null>(null);

  // External reset (zoom/pan reset button)
  useEffect(() => { setPan({ x: 0, y: 0 }); }, [panResetKey]);

  if (width === 0 || height === 0) return null;

  // Grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (gridCellPx !== null && gridCellPx > 1) {
    const cx = width / 2;
    const cy = height / 2;
    // Center origin so grid aligns with centered art
    for (let x = cx; x < width; x += gridCellPx) gridLines.push({ x1: x, y1: 0, x2: x, y2: height });
    for (let x = cx - gridCellPx; x > 0; x -= gridCellPx) gridLines.push({ x1: x, y1: 0, x2: x, y2: height });
    for (let y = cy; y < height; y += gridCellPx) gridLines.push({ x1: 0, y1: y, x2: width, y2: y });
    for (let y = cy - gridCellPx; y > 0; y -= gridCellPx) gridLines.push({ x1: 0, y1: y, x2: width, y2: y });
  }

  return (
    <Stage
      width={width}
      height={height}
      scaleX={zoom / 100}
      scaleY={zoom / 100}
      x={pan.x}
      y={pan.y}
      offsetX={(width * (zoom / 100 - 1)) / 2 / (zoom / 100)}
      offsetY={(height * (zoom / 100 - 1)) / 2 / (zoom / 100)}
      onWheel={(e) => {
        // Cmd (mac) / Ctrl (win) + scroll → zoom
        if (!(e.evt.metaKey || e.evt.ctrlKey)) return;
        e.evt.preventDefault();
        if (!onZoomChange) return;
        const delta = -e.evt.deltaY;
        const factor = delta > 0 ? 1.1 : 1 / 1.1;
        const next = Math.max(25, Math.min(400, Math.round(zoom * factor)));
        onZoomChange(next);
      }}
      onMouseDown={(e) => {
        // Cmd (mac) / Ctrl (win) + click on anywhere → start panning
        if (!(e.evt.metaKey || e.evt.ctrlKey)) return;
        e.evt.preventDefault();
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        panningRef.current = { startMouse: { x: pos.x, y: pos.y }, startPan: { ...pan } };
      }}
      onMouseMove={(e) => {
        const drag = panningRef.current;
        if (!drag) return;
        const stage = e.target.getStage();
        const pos = stage?.getPointerPosition();
        if (!pos) return;
        setPan({
          x: drag.startPan.x + (pos.x - drag.startMouse.x),
          y: drag.startPan.y + (pos.y - drag.startMouse.y),
        });
      }}
      onMouseUp={() => { panningRef.current = null; }}
      onMouseLeave={() => { panningRef.current = null; }}
    >
      {/* Background tile */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={width} height={height} fill="rgba(0,0,0,0.4)" />
      </Layer>

      {/* Composite layers (paint order: bottom → top) */}
      {/* imageSmoothingEnabled at Layer scope — Konva ignores per-Image setting.
          When in pixel mode, disable smoothing so 32×32 dataURLs scale up
          NN sharp instead of bilinear blur. */}
      <Layer imageSmoothingEnabled={outputSize === 'regular'}>
        {layers.map((l) => (
          <LayerNode
            key={l.id}
            layer={l}
            isActive={l.id === activeLayerId}
            outputSize={outputSize}
            displaySize={displaySize}
            stageW={width}
            stageH={height}
            soloMode={soloMode}
            onClick={onLayerClick ? () => onLayerClick(l.id) : undefined}
          />
        ))}
      </Layer>

      {/* Grid overlay */}
      {gridLines.length > 0 && (
        <Layer listening={false}>
          {gridLines.map((g, i) => (
            <Line
              key={i}
              points={[g.x1, g.y1, g.x2, g.y2]}
              stroke="rgba(0,229,160,0.18)"
              strokeWidth={1}
            />
          ))}
        </Layer>
      )}
    </Stage>
  );
}
