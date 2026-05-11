'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

interface ModeUpgradeBannerProps {
  onUpgrade?: () => void;
  loading?: boolean;
}

function ModeUpgradeBanner({ onUpgrade, loading }: ModeUpgradeBannerProps) {
  const t = useTranslations('guide.upgrade');
  return (
    <div className="relative overflow-hidden rounded-xl border border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.04)] p-4">
      {/* Glow decoration */}
      <div
        className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)' }}
      />

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="shrink-0 w-9 h-9 rounded-lg bg-[var(--neon-dim)] border border-[rgba(0,229,160,0.2)] flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" stroke="var(--neon)" strokeWidth="1.5" className="w-5 h-5">
            <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.5L10 14.5 5.1 17.2l.9-5.5L2 7.8l5.5-.8L10 2z" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-[var(--neon)]">{t('title')}</h3>
          <p className="text-[12px] text-[var(--text-2)] mt-1 leading-snug">
            {t('body')}
          </p>
          <ul className="mt-2 space-y-0.5">
            {[t('feature1'), t('feature2'), t('feature3')].map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-[11px] text-[var(--text-2)]">
                <svg viewBox="0 0 12 12" fill="none" stroke="var(--neon)" strokeWidth="1.5" className="w-3 h-3 shrink-0">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={onUpgrade}
          disabled={loading}
          className="shrink-0 self-center"
        >
          {loading ? t('ctaLoading') : t('cta')}
        </Button>
      </div>
    </div>
  );
}

export { ModeUpgradeBanner };
