'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type CouponType = 'credits' | 'percent' | 'fixed';
type CouponStatus = 'active' | 'expired' | 'depleted' | 'disabled';

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  used: number;
  usageLimit: number;
  expiresAt: string | null;
  status: CouponStatus;
  description?: string;
}

const MOCK_COUPONS: Coupon[] = [
  { id: 'c1', code: 'LAUNCH100',  type: 'credits', value: 100,  used: 47,  usageLimit: 100, expiresAt: '2026-05-31T23:59:59Z', status: 'active',   description: '런치 프로모션' },
  { id: 'c2', code: 'EARLY30',    type: 'percent', value: 30,   used: 12,  usageLimit: 50,  expiresAt: '2026-06-30T23:59:59Z', status: 'active' },
  { id: 'c3', code: 'BLACKFRI',   type: 'fixed',   value: 1000, used: 50,  usageLimit: 50,  expiresAt: '2025-12-01T23:59:59Z', status: 'depleted' },
  { id: 'c4', code: 'WELCOME50',  type: 'credits', value: 50,   used: 8,   usageLimit: 0,   expiresAt: null,                    status: 'disabled' },
  { id: 'c5', code: 'XMAS2025',   type: 'percent', value: 20,   used: 88,  usageLimit: 100, expiresAt: '2025-12-25T23:59:59Z', status: 'expired' },
];

function formatDate(iso: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminCouponsPage() {
  const t = useTranslations('admin.coupons');
  const [showCreate, setShowCreate] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('credits');
  const [value, setValue] = useState(100);
  const [usageLimit, setUsageLimit] = useState(100);
  const [expiry, setExpiry] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%] flex items-center justify-between"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium text-black bg-[var(--neon)] shadow-[0_0_12px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]"
        >
          {t('newCoupon')}
        </button>
      </div>

      <div className="p-6">
        <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
          <div className="grid grid-cols-[1.5fr_120px_100px_120px_140px_100px_120px] gap-3 px-5 py-3 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            <span>{t('tableCode')}</span>
            <span>{t('tableType')}</span>
            <span className="text-right">{t('tableValue')}</span>
            <span>{t('tableUsage')}</span>
            <span>{t('tableExpiry')}</span>
            <span>{t('tableStatus')}</span>
            <span className="text-right">actions</span>
          </div>
          {MOCK_COUPONS.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1.5fr_120px_100px_120px_140px_100px_120px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[var(--g1)] transition-colors duration-[100ms] items-center"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-mono font-semibold text-[var(--text)] tracking-wider">{c.code}</p>
                {c.description && <p className="text-[11px] text-[var(--text-3)] mt-0.5 truncate">{c.description}</p>}
              </div>
              <span className="font-mono text-[11px] uppercase text-[var(--text-2)]">
                {t(`type${c.type.charAt(0).toUpperCase() + c.type.slice(1)}` as 'typeCredits')}
              </span>
              <span className="font-mono text-[12px] text-[var(--neon)] text-right">
                {c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? `$${c.value / 100}` : `${c.value}cr`}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] text-[var(--text-2)]">{c.used}</span>
                <span className="font-mono text-[10px] text-[var(--text-3)]">/ {c.usageLimit || '∞'}</span>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-3)]">{formatDate(c.expiresAt)}</span>
              <span className={cn(
                'font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-[2px] rounded-[3px] border w-fit',
                c.status === 'active'   && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
                c.status === 'expired'  && 'bg-[var(--g2)] text-[var(--text-3)] border-[var(--border)]',
                c.status === 'depleted' && 'bg-[rgba(255,200,80,0.08)] text-[rgba(255,200,80,0.95)] border-[rgba(255,200,80,0.2)]',
                c.status === 'disabled' && 'bg-[rgba(255,60,60,0.06)] text-[rgba(255,100,100,0.85)] border-[rgba(255,60,60,0.15)]',
              )}>
                {t(`status${c.status.charAt(0).toUpperCase() + c.status.slice(1)}` as 'statusActive')}
              </span>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-all duration-[100ms]"
                >
                  {c.status === 'disabled' ? t('enable') : t('disable')}
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-3)] hover:text-[rgba(255,100,100,0.95)] transition-colors duration-[100ms]"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-[14px] border border-[var(--border-hi)] bg-[rgba(20,20,28,0.97)] backdrop-blur-[20px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[var(--text)] mb-5">{t('createTitle')}</h3>

            <div className="space-y-4">
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  {t('fieldCode')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="LAUNCH100"
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[14px] font-mono font-semibold text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] uppercase tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                    {t('fieldType')}
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CouponType)}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)]"
                  >
                    <option value="credits">{t('typeCredits')}</option>
                    <option value="percent">{t('typePercent')}</option>
                    <option value="fixed">{t('typeFixed')}</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                    {t('fieldValue')}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] font-mono text-[var(--text)] px-3 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                    {t('fieldUsageLimit')}
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] font-mono text-[var(--text)] px-3 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)]"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                    {t('fieldExpiry')}
                  </label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] font-mono text-[var(--text)] px-3 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)]"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-1">
                  {t('fieldDescription')}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
              >
                cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={!code.trim()}
                className="px-3.5 py-2 rounded-[8px] text-[13px] font-semibold text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
