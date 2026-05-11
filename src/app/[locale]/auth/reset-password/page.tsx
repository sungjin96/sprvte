'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const locale = useLocale();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Supabase가 PASSWORD_RECOVERY 이벤트로 임시 세션을 부여한 상태로 도착함.
  // 이벤트 listener를 등록해 "복구 세션"임을 확인 + URL 토큰 자동 처리 트리거.
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setRecoveryReady(true);
      }
    });
    // 페이지 직접 진입(링크 외) 시: 현재 세션이 있으면 그대로 변경 허용
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setRecoveryReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('errors.weakPassword'));
      return;
    }
    if (password !== confirm) {
      setError(t('errors.mismatch'));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError(t('errors.generic'));
      setLoading(false);
      return;
    }

    // 새 비밀번호로 강제 재로그인하도록 임시 세션 종료
    await supabase.auth.signOut();
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-[72px] h-[72px]">
              <Image src="/assets/mascot-icon.svg" alt="Spryte" width={72} height={72} priority />
            </div>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text)]">
            {t('updated')}
          </h1>
        </div>

        <GlassPanel level="raised" className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--neon-dim)] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--neon)" strokeWidth="1.5" className="w-6 h-6">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--text-2)]">{t('updatedBody')}</p>
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

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="w-[72px] h-[72px]">
            <Image src="/assets/mascot-icon.svg" alt="Spryte" width={72} height={72} priority />
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
          <FormField label={t('newPassword')} htmlFor="password" hint={t('passwordHint')}>
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

          <FormField
            label={t('confirmPassword')}
            htmlFor="confirm"
            error={error || undefined}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              hasError={!!error}
            />
          </FormField>

          {!recoveryReady && (
            <p className="text-[12px] text-[var(--text-3)]">{t('errors.invalidLink')}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading || !recoveryReady}
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
