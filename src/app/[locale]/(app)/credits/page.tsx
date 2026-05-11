'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface CreditPack {
  key: string;
  credits: number;
  price: number;
  recommended?: boolean;
}

const PACKS: CreditPack[] = [
  { key: 'packStarter', credits: 200, price: 10 },
  { key: 'packCreator', credits: 600, price: 25, recommended: true },
  { key: 'packStudio',  credits: 3000, price: 100 },
];

interface UsageEntry {
  date: string;
  description: string;
  delta: number; // negative = used, positive = topped up
  balance: number;
}

const MOCK_USAGE: UsageEntry[] = [
  { date: '2026-04-28T14:23:00Z', description: 'Alice Walk — 스프라이트',  delta: -15, balance: 2450 },
  { date: '2026-04-28T13:01:00Z', description: 'Battle Theme — BGM',       delta: -6,  balance: 2465 },
  { date: '2026-04-28T11:45:00Z', description: 'Dark Forest — 배경',       delta: -8,  balance: 2471 },
  { date: '2026-04-27T19:33:00Z', description: 'Flame Sword Icon',         delta: -3,  balance: 2479 },
  { date: '2026-04-27T09:15:00Z', description: '크레딧 충전 (CREATOR)',    delta: 600, balance: 2482 },
  { date: '2026-04-26T22:01:00Z', description: 'Mage Zephyr — 캐릭터',    delta: -15, balance: 1882 },
];

const CURRENT_BALANCE = 2450;
const LOW_BALANCE_THRESHOLD = 100;
const AVG_COST_PER_ASSET = 8;

