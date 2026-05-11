import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';

export default async function NotFound() {
  const t = await getTranslations('errors');
  const locale = await getLocale();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <p className="font-mono text-[12px] text-[var(--text-3)] uppercase tracking-[0.08em]">
            404
          </p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('pageNotFoundTitle')}
          </h1>
          <p className="text-[13px] text-[var(--text-2)]">{t('pageNotFoundBody')}</p>
        </div>

        <GlassPanel level="raised" className="p-6">
          <Link href={`/${locale}`}>
            <Button variant="primary" size="md" className="w-full">
              {t('goHome')}
            </Button>
          </Link>
        </GlassPanel>
      </div>
    </div>
  );
}
