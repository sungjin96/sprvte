'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Role = 'admin' | 'user';
type Status = 'active' | 'dormant' | 'banned';

interface UserRow {
  id: string;
  email: string;
  role: Role;
  credits: number;
  spentTotal: number;
  signedUpAt: string;
  lastActiveAt: string;
  status: Status;
}

const MOCK_USERS: UserRow[] = [
  { id: 'u1', email: 'alice@example.com',   role: 'admin', credits: 2450, spentTotal: 5200, signedUpAt: '2026-01-12T10:00:00Z', lastActiveAt: '2026-04-28T14:00:00Z', status: 'active' },
  { id: 'u2', email: 'bob.dev@gmail.com',   role: 'user',  credits: 145,  spentTotal: 1855, signedUpAt: '2026-02-04T15:30:00Z', lastActiveAt: '2026-04-28T11:00:00Z', status: 'active' },
  { id: 'u3', email: 'pixel.studio@me.com', role: 'user',  credits: 2890, spentTotal: 110,  signedUpAt: '2026-04-28T09:15:00Z', lastActiveAt: '2026-04-28T10:00:00Z', status: 'active' },
  { id: 'u4', email: 'kim.gd@naver.com',    role: 'user',  credits: 80,   spentTotal: 320,  signedUpAt: '2026-04-15T22:00:00Z', lastActiveAt: '2026-04-26T19:00:00Z', status: 'active' },
  { id: 'u5', email: 'inactive.dev@x.com',  role: 'user',  credits: 12,   spentTotal: 188,  signedUpAt: '2025-11-02T12:00:00Z', lastActiveAt: '2026-02-14T08:00:00Z', status: 'dormant' },
  { id: 'u6', email: 'spammer@no.com',      role: 'user',  credits: 0,    spentTotal: 0,    signedUpAt: '2026-04-10T03:00:00Z', lastActiveAt: '2026-04-10T03:05:00Z', status: 'banned' },
];

type Filter = 'all' | 'admin' | 'active' | 'dormant' | 'banned';

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [grantingUserId, setGrantingUserId] = useState<string | null>(null);
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantReason, setGrantReason] = useState('');

  const filtered = useMemo(() => {
    let list = MOCK_USERS;
    if (search) list = list.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'admin')   list = list.filter((u) => u.role === 'admin');
    if (filter === 'active')  list = list.filter((u) => u.status === 'active');
    if (filter === 'dormant') list = list.filter((u) => u.status === 'dormant');
    if (filter === 'banned')  list = list.filter((u) => u.status === 'banned');
    return list;
  }, [search, filter]);

  const grantingUser = MOCK_USERS.find((u) => u.id === grantingUserId);

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
      </div>

      <div className="p-6 space-y-4">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="w-[280px] bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[8px] text-[13px] text-[var(--text)] placeholder:text-[var(--text-3)] px-3 py-2 outline-none focus:border-[rgba(0,229,160,0.3)]"
          />
          <div className="flex items-center gap-1.5">
            {(['all', 'admin', 'active', 'dormant', 'banned'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  'px-2.5 py-1.5 rounded-[6px] text-[11px] font-mono uppercase tracking-[0.04em] border transition-all duration-[100ms]',
                  filter === f
                    ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
                    : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                )}
              >
                {t(`filter${f.charAt(0).toUpperCase() + f.slice(1)}` as 'filterAll')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
          <div className="grid grid-cols-[2.2fr_80px_100px_120px_110px_110px_120px] gap-3 px-5 py-3 border-b border-[var(--border)] font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
            <span>{t('tableEmail')}</span>
            <span>{t('tableRole')}</span>
            <span className="text-right">{t('tableCredits')}</span>
            <span className="text-right">{t('tableSpent')}</span>
            <span>{t('tableSignedUp')}</span>
            <span>{t('tableLastActive')}</span>
            <span className="text-right">actions</span>
          </div>
          {filtered.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[2.2fr_80px_100px_120px_110px_110px_120px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[var(--g1)] transition-colors duration-[100ms] items-center"
            >
              <div className="min-w-0">
                <p className="text-[13px] text-[var(--text)] truncate">{u.email}</p>
                <span className={cn(
                  'inline-block mt-0.5 px-1.5 py-[1px] rounded-[3px] font-mono text-[9px] uppercase tracking-[0.04em] border',
                  u.status === 'active'  && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
                  u.status === 'dormant' && 'bg-[var(--g2)] text-[var(--text-3)] border-[var(--border)]',
                  u.status === 'banned'  && 'bg-[rgba(255,60,60,0.08)] text-[rgba(255,100,100,0.95)] border-[rgba(255,60,60,0.2)]',
                )}>
                  {t(`status${u.status.charAt(0).toUpperCase() + u.status.slice(1)}` as 'statusActive')}
                </span>
              </div>
              <span className={cn(
                'font-mono text-[10px] uppercase tracking-[0.04em]',
                u.role === 'admin' ? 'text-[rgba(255,200,80,0.95)]' : 'text-[var(--text-3)]',
              )}>
                {t(`role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}` as 'roleAdmin')}
              </span>
              <span className="font-mono text-[12px] text-[var(--neon)] text-right">{u.credits.toLocaleString()}</span>
              <span className="font-mono text-[12px] text-[var(--text-2)] text-right">{u.spentTotal.toLocaleString()}</span>
              <span className="font-mono text-[11px] text-[var(--text-3)]">{formatDate(u.signedUpAt)}</span>
              <span className="font-mono text-[11px] text-[var(--text-3)]">{formatDate(u.lastActiveAt)}</span>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => { setGrantingUserId(u.id); setGrantAmount(100); setGrantReason(''); }}
                  className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[100ms]"
                  title={t('actionGrant')}
                >
                  +cr
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-3)] hover:text-[var(--text)] transition-colors duration-[100ms]"
                  title={u.role === 'admin' ? t('actionRemoveAdmin') : t('actionMakeAdmin')}
                >
                  ⚙
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded-[6px] text-[10px] font-mono text-[var(--text-3)] hover:text-[rgba(255,100,100,0.95)] transition-colors duration-[100ms]"
                  title={u.status === 'banned' ? t('actionUnban') : t('actionBan')}
                >
                  ⊘
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grant modal */}
      {grantingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
          onClick={() => setGrantingUserId(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] border border-[var(--border-hi)] bg-[rgba(20,20,28,0.97)] backdrop-blur-[20px] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[var(--text)] mb-1">{t('grantTitle')}</h3>
            <p className="text-[12px] text-[var(--text-3)] mb-5">{grantingUser.email}</p>

            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
              {t('grantAmount')}
            </label>
            <input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(Number(e.target.value))}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[14px] font-mono text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] mb-4"
            />

            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
              {t('grantReason')}
            </label>
            <textarea
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              rows={2}
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] resize-none mb-5"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGrantingUserId(null)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => setGrantingUserId(null)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] font-semibold text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms]"
              >
                {t('grantSubmit')} +{grantAmount}cr
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
