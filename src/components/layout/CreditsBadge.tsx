'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useCredits } from '@/lib/credits/CreditsContext';

interface CreditsBadgeProps {
  locale: string;
  /** Threshold below which we show a warning tint. Default 100. */
  lowThreshold?: number;
}

/**
 * Always-visible credits widget, sits above UserDropdown in the sidebar.
 * Reads live credits from CreditsContext — updates immediately when any
 * call to `charge()` runs (e.g. AI pixelation request).
 *
 * Real-time updates: when backend lands, wire SSE or polling at the
 * provider level (every 30s on focus, or subscribe to credit ledger).
 */
export function CreditsBadge({ locale, lowThreshold = 100 }: CreditsBadgeProps) {
  const t = useTranslations('workspace');
  const { credits } = useCredits();
  const isLow = credits < lowThreshold;

  // Briefly flash on credit change (charge / refund) so users notice.
  const [flash, setFlash] = useState<'none' | 'down' | 'up'>('none');
  const [prev, setPrev] = useState(credits);
  useEffect(() => {
    if (credits !== prev) {
      setFlash(credits < prev ? 'down' : 'up');
      setPrev(credits);
      const t = setTimeout(() => setFlash('none'), 600);
      return () => clearTimeout(t);
    }
  }, [credits, prev]);

  return (
    <Link
      href={`/${locale}/credits`}
      className={cn(
        'mx-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg',
        'border transition-all duration-[120ms]',
        isLow
          ? 'border-[rgba(255,170,80,0.3)] bg-[rgba(255,170,80,0.06)] hover:bg-[rgba(255,170,80,0.10)]'
          : 'border-[var(--border)] bg-[var(--g1)] hover:border-[rgba(0,229,160,0.25)] hover:bg-[var(--g2)]',
      )}
      title={t('creditsTooltip')}
    >
      <span className={cn(
        'shrink-0 w-4 h-4 flex items-center justify-center',
        isLow ? 'text-[rgba(255,180,90,0.95)]' : 'text-[var(--neon)]',
      )}>
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1.5l1.8 4.7 5 .4-3.8 3.3 1.2 4.9L8 12.2 3.8 14.8l1.2-4.9L1.2 6.6l5-.4L8 1.5z" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <div className={cn(
          'font-mono text-[13px] font-semibold leading-none transition-colors duration-[300ms]',
          isLow ? 'text-[rgba(255,200,120,0.95)]' : 'text-[var(--neon)]',
          flash === 'down' && 'text-[rgba(255,120,120,1)] [text-shadow:0_0_8px_rgba(255,120,120,0.7)]',
          flash === 'up'   && 'text-[var(--neon)] [text-shadow:0_0_8px_var(--neon-glow)]',
        )}>
          {credits.toLocaleString()}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-3)] mt-0.5">
          {t('creditsLabel')}
        </div>
      </div>
      <span className="shrink-0 text-[var(--text-3)] opacity-60 group-hover:opacity-100">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
          <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
