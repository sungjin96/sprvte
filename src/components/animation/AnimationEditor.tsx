'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ResizableSplit } from '@/components/layout/ResizableSplit';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { AnimationSettings, AnimationLoopMode } from '@/types/asset';
import {
  addFrame,
  duplicateFrame,
  removeFrame,
  reorderFrame,
  setFps,
  setFrameDuration,
} from '@/lib/animation/operations';
import { FrameStrip } from './FrameStrip';
import { FrameInspector } from './FrameInspector';

interface AnimationEditorProps {
  sheetUrl: string;
  initialSettings: AnimationSettings;
  /** Called whenever settings change (debounced commit is the caller's job). */
  onChange?: (next: AnimationSettings) => void;
}

/**
 * Sprite-sheet animation editor.
 *
 *   ┌────────────────────────────────┬──────────────┐
 *   │  Preview (canvas, plays anim)  │              │
 *   │ ──────── (vertical resizer) ── │  Inspector   │
 *   │  Frame strip (DnD reorder)     │              │
 *   └────────────────────────────────┴──────────────┘
 *
 * Sheet image is loaded ONCE; thumbnails reuse it via background-position
 * (no per-frame Canvas extraction = minimal memory).
 *
 * Playback uses requestAnimationFrame + per-frame durations (handles 'once',
 * 'loop', 'pingpong' modes; pauses when tab is hidden via rAF semantics).
 */
