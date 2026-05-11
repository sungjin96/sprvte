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

export default function SignupPage() {
  const t = useTranslations('auth.signup');
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!terms) {
      setError(t('errors.termsRequired'));
      return;
    }
    if (password.length < 8) {
      setError(t('errors.weakPassword'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });

    if (authError) {
      setError(
        authError.message.toLowerCase().includes('already')
          ? t('errors.emailInUse')
          : t('errors.generic'),
      );
      setLoading(false);
      return;
    }

    setDone(true);
  }

  async function handleOAuth(provider: 'google' | 'github') {
    if (!terms) {
      setError(t('errors.termsRequired'));
      return;
    }
    setOauthLoading(provider);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/${locale}/auth/callback`,
      },
    });
    if (authError) {
      setError(t('errors.generic'));
      setOauthLoading(null);
    }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-[72px] h-[72px]">
              <Image src="/assets/mascot-icon.svg" alt="Sprvte" width={72} height={72} priority />
            </div>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('checkEmail')}
          </h1>
        </div>

        <GlassPanel level="raised" className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neon-dim)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="1.5" className="w-6 h-6">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--text-2)]">{t('checkEmailBody')}</p>
          <p className="font-mono text-[12px] text-[var(--neon)]">{email}</p>
        </GlassPanel>

        <p className="text-center text-[13px] text-[var(--text-3)]">
          {t('haveAccount')}{' '}
          <Link href={`/${locale}/auth/login`} className="text-[var(--neon)] hover:brightness-110 transition-all">
            {t('loginLink')}
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
        {/* OAuth buttons */}
        <div className="space-y-2">
          <OAuthButton
            icon={<GoogleIcon />}
            label={t('google')}
            loading={oauthLoading === 'google'}
            disabled={!!oauthLoading || loading}
            onClick={() => handleOAuth('google')}
          />
          <OAuthButton
            icon={<GitHubIcon />}
            label={t('github')}
            loading={oauthLoading === 'github'}
            disabled={!!oauthLoading || loading}
            onClick={() => handleOAuth('github')}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-[0.08em]">
            {t('orContinueWith')}
          </span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t('email')} htmlFor="email">
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

          <FormField
            label={t('password')}
            htmlFor="password"
            hint={t('passwordHint')}
            error={error || undefined}
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              hasError={!!error}
            />
          </FormField>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-[1px] shrink-0">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-[3px] border transition-all duration-[120ms] flex items-center justify-center ${
                  terms
                    ? 'bg-[var(--neon)] border-[var(--neon)]'
                    : 'bg-[rgba(255,255,255,0.04)] border-[var(--border-hi)] group-hover:border-[rgba(0,229,160,0.3)]'
                }`}
              >
                {terms && (
                  <svg viewBox="0 0 10 8" fill="none" stroke="black" strokeWidth="1.8" className="w-[9px] h-[7px]">
                    <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[12px] text-[var(--text-2)] leading-[1.5]">{t('terms')}</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading || !!oauthLoading}
          >
            {loading ? <LoadingDots /> : t('submit')}
          </Button>
        </form>
      </GlassPanel>

      {/* Login link */}
      <p className="text-center text-[13px] text-[var(--text-3)]">
        {t('haveAccount')}{' '}
        <Link
          href={`/${locale}/auth/login`}
          className="text-[var(--neon)] hover:brightness-110 transition-all"
        >
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}

/* ---------- helpers ---------- */

function OAuthButton({
  icon,
  label,
  loading,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-[10px] px-4 py-[9px] rounded-sm border border-[var(--border-hi)] bg-[var(--g2)] text-[13px] font-medium text-[var(--text)] transition-all duration-[120ms] hover:bg-[var(--g3)] hover:border-[rgba(255,255,255,0.2)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
    >
      {loading ? <LoadingDots /> : <>{icon}{label}</>}
    </button>
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

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  );
}
