'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContextMenuItem {
  /** 'separator' to render a divider; otherwise menu item. */
  kind?: 'item' | 'separator';
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  /** Visually mark as destructive (red). */
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

interface ContextMenuProps {
  /** Screen-space coords (clientX/Y). null = hidden. */
  position: { x: number; y: number } | null;
  items: ContextMenuItem[];
  onClose: () => void;
}

/**
 * Custom context menu rendered at the given screen position.
 * Closes on outside click, Escape, or any item click.
 * Auto-flips when near viewport edges.
 */
export function ContextMenu({ position, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // Defer to next tick so the click that opened the menu doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onOutside);
      document.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [position, onClose]);

  if (!position) return null;

  // Auto-flip near viewport edges (rough estimate; menu is ~200×N px)
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const estW = 220;
  const estH = items.length * 32 + 12;
  const left = position.x + estW > vw ? Math.max(8, vw - estW - 8) : position.x;
  const top = position.y + estH > vh ? Math.max(8, vh - estH - 8) : position.y;

  return (
    <div
      ref={ref}
      className="fixed z-[100] min-w-[200px] py-1 rounded-[10px] border border-[var(--border-hi)] bg-[rgba(12,12,18,0.97)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, idx) => {
        if (item.kind === 'separator') {
          return <div key={`sep-${idx}`} className="my-1 h-px bg-[var(--border)] mx-2" />;
        }
        return (
          <button
            key={idx}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] text-left',
              'transition-colors duration-[100ms]',
              item.disabled
                ? 'text-[var(--text-3)] opacity-50 cursor-not-allowed'
                : item.danger
                  ? 'text-[rgba(255,100,100,0.9)] hover:text-[rgba(255,120,120,1)] hover:bg-[rgba(255,60,60,0.08)]'
                  : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--g1)]',
            )}
          >
            {item.icon && <span className="w-3.5 h-3.5 shrink-0 opacity-70">{item.icon}</span>}
            {!item.icon && <span className="w-3.5 h-3.5 shrink-0" />}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="font-mono text-[10px] text-[var(--text-3)] opacity-70">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
