'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms, default 3500
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5 8l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M6 6l4 4M10 6l-4 4" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
      <path d="M8 2L14.5 13H1.5L8 2z" strokeLinejoin="round" />
      <path d="M8 6v3M8 11v.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
    </svg>
  ),
};

const COLORS: Record<ToastType, string> = {
  success: 'text-[var(--neon)] border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.06)]',
  error: 'text-red-400 border-red-500/20 bg-red-500/[0.06]',
  warning: 'text-amber-400 border-amber-500/20 bg-amber-500/[0.06]',
  info: 'text-[var(--text-2)] border-[var(--border-hi)] bg-[var(--g1)]',
};

function Toast({ id, message, type = 'info', duration = 3500, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl border',
        'backdrop-blur-[20px] [backdrop-saturate:180%]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        'text-[13px] font-medium min-w-[220px] max-w-[360px]',
        'animate-in slide-in-from-bottom-2 fade-in duration-200',
        COLORS[type],
      )}
      style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {ICONS[type]}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="ml-1 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
          <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export { Toast };
