'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Orientation = 'horizontal' | 'vertical';

interface ResizableSplitProps {
  children: [ReactNode, ReactNode];
  orientation?: Orientation;
  /** Initial size in px of the first pane (width if horizontal, height if vertical). */
  initialFirstSize?: number;
  minFirst?: number;
  maxFirst?: number;
  storageKey?: string;
  className?: string;

  /** @deprecated use initialFirstSize. Kept for backward compat. */
  initialLeftWidth?: number;
  /** @deprecated use minFirst. */
  minLeft?: number;
  /** @deprecated use maxFirst. */
  maxLeft?: number;
}

/**
 * Two-pane layout with a draggable divider.
 * Horizontal = left/right split. Vertical = top/bottom split.
 * Persists size to localStorage when storageKey is provided.
 */
export function ResizableSplit({
  children,
  orientation = 'horizontal',
  initialFirstSize,
  minFirst,
  maxFirst,
  initialLeftWidth,
  minLeft,
  maxLeft,
  storageKey,
  className,
}: ResizableSplitProps) {
  const initial = initialFirstSize ?? initialLeftWidth ?? 320;
  const min = minFirst ?? minLeft ?? 120;
  const max = maxFirst ?? maxLeft ?? 800;

  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Restore from storage
  useEffect(() => {
    if (!storageKey) return;
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    if (stored) {
      const n = parseInt(stored, 10);
      if (!Number.isNaN(n) && n >= min && n <= max) setSize(n);
    }
  }, [storageKey, min, max]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, String(size));
  }, [size, storageKey]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const next = orientation === 'horizontal'
        ? Math.max(min, Math.min(max, e.clientX - rect.left))
        : Math.max(min, Math.min(max, e.clientY - rect.top));
      setSize(next);
    };
    const onUp = () => setDragging(false);
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, min, max, orientation]);

  const isH = orientation === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={cn(isH ? 'flex flex-1 overflow-hidden' : 'flex flex-col flex-1 overflow-hidden', className)}
    >
      <div
        style={isH ? { width: size } : { height: size }}
        className={cn(
          'shrink-0 flex flex-col overflow-hidden',
          !isH && 'min-h-0',
        )}
      >
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        role="separator"
        aria-orientation={isH ? 'vertical' : 'horizontal'}
        onMouseDown={(e) => { e.preventDefault(); setDragging(true); }}
        className={cn(
          'group relative shrink-0',
          isH ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
          'bg-[var(--border)]',
          'hover:bg-[var(--neon)] hover:shadow-[0_0_8px_var(--neon-glow)]',
          dragging && 'bg-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]',
        )}
        title={isH ? '드래그하여 너비 조절' : '드래그하여 높이 조절'}
      >
        {/* Wider hit area */}
        <div className={cn('absolute', isH ? 'inset-y-0 -left-1 -right-1' : 'inset-x-0 -top-1 -bottom-1')} />
        {/* Visual handle */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--neon)] opacity-0',
            isH ? 'w-[3px] h-8' : 'h-[3px] w-8',
            'group-hover:opacity-100 transition-opacity duration-[120ms]',
            dragging && 'opacity-100',
          )}
        />
      </div>

      <div className={cn('flex-1 flex flex-col overflow-hidden', !isH && 'min-h-0')}>
        {children[1]}
      </div>
    </div>
  );
}
