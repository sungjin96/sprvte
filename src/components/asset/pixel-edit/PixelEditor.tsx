'use client';

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useTranslations } from 'next-intl';
import { Stage, Layer, Image as KImage, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  fromDataURL,
  toDataURL,
  cloneImageData,
  setPixel,
  getPixel,
  pixelIndex,
  bresenhamLine,
  type RGBA,
  type Point,
} from '@/lib/pixel-edit/pixelData';
import {
  createHistory,
  pushStroke,
  undo as historyUndo,
  redo as historyRedo,
  buildStrokePatch,
  canUndo,
  canRedo,
  type HistoryState,
} from '@/lib/pixel-edit/pixelHistory';
import {
  extractPalette,
  addColor,
  removeColor,
  type PaletteColor,
} from '@/lib/pixel-edit/palette';
import { PixelToolbar, type Tool } from './PixelToolbar';
import { PalettePanel } from './PalettePanel';

// ── Reducer state ─────────────────────────────────────────────────────────────
interface EditorState {
  tool: Tool;
  color: RGBA;
  zoom: number;
}
type Action =
  | { type: 'set-tool'; tool: Tool }
  | { type: 'set-color'; color: RGBA }
  | { type: 'set-zoom'; zoom: number }
  | { type: 'eyedrop'; color: RGBA }; // sets color + reverts to pencil

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'set-tool':  return { ...state, tool: action.tool };
    case 'set-color': return { ...state, color: action.color };
    case 'set-zoom':  return { ...state, zoom: Math.max(1, Math.min(32, action.zoom)) };
    case 'eyedrop':   return { ...state, color: action.color, tool: 'pencil' };
  }
}

const TRANSPARENT: RGBA = [0, 0, 0, 0];

interface PixelEditorProps {
  /** Source image (algorithm or AI dataURL). */
  sourceUrl: string;
  /** Logical pixel size of the canvas (e.g. 32 for 32×32). */
  size: number;
  /** Called when user clicks save with the edited dataURL. */
  onSave: (dataUrl: string) => void;
  /** Called when user cancels (drawer should revert to compare mode). */
  onCancel: () => void;
}

