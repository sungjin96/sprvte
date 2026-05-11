'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
    });

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('not found')
          ? t('errors.userNotFound')
          : t('errors.generic'),
      );
      setLoading(false);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-10 h-10">
              <Image src="/assets/mascot-icon.svg" alt="Sprvte" width={40} height={40} priority />
            </div>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('sent')}
          </h1>
        </div>

        <GlassPanel level="raised" className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neon-dim)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="1.5" className="w-6 h-6">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--text-2)]">{t('sentBody')}</p>
          <p className="font-mono text-[12px] text-[var(--neon)]">{email}</p>
        </GlassPanel>

        <p className="text-center text-[13px] text-[var(--text-3)]">
          <Link href={`/${locale}/auth/login`} className="text-[var(--neon)] hover:brightness-110 transition-all">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo + title */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-[72px] h-[72px]">
            <Image src="/assets/mascot-icon.svg" alt="Sprvte" width={72} height={72} priority />
          </div>
        </div>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('title')}
          </h1>
          <p className="text-[13px] text-[var(--text-2)] mt-1">{t('subtitle')}</p>
        </div>
      </div>

      <GlassPanel level="raised" className="p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('email')} htmlFor="email" error={error || undefined}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              hasError={!!error}
            />
          </FormField>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading}
          >
            {loading ? <LoadingDots /> : t('submit')}
          </Button>
        </form>
      </GlassPanel>

      <p className="text-center text-[13px] text-[var(--text-3)]">
        <Link
          href={`/${locale}/auth/login`}
          className="text-[var(--neon)] hover:brightness-110 transition-all"
        >
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}

function LoadingDots() {
  return (
    <span className="flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[4px] h-[4px] rounded-full bg-current animate-pulse"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
