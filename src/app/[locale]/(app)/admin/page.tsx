'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const KPIS = [
  { key: 'kpiMrr',          value: '$3,240', delta: +12.4 },
  { key: 'kpiActiveUsers',  value: '187',    delta: +8.1  },
  { key: 'kpiCreditsBurnt', value: '124,580', delta: +24.7 },
  { key: 'kpiMargin',       value: '64%',    delta: -2.3  },
  { key: 'kpiSignups',      value: '42',     delta: +18.0 },
];

const RECENT_SIGNUPS = [
  { email: 'alice@example.com',   plan: 'CREATOR', cr: 600,  joinedAt: '2026-04-28T13:42:00Z' },
  { email: 'bob.dev@gmail.com',   plan: 'STARTER', cr: 200,  joinedAt: '2026-04-28T11:08:00Z' },
  { email: 'pixel.studio@me.com', plan: 'STUDIO',  cr: 3000, joinedAt: '2026-04-28T09:15:00Z' },
  { email: 'kim.gd@naver.com',    plan: 'STARTER', cr: 200,  joinedAt: '2026-04-27T22:30:00Z' },
];

const TOP_MODELS = [
  { name: 'replicate-flux-schnell',  category: 'image',     calls: 4218, share: 38 },
  { name: 'replicate-sdxl-lightning', category: 'image',     calls: 2841, share: 26 },
  { name: 'mubert',                  category: 'audio',     calls: 1452, share: 13 },
  { name: 'autosprite',              category: 'animation', calls: 1289, share: 12 },
  { name: 'elevenlabs-sfx',          category: 'audio',     calls: 612,  share: 6  },
];

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('title')}</h1>
      </div>

      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {KPIS.map((kpi) => (
            <div
              key={kpi.key}
              className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-4 backdrop-blur-[20px]"
              style={{ WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                {t(kpi.key as 'kpiMrr')}
              </p>
              <p className="text-[24px] font-bold tracking-[-0.01em] text-[var(--text)]">{kpi.value}</p>
              <p className={cn(
                'mt-1 font-mono text-[11px]',
                kpi.delta >= 0 ? 'text-[var(--neon)]' : 'text-[rgba(255,150,150,0.85)]',
              )}>
                {kpi.delta >= 0 ? '↑' : '↓'} {Math.abs(kpi.delta)}% <span className="text-[var(--text-3)]">{t('deltaWoW')}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Two-column lower section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Recent signups */}
          <section className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
              {t('recentSignups')}
            </p>
            <ul className="space-y-2">
              {RECENT_SIGNUPS.map((u) => (
                <li key={u.email} className="flex items-center justify-between text-[12px]">
                  <span className="text-[var(--text)] truncate flex-1">{u.email}</span>
                  <span className="font-mono text-[10px] text-[var(--neon)] mx-3 shrink-0">{u.plan}</span>
                  <span className="font-mono text-[10px] text-[var(--text-3)] shrink-0">
                    {formatRelative(u.joinedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Top models */}
          <section className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-3">
              {t('topModels')}
            </p>
            <ul className="space-y-3">
              {TOP_MODELS.map((m) => (
                <li key={m.name}>
                  <div className="flex items-baseline justify-between mb-1 text-[12px]">
                    <span className="text-[var(--text)] font-mono">{m.name}</span>
                    <span className="font-mono text-[10px] text-[var(--text-3)]">{m.calls.toLocaleString()} calls · {m.share}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[var(--g1)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--neon)] transition-all duration-[300ms]"
                      style={{ width: `${m.share * 2.5}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Revenue chart (mock SVG) */}
        <section className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-5">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
              {t('revenueChart')}
            </p>
            <p className="font-mono text-[11px] text-[var(--text-3)]">
              {t('errorRate')}: <span className="text-[var(--neon)]">0.4%</span>
            </p>
          </div>
          <svg viewBox="0 0 800 200" preserveAspectRatio="none" className="w-full h-[180px]">
            <defs>
              <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5A0" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00E5A0" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid */}
            {[0, 50, 100, 150].map((y) => (
              <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.04)" />
            ))}
            {/* Area */}
            <path
              d="M0,160 L40,150 L80,140 L120,135 L160,120 L200,100 L240,110 L280,90 L320,80 L360,85 L400,70 L440,75 L480,55 L520,60 L560,45 L600,50 L640,40 L680,35 L720,30 L760,25 L800,20 L800,200 L0,200 Z"
              fill="url(#rev-grad)"
            />
            {/* Line */}
            <path
              d="M0,160 L40,150 L80,140 L120,135 L160,120 L200,100 L240,110 L280,90 L320,80 L360,85 L400,70 L440,75 L480,55 L520,60 L560,45 L600,50 L640,40 L680,35 L720,30 L760,25 L800,20"
              fill="none"
              stroke="#00E5A0"
              strokeWidth="2"
            />
          </svg>
        </section>
      </div>
    </div>
  );
}
