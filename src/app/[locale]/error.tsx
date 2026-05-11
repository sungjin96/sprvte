'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const locale = useLocale();

  useEffect(() => {
    // 후속: 모니터링 SaaS(Sentry 등) 도입 시 여기서 reportError
    console.error('[app error]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('pageErrorTitle')}
          </h1>
          <p className="text-[13px] text-[var(--text-2)]">{t('pageErrorBody')}</p>
        </div>

        <GlassPanel level="raised" className="p-6 space-y-4">
          {error.digest && (
            <p className="font-mono text-[11px] text-[var(--text-3)] break-all">
              id: {error.digest}
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="primary" size="md" className="flex-1" onClick={reset}>
              {t('retry')}
            </Button>
            <Link href={`/${locale}`} className="flex-1">
              <Button variant="ghost" size="md" className="w-full">
                {t('goHome')}
              </Button>
            </Link>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