export function AnimationEditor({ sheetUrl, initialSettings, onChange }: AnimationEditorProps) {
  const t = useTranslations('animation.editor');
  const [settings, setSettings] = useState<AnimationSettings>(initialSettings);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [playing, setPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Sheet load state
  const [sheetSize, setSheetSize] = useState<{ w: number; h: number } | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Notify parent on changes (skip initial mount).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange?.(settings);
  }, [settings, onChange]);

  // Load sheet to get natural dimensions.
  useEffect(() => {
    setSheetSize(null);
    setLoadFailed(false);
    if (!sheetUrl) return;
    const img = new window.Image();
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      setSheetSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => { if (!cancelled) setLoadFailed(true); };
    img.src = sheetUrl;
    return () => { cancelled = true; };
  }, [sheetUrl]);

  // Clamp selection when frameCount shrinks.
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= settings.frameCount) {
      setSelectedIndex(Math.max(0, settings.frameCount - 1));
    }
  }, [settings.frameCount, selectedIndex]);

  // Playback loop (requestAnimationFrame, per-frame duration aware).
  const directionRef = useRef<1 | -1>(1);
  const lastTickRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  useEffect(() => {
    if (!playing || settings.frameCount <= 1) return;
    let raf = 0;
    lastTickRef.current = performance.now();
    accRef.current = 0;

    const tick = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      accRef.current += dt;

      setCurrentFrame((curr) => {
        let next = curr;
        let acc = accRef.current;
        // Advance through possibly multiple frames if dt is large.
        while (acc >= settings.frameDurations[next]) {
          acc -= settings.frameDurations[next];
          if (settings.loop === 'pingpong') {
            next += directionRef.current;
            if (next >= settings.frameCount - 1) { next = settings.frameCount - 1; directionRef.current = -1; }
            else if (next <= 0) { next = 0; directionRef.current = 1; }
          } else if (settings.loop === 'once') {
            if (next >= settings.frameCount - 1) { acc = 0; setPlaying(false); break; }
            next += 1;
          } else {
            next = (next + 1) % settings.frameCount;
          }
        }
        accRef.current = acc;
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, settings.frameCount, settings.frameDurations, settings.loop]);

  // Operation callbacks
  const apply = useCallback((mut: (s: AnimationSettings) => AnimationSettings) => {
    setSettings((curr) => mut(curr));
  }, []);

  const handleAdd = useCallback((after?: number) => apply((s) => addFrame(s, after)), [apply]);
  const handleDuplicate = useCallback((i: number) => apply((s) => duplicateFrame(s, i)), [apply]);
  const handleDelete = useCallback((i: number) => apply((s) => removeFrame(s, i)), [apply]);
  const handleReorder = useCallback((from: number, to: number) => apply((s) => reorderFrame(s, from, to)), [apply]);
  const handleSetDuration = useCallback((i: number, d: number) => apply((s) => setFrameDuration(s, i, d)), [apply]);
  const handleSetFps = useCallback((f: number) => apply((s) => setFps(s, f)), [apply]);
  const handleSetLoop = useCallback((loop: AnimationLoopMode) => apply((s) => ({ ...s, loop })), [apply]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadFailed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[var(--text-3)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 opacity-50">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v6M12 17h.01" strokeLinecap="round" />
        </svg>
        <p className="text-[13px]">{t('loadFailed')}</p>
      </div>
    );
  }

  if (!sheetSize) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stripLabels = {
    addFrame: t('addFrame'),
    duplicate: t('duplicateFrame'),
    delete: t('deleteFrame'),
  };

  const inspectorLabels = {
    title: t('inspector'),
    noFrameSelected: t('noFrameSelected'),
    selectedFrame: t('selectedFrame'),
    of: t('of'),
    duration: t('duration'),
    durationMs: t('durationMs'),
    fps: t('fps'),
    loop: t('loop'),
    loopModes: {
      loop: t('loopModes.loop'),
      once: t('loopModes.once'),
      pingpong: t('loopModes.pingpong'),
    },
    deleteFrame: t('deleteFrame'),
    duplicateFrame: t('duplicateFrame'),
    regenerate: t('regenerate'),
    regenerateComingSoon: t('regenerateComingSoon'),
    minFrameCountReached: t('minFrameCountReached'),
  };

  return (
    <ResizableSplit
      orientation="horizontal"
      initialFirstSize={typeof window !== 'undefined' ? Math.floor(window.innerWidth * 0.7) : 800}
      minFirst={400}
      maxFirst={typeof window !== 'undefined' ? window.innerWidth - 280 : 1400}
      storageKey="anim-editor.split.h"
    >
      {/* Left: Preview (top) + Strip (bottom) */}
      <ResizableSplit
        orientation="vertical"
        initialFirstSize={420}
        minFirst={200}
        maxFirst={800}
        storageKey="anim-editor.split.v"
      >
        {/* Preview */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-3)]">
              {t('preview')}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setPlaying((p) => !p)}
                className="h-7 px-2"
                aria-label={playing ? t('pause') : t('play')}
              >
                {playing ? (
                  <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
                    <rect x="2" y="1" width="4" height="12" rx="1" />
                    <rect x="8" y="1" width="4" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
                    <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
                  </svg>
                )}
              </Button>
              <span className="font-mono text-[11px] text-[var(--text-3)]">
                {currentFrame + 1} / {settings.frameCount}
              </span>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center bg-[var(--g0)] relative overflow-hidden">
            {/* Checkerboard for transparency */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            />
            <PreviewCell
              sheetUrl={sheetUrl}
              sheetWidth={sheetSize.w}
              sheetHeight={sheetSize.h}
              settings={settings}
              currentFrame={currentFrame}
            />
          </div>
        </div>

        {/* Frame strip */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)]">
            <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-[var(--text-3)]">
              {t('frames')}
            </span>
            <span className="font-mono text-[11px] text-[var(--text-3)]">
              {settings.frameCount} {t('frameCount').toLowerCase()}
            </span>
          </div>
          <div className="flex-1 overflow-hidden bg-[var(--g0)]">
            <FrameStrip
              settings={settings}
              sheetUrl={sheetUrl}
              sheetWidth={sheetSize.w}
              sheetHeight={sheetSize.h}
              selectedIndex={selectedIndex}
              /** While playing, highlight the currently-rendered frame. Pause = honor user click. */
              playingIndex={playing ? currentFrame : null}
              onSelect={(i) => {
                setSelectedIndex(i);
                // Clicking a frame while playing: pause and jump to it
                if (playing) {
                  setPlaying(false);
                  setCurrentFrame(i);
                }
              }}
              onReorder={handleReorder}
              onAdd={handleAdd}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              labels={stripLabels}
            />
          </div>
        </div>
      </ResizableSplit>

      {/* Right: Inspector */}
      <FrameInspector
        settings={settings}
        selectedIndex={selectedIndex}
        onChangeFrameDuration={handleSetDuration}
        onChangeFps={handleSetFps}
        onChangeLoop={handleSetLoop}
        onDeleteFrame={handleDelete}
        onDuplicateFrame={handleDuplicate}
        labels={inspectorLabels}
      />
    </ResizableSplit>
  );
}

// ── Preview cell ───────────────────────────────────────────────────────────────
// Renders the currently-playing frame as a CSS-positioned region of the sheet.
// Same memory trick as FrameStrip: one `<img>` decode, multiple "views".
function PreviewCell({
  sheetUrl,
  sheetWidth,
  sheetHeight,
  settings,
  currentFrame,
}: {
  sheetUrl: string;
  sheetWidth: number;
  sheetHeight: number;
  settings: AnimationSettings;
  currentFrame: number;
}) {
  const { gridCols, gridRows, frameOrder } = settings;
  const cellW = sheetWidth / gridCols;
  const cellH = sheetHeight / gridRows;
  const safeIdx = Math.min(currentFrame, frameOrder.length - 1);
  const gridIdx = frameOrder[safeIdx] ?? 0;
  const col = gridIdx % gridCols;
  const row = Math.floor(gridIdx / gridCols);

  // Fit-contain into max viewport (clamped to natural cell size for crispness).
  const MAX = 360;
  const scale = Math.min(MAX / cellW, MAX / cellH, 4); // up to 4x for tiny sprites

  return (
    <div
      className={cn('relative shrink-0')}
      style={{
        width: cellW * scale,
        height: cellH * scale,
        backgroundImage: sheetUrl ? `url("${sheetUrl}")` : undefined,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${col * cellW * scale}px -${row * cellH * scale}px`,
        backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