export function PixelEditor({ sourceUrl, size, onSave, onCancel }: PixelEditorProps) {
  const t = useTranslations('pixelEditor');

  // Editor reducer
  const [editorState, dispatch] = useReducer(reducer, {
    tool: 'pencil',
    color: [255, 255, 255, 255] as RGBA,
    zoom: 8,
  });

  // ImageData = single source of truth
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<HistoryState>(() => createHistory(50));

  // Konva refs (Image source = HTMLCanvasElement)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const konvaImageRef = useRef<Konva.Image | null>(null);
  const drawScheduledRef = useRef(false);

  // Active stroke (mouse down → up)
  const strokeRef = useRef<Map<number, { prev: RGBA; next: RGBA }> | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  // Undo/redo flash (PixelToolbar)
  const [flashUndo, setFlashUndo] = useState(false);
  const [flashRedo, setFlashRedo] = useState(false);
  const triggerFlash = (which: 'undo' | 'redo') => {
    const setter = which === 'undo' ? setFlashUndo : setFlashRedo;
    setter(true);
    setTimeout(() => setter(false), 300);
  };

  // Confirm modal
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Pan via Cmd/Ctrl+drag — works anywhere on the canvas regardless of tool.
  // The outer scroll container is what we manipulate (scrollLeft/Top).
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const panDragRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [panActive, setPanActive] = useState(false);

  // ── Load source ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sourceUrl) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fromDataURL(sourceUrl)
      .then((img) => {
        if (cancelled) return;

        // Build the host canvas. Konva.Image will render this.
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas 2d unavailable');
        ctx.putImageData(img, 0, 0);
        canvasRef.current = canvas;

        setImageData(img);
        setPalette(extractPalette(img));
        setHistory(createHistory(50));
        setDirty(false);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'load failed');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [sourceUrl]);

  // RAF-batched Konva redraw
  const scheduleRedraw = useCallback(() => {
    if (drawScheduledRef.current) return;
    drawScheduledRef.current = true;
    requestAnimationFrame(() => {
      drawScheduledRef.current = false;
      const node = konvaImageRef.current;
      if (node) {
        // Re-set image to invalidate Konva's cache, then draw layer.
        node.image(canvasRef.current ?? undefined);
        node.getLayer()?.batchDraw();
      }
    });
  }, []);

  // ── Drawing primitives ─────────────────────────────────────────────────────
  const writePixel = useCallback((x: number, y: number, next: RGBA) => {
    if (!imageData || !canvasRef.current) return;
    const idx = pixelIndex(imageData, x, y);
    const prev = getPixel(imageData, x, y);
    if (!prev) return;
    if (prev[0] === next[0] && prev[1] === next[1] && prev[2] === next[2] && prev[3] === next[3]) {
      return; // no-op (same colour)
    }
    setPixel(imageData, x, y, next);
    // Mirror to host canvas for Konva
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      const single = new ImageData(new Uint8ClampedArray(next), 1, 1);
      ctx.putImageData(single, x, y);
    }
    // Record into stroke (first prev only)
    const stroke = strokeRef.current;
    if (stroke && !stroke.has(idx)) {
      stroke.set(idx, { prev, next });
    } else if (stroke) {
      const existing = stroke.get(idx)!;
      stroke.set(idx, { prev: existing.prev, next });
    }
    scheduleRedraw();
  }, [imageData, scheduleRedraw]);

  const startStroke = useCallback(() => {
    strokeRef.current = new Map();
  }, []);

  const finishStroke = useCallback(() => {
    if (!strokeRef.current || strokeRef.current.size === 0) {
      strokeRef.current = null;
      lastPointRef.current = null;
      return;
    }
    const patch = buildStrokePatch(strokeRef.current);
    setHistory((h) => pushStroke(h, patch));
    setDirty(true);
    strokeRef.current = null;
    lastPointRef.current = null;
  }, []);

  // ── Mouse events on canvas ─────────────────────────────────────────────────
  const handleMouseDown = (x: number, y: number) => {
    if (!imageData) return;

    if (editorState.tool === 'eyedropper') {
      const c = getPixel(imageData, x, y);
      if (c && c[3] !== 0) {
        dispatch({ type: 'eyedrop', color: c });
      }
      return; // no stroke for eyedropper
    }

    startStroke();
    const next = editorState.tool === 'eraser' ? TRANSPARENT : editorState.color;
    writePixel(x, y, next);
    lastPointRef.current = { x, y };
  };

  const handleMouseMove = (x: number, y: number, isDown: boolean) => {
    if (!isDown || !imageData) return;
    if (editorState.tool === 'eyedropper') return;

    const last = lastPointRef.current;
    const next = editorState.tool === 'eraser' ? TRANSPARENT : editorState.color;
    if (last) {
      const points = bresenhamLine(last, { x, y });
      for (const p of points) writePixel(p.x, p.y, next);
    } else {
      writePixel(x, y, next);
    }
    lastPointRef.current = { x, y };
  };

  const handleMouseUp = () => finishStroke();

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const applyPatch = (
    patch: { pixels: { idx: number; prev: RGBA; next: RGBA }[] },
    direction: 'undo' | 'redo',
  ) => {
    if (!imageData || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    for (const change of patch.pixels) {
      const value = direction === 'undo' ? change.prev : change.next;
      const x = change.idx % imageData.width;
      const y = Math.floor(change.idx / imageData.width);
      setPixel(imageData, x, y, value);
      if (ctx) ctx.putImageData(new ImageData(new Uint8ClampedArray(value), 1, 1), x, y);
    }
    scheduleRedraw();
    setDirty(true);
  };

  const handleUndo = () => {
    const result = historyUndo(history);
    if (!result) return;
    setHistory(result.state);
    applyPatch(result.patch, 'undo');
    triggerFlash('undo');
  };
  const handleRedo = () => {
    const result = historyRedo(history);
    if (!result) return;
    setHistory(result.state);
    applyPatch(result.patch, 'redo');
    triggerFlash('redo');
  };

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if (meta && e.key.toLowerCase() === 'z' && e.shiftKey)  { e.preventDefault(); handleRedo(); return; }
      if (meta && e.key.toLowerCase() === 'y')                { e.preventDefault(); handleRedo(); return; }
      if (meta && e.key.toLowerCase() === 's')                { e.preventDefault(); handleSave(); return; }
      if (e.key === 'Escape') { e.preventDefault(); attemptCancel(); return; }
      if (e.key === '[' || e.key === ']') {
        e.preventDefault();
        const delta = e.key === '[' ? -1 : 1;
        dispatch({ type: 'set-zoom', zoom: editorState.zoom + delta });
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'p') dispatch({ type: 'set-tool', tool: 'pencil' });
      else if (k === 'e') dispatch({ type: 'set-tool', tool: 'eraser' });
      else if (k === 'i') dispatch({ type: 'set-tool', tool: 'eyedropper' });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, editorState, imageData]);

  // ── Save / Cancel ──────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!imageData) return;
    onSave(toDataURL(imageData));
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 1500);
  };
  const attemptCancel = () => {
    if (dirty) setShowConfirmCancel(true);
    else onCancel();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 font-mono text-[11px] text-[var(--text-3)]">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <div className="px-4 py-3 rounded-md border border-[rgba(255,80,80,0.3)] bg-[rgba(255,80,80,0.08)] text-[12px] text-[rgba(255,160,160,0.95)]">
          {t('errorLoad')}: {error}
        </div>
        <Button variant="ghost" onClick={onCancel}>{t('backToCompare')}</Button>
      </div>
    );
  }

  if (!imageData || !canvasRef.current) return null;

  const cellPx = editorState.zoom * 8; // 8px base × zoom
  const stageW = imageData.width * cellPx;
  const stageH = imageData.height * cellPx;
  const showGrid = editorState.zoom >= 8;

  const pickPoint = (e: Konva.KonvaEventObject<MouseEvent>): Point | null => {
    const stage = e.target.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const x = Math.floor(pos.x / cellPx);
    const y = Math.floor(pos.y / cellPx);
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) return null;
    return { x, y };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header strip — dirty + saved toast */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={attemptCancel} className="h-7 px-2 text-[11px]">
            ← {t('backToCompare')}
          </Button>
          {dirty && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--neon)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon)] shadow-[0_0_4px_var(--neon-glow)]" />
              {t('dirty')}
            </span>
          )}
          {showSavedToast && (
            <span className="font-mono text-[10px] text-[var(--neon)] bg-[var(--neon-dim)] border border-[var(--neon)] px-2 py-0.5 rounded animate-[pulse_1.5s_ease-out]">
              {t('saved')}
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-[var(--text-3)]">
          {imageData.width}×{imageData.height} · {history.undoStack.length}/{history.maxSize}
        </span>
      </div>

      <PixelToolbar
        tool={editorState.tool}
        onToolChange={(tool) => dispatch({ type: 'set-tool', tool })}
        zoom={editorState.zoom}
        onZoomChange={(zoom) => dispatch({ type: 'set-zoom', zoom })}
        canUndo={canUndo(history)}
        canRedo={canRedo(history)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        flashUndo={flashUndo}
        flashRedo={flashRedo}
      />

      <div className="flex-1 grid grid-cols-[200px_1fr_200px] min-h-0 overflow-hidden">
        {/* Palette */}
        <PalettePanel
          palette={palette}
          activeColor={editorState.color}
          onSelect={(color) => dispatch({ type: 'set-color', color })}
          onAddToPalette={(color) => setPalette((p) => addColor(p, color))}
          onRemove={(color) => setPalette((p) => removeColor(p, color))}
        />

        {/* Canvas */}
        <div
          ref={canvasScrollRef}
          className="relative overflow-auto bg-[var(--g0)] flex items-start justify-center p-6"
          style={{ cursor: panActive ? 'grabbing' : undefined }}
          onWheel={(e) => {
            // Cmd/Ctrl + scroll → zoom (multiplicative for fine-grained control)
            if (!(e.metaKey || e.ctrlKey)) return;
            e.preventDefault();
            // 5% per tick — small enough to feel smooth, large enough to be useful
            const factor = e.deltaY > 0 ? 1 / 1.05 : 1.05;
            dispatch({ type: 'set-zoom', zoom: editorState.zoom * factor });
          }}
          onMouseDown={(e) => {
            // Cmd/Ctrl + click → start pan (preempts Konva drawing)
            if (!(e.metaKey || e.ctrlKey)) return;
            const el = canvasScrollRef.current;
            if (!el) return;
            e.preventDefault();
            e.stopPropagation();
            setPanActive(true);
            panDragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              scrollLeft: el.scrollLeft,
              scrollTop: el.scrollTop,
            };
          }}
          onMouseMove={(e) => {
            const drag = panDragRef.current;
            const el = canvasScrollRef.current;
            if (!drag || !el) return;
            el.scrollLeft = drag.scrollLeft - (e.clientX - drag.startX);
            el.scrollTop = drag.scrollTop - (e.clientY - drag.startY);
          }}
          onMouseUp={() => { panDragRef.current = null; setPanActive(false); }}
          onMouseLeave={() => { panDragRef.current = null; setPanActive(false); }}
        >
          <CheckerboardBackground />
          {/* Konva interactions are suppressed while pan is active */}
          <div style={{ pointerEvents: panActive ? 'none' : 'auto' }}>
            <CanvasStage
              imageData={imageData}
              cellPx={cellPx}
              stageW={stageW}
              stageH={stageH}
              showGrid={showGrid}
              tool={editorState.tool}
              color={editorState.color}
              canvasSource={canvasRef.current}
              konvaImageRef={konvaImageRef}
              onPointerDown={(p) => handleMouseDown(p.x, p.y)}
              onPointerMove={(p, isDown) => handleMouseMove(p.x, p.y, isDown)}
              onPointerUp={handleMouseUp}
              pickPoint={pickPoint}
            />
          </div>
        </div>

        {/* Inspector */}
        <div className="border-l border-[var(--border)] bg-[var(--g0)] p-4 overflow-y-auto space-y-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            {t('inspector.title')}
          </h3>
          <Row label={t('inspector.size')} value={`${imageData.width}×${imageData.height}`} />
          <Row label={t('inspector.tool')} value={t(`tool.${editorState.tool}`)} />
          <Row label={t('inspector.zoom')} value={`${Number.isInteger(editorState.zoom) ? editorState.zoom : editorState.zoom.toFixed(2)}×`} />
          <Row label={t('inspector.history')} value={`${history.undoStack.length} / ${history.maxSize}`} />
          <div className="pt-3 border-t border-[var(--border)] space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
              {t('inspector.shortcuts')}
            </p>
            {[
              ['P / E / I', t('tool.pencil') + ' / ' + t('tool.eraser') + ' / ' + t('tool.eyedropper')],
              ['⌘Z / ⌘⇧Z', t('undo') + ' / ' + t('redo')],
              ['⌘S', t('save')],
              ['[ / ]', t('zoom') + ' -/+'],
              ['⌘ + scroll', t('zoom')],
              ['⌘ + drag', t('pan')],
              ['Esc', t('backToCompare')],
            ].map(([keys, label]) => (
              <div key={keys} className="flex justify-between gap-2 font-mono text-[10px] text-[var(--text-3)]">
                <span className="text-[var(--text-2)]">{keys}</span>
                <span className="text-right truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] shrink-0">
        <span className="font-mono text-[10px] text-[var(--text-3)]">
          {dirty ? t('footer.unsaved') : t('footer.clean')}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={attemptCancel}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleSave} disabled={!dirty}>
            {t('save')}
          </Button>
        </div>
      </div>

      {/* Cancel confirm */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-hi)] bg-[rgba(20,20,28,0.97)] backdrop-blur-[20px] p-5">
            <h3 className="text-[14px] font-semibold text-[var(--text)] mb-2">{t('confirm.title')}</h3>
            <p className="text-[12px] text-[var(--text-2)] mb-4">{t('confirm.body')}</p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowConfirmCancel(false)}>
                {t('confirm.keepEditing')}
              </Button>
              <Button
                variant="primary"
                className="bg-[rgba(255,80,80,0.85)] hover:bg-[rgba(255,100,100,0.95)] text-white"
                onClick={() => { setShowConfirmCancel(false); onCancel(); }}
              >
                {t('confirm.discard')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-3)]">
        {label}
      </span>
      <span className="font-mono text-[12px] text-[var(--text-2)] truncate">{value}</span>
    </div>
  );
}