function formatNumber(n: number) {
  return n.toLocaleString('en-US');
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${hh}:${mm}`;
}

export default function CreditsPage() {
  const t = useTranslations('credits');
  const [autoCharge, setAutoCharge] = useState(false);

  const lowBalance = CURRENT_BALANCE < LOW_BALANCE_THRESHOLD;
  const estimatedAssets = Math.floor(CURRENT_BALANCE / AVG_COST_PER_ASSET);
  // Progress bar fills 0% at 0cr, 100% at 1000cr (rough cap)
  const balancePct = Math.min(100, (CURRENT_BALANCE / 1000) * 100);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
      </div>

      <div className="max-w-[960px] mx-auto px-6 py-8">
        {/* Low balance warning */}
        {lowBalance && (
          <div className="mb-5 rounded-[10px] border border-[rgba(255,200,80,0.25)] bg-[rgba(255,200,80,0.06)] px-4 py-3 flex items-start gap-3">
            <svg viewBox="0 0 20 20" fill="none" stroke="rgba(255,200,80,0.9)" strokeWidth="1.5" className="w-5 h-5 shrink-0 mt-[1px]">
              <path d="M10 1L1 18h18L10 1z" />
              <path d="M10 8v4M10 15v.01" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-[13px] font-medium text-[rgba(255,200,80,0.95)]">{t('lowBalanceTitle')}</p>
              <p className="text-[12px] text-[var(--text-2)] mt-0.5">{t('lowBalanceBody')}</p>
            </div>
          </div>
        )}

        {/* Hero balance panel */}
        <div
          className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-7 py-7 backdrop-blur-[20px] [backdrop-saturate:180%]"
          style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
            {t('balanceLabel')}
          </p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-[48px] font-bold tracking-[-0.02em] leading-none text-[var(--text)]">
              {formatNumber(CURRENT_BALANCE)}
            </span>
            <span className="text-[16px] font-mono text-[var(--text-3)] uppercase tracking-[0.08em]">
              cr
            </span>
          </div>
          <div className="h-[4px] rounded-full bg-[var(--g1)] overflow-hidden mb-2">
            <div
              className="h-full bg-[var(--neon)] transition-all duration-[300ms]"
              style={{ width: `${balancePct}%` }}
            />
          </div>
          <p className="text-[12px] text-[var(--text-2)]">
            {t('estimateUsage', { n: estimatedAssets })}
          </p>
        </div>

        {/* Packages */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
            {t('packagesTitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PACKS.map((pack) => {
              const perCredit = (pack.price / pack.credits).toFixed(3);
              return (
                <div
                  key={pack.key}
                  className={cn(
                    'rounded-[14px] border p-6 flex flex-col',
                    'transition-all duration-[180ms] relative',
                    pack.recommended
                      ? 'border-[rgba(0,229,160,0.2)] bg-[rgba(0,229,160,0.04)] hover:border-[rgba(0,229,160,0.4)]'
                      : 'border-[var(--border)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(0,229,160,0.25)] hover:bg-[rgba(255,255,255,0.06)]',
                  )}
                >
                  {pack.recommended && (
                    <span className="absolute top-3 right-3 px-2 py-[2px] rounded-full bg-[var(--neon-dim)] text-[var(--neon)] font-mono text-[10px] font-medium uppercase tracking-[0.04em] border border-[rgba(0,229,160,0.3)]">
                      ★ {t('packRecommended')}
                    </span>
                  )}
                  <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
                    {t(pack.key as 'packStarter' | 'packCreator' | 'packStudio')}
                  </p>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span className="text-[28px] font-semibold tracking-[-0.01em] text-[var(--text)]">
                      {formatNumber(pack.credits)}
                    </span>
                    <span className="text-[13px] font-mono text-[var(--text-3)]">cr</span>
                  </div>
                  <p className="text-[20px] font-semibold text-[var(--text)] mb-3">${pack.price}</p>
                  <p className="font-mono text-[11px] text-[var(--text-3)] mb-5">
                    {t('perCredit', { price: `$${perCredit}` })}
                  </p>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3.5 py-2 rounded-[8px] text-[13px] font-medium border transition-all duration-[120ms]',
                      pack.recommended
                        ? 'bg-[var(--neon)] text-black border-transparent shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 hover:shadow-[0_0_28px_var(--neon-glow)] font-semibold'
                        : 'bg-[var(--g1)] text-[var(--text-2)] border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)]',
                    )}
                  >
                    {t('buyButton')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Auto-charge */}
        <div className="mt-6 rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-[var(--text)] mb-1">{t('autoChargeTitle')}</p>
            <p className="text-[12px] text-[var(--text-3)]">
              {t('autoChargeBody', { threshold: 100, amount: 200 })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoCharge((a) => !a)}
            role="switch"
            aria-checked={autoCharge}
            className={cn(
              'shrink-0 relative w-[44px] h-[24px] rounded-full transition-colors duration-[160ms]',
              autoCharge
                ? 'bg-[var(--neon)] shadow-[0_0_10px_var(--neon-glow)]'
                : 'bg-[var(--g3)] border border-[var(--border-hi)]',
            )}
          >
            <span
              className={cn(
                'absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white transition-all duration-[160ms]',
                autoCharge ? 'left-[22px]' : 'left-[2px]',
              )}
            />
          </button>
        </div>

        {/* Usage history */}
        <div className="mt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
            {t('historyTitle')}
          </p>
          {MOCK_USAGE.length === 0 ? (
            <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] py-12 text-center text-[13px] text-[var(--text-3)]">
              {t('emptyHistory')}
            </div>
          ) : (
            <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[140px_1fr_100px_120px] gap-3 px-5 py-3 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
                <span>{t('historyDate')}</span>
                <span>{t('historyDescription')}</span>
                <span className="text-right">{t('historyAmount')}</span>
                <span className="text-right">{t('historyBalance')}</span>
              </div>
              {/* Rows */}
              {MOCK_USAGE.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[140px_1fr_100px_120px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[var(--g1)] transition-colors duration-[100ms]"
                >
                  <span className="font-mono text-[12px] text-[var(--text-3)]">{formatDate(row.date)}</span>
                  <span className="text-[13px] text-[var(--text-2)] truncate">{row.description}</span>
                  <span
                    className={cn(
                      'font-mono text-[13px] text-right',
                      row.delta < 0 ? 'text-[rgba(255,150,150,0.85)]' : 'text-[var(--neon)]',
                    )}
                  >
                    {row.delta > 0 ? '+' : ''}{row.delta}
                  </span>
                  <span className="font-mono text-[13px] text-[var(--text-2)] text-right">
                    {formatNumber(row.balance)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className="mt-3 px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
          >
            {t('historyMore')}
          </button>
        </div>
      </div>
    </div>
  );
}
