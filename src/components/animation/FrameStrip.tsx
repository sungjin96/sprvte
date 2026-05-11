'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu';
import type { AnimationSettings } from '@/types/asset';

interface FrameStripProps {
  settings: AnimationSettings;
  sheetUrl: string;
  /** Natural sheet pixel size. Used to compute object-position offsets. */
  sheetWidth: number;
  sheetHeight: number;
  selectedIndex: number | null;
  /** Currently-rendered frame during playback (null when paused). Renders a softer highlight. */
  playingIndex?: number | null;
  onSelect: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onAdd: (afterIndex?: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  /** Localized labels (passed from page via next-intl t()). */
  labels: {
    addFrame: string;
    duplicate: string;
    delete: string;
  };
}

const THUMB_SIZE = 64; // px

/**
 * Horizontal strip of frame thumbnails. Each thumbnail is a `<div>` with the
 * sprite sheet as background, positioned via CSS to show one grid cell.
 * This way the browser decodes the sheet ONCE and reuses it for all frames.
 *
 * DnD: HTML5 native drag (desktop only — mobile deferred to v6 with @dnd-kit).
 */
export function FrameStrip({
  settings,
  sheetUrl,
  sheetWidth,
  sheetHeight,
  selectedIndex,
  playingIndex,
  onSelect,
  onReorder,
  onAdd,
  onDuplicate,
  onDelete,
  labels,
}: FrameStripProps) {
  const { gridCols, gridRows, frameOrder } = settings;
  const cellW = sheetWidth > 0 ? sheetWidth / gridCols : 0;
  const cellH = sheetHeight > 0 ? sheetHeight / gridRows : 0;
  const scale = cellW > 0 ? Math.min(THUMB_SIZE / cellW, THUMB_SIZE / cellH) : 1;

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; index: number } | null>(null);

  const menuItems: ContextMenuItem[] = menu
    ? [
        { label: labels.duplicate, shortcut: '⌘D', onClick: () => onDuplicate(menu.index) },
        { kind: 'separator' },
        {
          label: labels.delete,
          shortcut: '⌫',
          danger: true,
          disabled: settings.frameCount <= 1,
          onClick: () => onDelete(menu.index),
        },
      ]
    : [];

  return (
    <div className="flex items-center gap-2 p-3 overflow-x-auto overflow-y-hidden">
      {frameOrder.map((gridIdx, displayIdx) => {
        const col = gridIdx % gridCols;
        const row = Math.floor(gridIdx / gridCols);
        const isSelected = selectedIndex === displayIdx;
        const isPlaying = playingIndex === displayIdx;
        const isDropTarget = dropIndex === displayIdx;

        return (
          <div
            key={`${displayIdx}-${gridIdx}`}
            className="relative shrink-0 flex flex-col items-center gap-1"
          >
            {/* Drop indicator (left side) */}
            {isDropTarget && dragIndex !== null && dragIndex !== displayIdx && (
              <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)] pointer-events-none" />
            )}
            <button
              type="button"
              draggable
              onDragStart={(e) => {
                setDragIndex(displayIdx);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setDropIndex(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDropIndex(displayIdx);
              }}
              onDragLeave={() => {
                setDropIndex((curr) => (curr === displayIdx ? null : curr));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== displayIdx) {
                  onReorder(dragIndex, displayIdx);
                }
                setDragIndex(null);
                setDropIndex(null);
              }}
              onClick={() => onSelect(displayIdx)}
              onContextMenu={(e) => {
                e.preventDefault();
                onSelect(displayIdx);
                setMenu({ x: e.clientX, y: e.clientY, index: displayIdx });
              }}
              className={cn(
                'group relative overflow-hidden rounded-md border transition-all duration-[80ms]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)]',
                isSelected
                  ? 'border-[var(--neon)] shadow-[0_0_0_1px_var(--neon),0_0_12px_var(--neon-glow)]'
                  : isPlaying
                    ? 'border-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hi)]',
                dragIndex === displayIdx && 'opacity-40',
              )}
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                backgroundImage: sheetUrl ? `url("${sheetUrl}")` : undefined,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: `-${col * cellW * scale}px -${row * cellH * scale}px`,
                backgroundSize: `${sheetWidth * scale}px ${sheetHeight * scale}px`,
                imageRendering: 'pixelated',
              }}
              aria-label={`Frame ${displayIdx + 1}`}
            >
              <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/70 bg-black/50 px-1 rounded">
                {displayIdx + 1}
              </span>
            </button>
          </div>
        );
      })}

      {/* Add frame button */}
      <button
        type="button"
        onClick={() => onAdd()}
        disabled={settings.frameCount >= 64}
        title={labels.addFrame}
        className={cn(
          'shrink-0 flex items-center justify-center rounded-md border border-dashed transition-colors',
          'border-[var(--border)] text-[var(--text-3)] hover:border-[var(--neon)] hover:text-[var(--neon)]',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] disabled:hover:text-[var(--text-3)]',
        )}
        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
        aria-label={labels.addFrame}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M8 3v10M3 8h10" strokeLinecap="round" />
        </svg>
      </button>

      <ContextMenu
        position={menu ? { x: menu.x, y: menu.y } : null}
        items={menuItems}
        onClose={() => setMenu(null)}
      />
    </div>
  );
}