function CheckerboardBackground() {
  const style: CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '12px 12px',
    backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
  };
  return <div className="absolute inset-0 pointer-events-none" style={style} />;
}

function CanvasStage({
  imageData,
  cellPx,
  stageW,
  stageH,
  showGrid,
  tool,
  color,
  canvasSource,
  konvaImageRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  pickPoint,
}: {
  imageData: ImageData;
  cellPx: number;
  stageW: number;
  stageH: number;
  showGrid: boolean;
  tool: Tool;
  color: RGBA;
  canvasSource: HTMLCanvasElement;
  konvaImageRef: React.MutableRefObject<Konva.Image | null>;
  onPointerDown: (p: Point) => void;
  onPointerMove: (p: Point, isDown: boolean) => void;
  onPointerUp: () => void;
  pickPoint: (e: Konva.KonvaEventObject<MouseEvent>) => Point | null;
}) {
  const [hover, setHover] = useState<Point | null>(null);
  const [isDown, setIsDown] = useState(false);

  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (showGrid) {
    for (let x = 0; x <= imageData.width; x++) {
      gridLines.push({ x1: x * cellPx, y1: 0, x2: x * cellPx, y2: stageH });
    }
    for (let y = 0; y <= imageData.height; y++) {
      gridLines.push({ x1: 0, y1: y * cellPx, x2: stageW, y2: y * cellPx });
    }
  }

  return (
    <div className="relative" style={{ width: stageW, height: stageH }}>
      <Stage
        width={stageW}
        height={stageH}
        onMouseDown={(e) => {
          const p = pickPoint(e);
          if (p) { setIsDown(true); onPointerDown(p); }
        }}
        onMouseMove={(e) => {
          const p = pickPoint(e);
          setHover(p);
          if (p) onPointerMove(p, isDown);
        }}
        onMouseUp={() => { setIsDown(false); onPointerUp(); }}
        onMouseLeave={() => { setHover(null); if (isDown) { setIsDown(false); onPointerUp(); } }}
        style={{ cursor: tool === 'eyedropper' ? 'crosshair' : 'default' }}
      >
        <Layer imageSmoothingEnabled={false}>
          <KImage
            ref={konvaImageRef}
            image={canvasSource}
            width={stageW}
            height={stageH}
            listening={false}
          />
        </Layer>

        {showGrid && (
          <Layer listening={false}>
            {gridLines.map((g, i) => (
              <Line
                key={i}
                points={[g.x1, g.y1, g.x2, g.y2]}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}
          </Layer>
        )}

        {/* Cursor highlight */}
        {hover && (
          <Layer listening={false}>
            <Rect
              x={hover.x * cellPx}
              y={hover.y * cellPx}
              width={cellPx}
              height={cellPx}
              stroke="#00E5A0"
              strokeWidth={2}
              shadowColor="#00E5A0"
              shadowBlur={8}
              shadowOpacity={0.7}
            />
          </Layer>
        )}
      </Stage>

      {/* Cursor swatch (offset bottom-right of cursor cell) */}
      {hover && tool !== 'eyedropper' && (
        <div
          className="absolute pointer-events-none border border-[var(--border-hi)] rounded-sm"
          style={{
            width: 12, height: 12,
            left: hover.x * cellPx + cellPx + 4,
            top: hover.y * cellPx + cellPx + 4,
            backgroundColor: tool === 'eraser'
              ? 'transparent'
              : `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`,
            backgroundImage: tool === 'eraser'
              ? 'linear-gradient(45deg, transparent 45%, rgba(255,80,80,0.8) 45%, rgba(255,80,80,0.8) 55%, transparent 55%)'
              : undefined,
          }}
        />
      )}
    </div>
  );
}
