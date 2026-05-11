'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function Dialog({ open, onClose, title, children, className, size = 'md' }: DialogProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full rounded-xl flex flex-col',
          'max-h-[calc(100vh-2rem)]',
          'bg-[rgba(255,255,255,0.06)] border border-[var(--border-hi)]',
          'backdrop-blur-[20px] [backdrop-saturate:180%]',
          'shadow-[0_24px_64px_rgba(0,0,0,0.6)]',
          size === 'sm' && 'max-w-sm',
          size === 'md' && 'max-w-lg',
          size === 'lg' && 'max-w-2xl',
          className,
        )}
        style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
      >
        {/* Header */}
        {title && (
          <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-4 border-b border-[var(--border)]">
            <h2 className="text-[15px] font-semibold text-[var(--text)]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-all"
            >
              <svg viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M1 1l13 13M14 1L1 14" />
              </svg>
            </button>
          </div>
        )}
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export { Dialog };
