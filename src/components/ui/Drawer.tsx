'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Width of the drawer panel. Default 420px. */
  width?: string;
}

const ANIM_MS = 280;

/**
 * Right-anchored drawer with slide-in animation.
 *
 * Why animation matters: a drawer that snaps into existence reads as a
 * right-aligned modal. The slide-from-right transition is what makes it
 * feel attached to the viewport edge — like a Finder inspector or VS
 * Code's right panel.
 *
 * Mount lifecycle:
 *   open=true   → mount immediately, next frame flip data-state="open"
 *                 (translate-x from 100% to 0)
 *   open=false  → flip data-state="closed", unmount after ANIM_MS
 *                 (translate-x from 0 back to 100%)
 *
 * The deferred unmount lets the close animation play before the DOM
 * disappears.
 */
function Drawer({ open, onClose, title, children, width = '420px' }: DrawerProps) {
  // Render the portal as long as we're transitioning OR open.
  const [shouldRender, setShouldRender] = useState(open);
  // data-state controls the transition. Lags shouldRender by one paint
  // so the open transition has a starting frame to interpolate from.
  const [dataState, setDataState] = useState<'open' | 'closed'>(open ? 'open' : 'closed');

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Two RAFs guarantees a paint with closed state before flipping to open
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setDataState('open'));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setDataState('closed');
      const t = setTimeout(() => setShouldRender(false), ANIM_MS);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Esc key
  useEffect(() => {
    if (!shouldRender) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shouldRender, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!shouldRender) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex pointer-events-none" aria-hidden={dataState === 'closed'}>
      {/* Backdrop — fade only */}
      <div
        className={cn(
          'flex-1 bg-black/55 backdrop-blur-sm pointer-events-auto',
          'transition-opacity ease-out',
          dataState === 'open' ? 'opacity-100' : 'opacity-0',
        )}
        style={{ transitionDuration: `${ANIM_MS}ms` }}
        onClick={onClose}
      />

      {/* Panel — slides in from right */}
      <div
        className={cn(
          'relative flex flex-col h-full pointer-events-auto',
          'bg-[rgba(10,10,10,0.95)]',
          'backdrop-blur-[20px] [backdrop-saturate:180%]',
          // Left edge: 1px mint accent + heavy ambient shadow toward content
          'border-l border-[var(--neon-dim)]',
          'shadow-[-24px_0_48px_rgba(0,0,0,0.55)]',
          'transition-transform ease-out',
          'will-change-transform',
        )}
        style={{
          width,
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          transitionDuration: `${ANIM_MS}ms`,
          transform: dataState === 'open' ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag-style indicator on the left edge — visual cue this is a panel, not a modal */}
        <div className="pointer-events-none absolute -left-px top-1/2 -translate-y-1/2 w-[3px] h-12 rounded-full bg-[var(--neon)] opacity-60 shadow-[0_0_8px_var(--neon-glow)]" />

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          {title && <h2 className="text-[14px] font-semibold text-[var(--text)]">{title}</h2>}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-all"
          >
            <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M1 1l13 13M14 1L1 14" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export { Drawer };
