'use client';

import { useState, ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ProviderCard, Provider } from '@/components/settings/ProviderCard';

// ── Inline SVG icons (replacing emoji per design rule) ────────────────────────
const Icons: Record<string, ReactNode> = {
  image: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" />
      <circle cx="6" cy="6.5" r="1.2" />
      <path d="M2.5 11l3.5-3.5 3 3 2-2 2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
      <path d="M6 2v9.5M6 2l5-1.2v9.5" strokeLinecap="round" />
      <circle cx="4.5" cy="11.5" r="1.5" />
      <circle cx="9.5" cy="10.3" r="1.5" />
    </svg>
  ),
  animation: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-4 h-4">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="M1.5 6h13M4 3v-1.5M12 3v-1.5M4 13v1.5M12 13v1.5" strokeLinecap="round" />
      <path d="M6.5 8l3 1.5-3 1.5V8z" fill="currentColor" />
    </svg>
  ),
};

// ── v5 plan model lineup — 3 tiers × 3 categories ────────────────────────────
// Phase B: this becomes the seed for the `models` table in Supabase.
const INITIAL_PROVIDERS: Provider[] = [
  // ── Image ───────────────────────────────────────────────────────────────────
  {
    name: 'replicate-sdxl-lightning',
    displayName: 'SDXL Lightning',
    description: {
      en: 'Fast SDXL model. Great for quick iteration and large batches. Lower fidelity than premium tiers.',
      ko: '빠른 SDXL 모델. 빠른 반복 작업과 대량 생성에 적합. 프리미엄 대비 충실도는 낮음.',
    },
    status: 'active', category: 'image', tier: 'budget', creditCost: 4,
    tags: [{ en: 'Fast', ko: '빠름' }, { en: 'Cheap', ko: '가성비' }],
  },
  {
    name: 'replicate-flux-schnell',
    displayName: 'FLUX.1 [schnell]',
    description: {
      en: 'Balanced quality and speed. Strong prompt adherence, ideal for character art and detailed sprites.',
      ko: '품질과 속도의 균형. 프롬프트 추종성이 좋아 캐릭터·세밀 스프라이트에 적합.',
    },
    status: 'active', category: 'image', tier: 'balanced', creditCost: 8,
    tags: [{ en: 'Balanced', ko: '균형' }, { en: 'Recommended', ko: '추천' }],
  },
  {
    name: 'openai-gpt-image-2',
    displayName: 'GPT-Image-2',
    description: {
      en: 'OpenAI flagship (released 2026.04). Best-in-class composition and prompt understanding. Premium pricing.',
      ko: 'OpenAI 최신 플래그십 (2026.04 출시). 구도와 프롬프트 이해도 최상급. 프리미엄 가격.',
    },
    status: 'inactive', category: 'image', tier: 'premium', creditCost: 30,
    tags: [{ en: 'Best quality', ko: '최고 품질' }, { en: 'New', ko: '신규' }],
  },
  // ── Audio ───────────────────────────────────────────────────────────────────
  {
    name: 'mubert',
    displayName: 'Mubert',
    description: {
      en: 'AI BGM with genre, mood, and BPM control. Loop-friendly outputs ideal for game background music.',
      ko: '장르·분위기·BPM 조절 가능한 AI BGM. 루프 친화적이라 게임 배경음악에 적합.',
    },
    status: 'active', category: 'audio', tier: 'budget', creditCost: 6,
    tags: [{ en: 'BGM', ko: 'BGM' }, { en: 'Loops', ko: '루프' }],
  },
  {
    name: 'elevenlabs-sfx',
    displayName: 'ElevenLabs SFX',
    description: {
      en: 'Text-to-sound effect. Best for short, unique SFX (impacts, UI clicks, ambient one-shots).',
      ko: '텍스트로 효과음 생성. 짧고 독특한 SFX (타격감·UI 클릭·앰비언트)에 최적.',
    },
    status: 'active', category: 'audio', tier: 'balanced', creditCost: 3,
    tags: [{ en: 'SFX', ko: '효과음' }, { en: 'Short', ko: '짧음' }],
  },
  {
    name: 'suno-v4',
    displayName: 'Suno v4',
    description: {
      en: 'Full-song BGM with vocals/instruments. Premium tier — use for theme songs and key moments.',
      ko: '보컬·악기까지 포함된 풀 송 BGM. 프리미엄 티어 — 테마송이나 주요 장면용.',
    },
    status: 'inactive', category: 'audio', tier: 'premium', creditCost: 25,
    tags: [{ en: 'Full song', ko: '풀 송' }, { en: 'Vocals', ko: '보컬' }],
  },
  // ── Animation ───────────────────────────────────────────────────────────────
  {
    name: 'autosprite',
    displayName: 'AutoSprite',
    description: {
      en: 'Algorithmic sprite-sheet generation from a base image. No AI cost — fastest, cheapest path.',
      ko: '기준 이미지로 알고리즘 기반 스프라이트 시트 생성. AI 호출 없음 — 가장 빠르고 저렴.',
    },
    status: 'active', category: 'animation', tier: 'budget', creditCost: 5,
    tags: [{ en: 'Algorithm', ko: '알고리즘' }, { en: 'Cheapest', ko: '최저가' }],
  },
  {
    name: 'animatediff',
    displayName: 'AnimateDiff',
    description: {
      en: 'AI-driven sprite animation from a single frame. Better motion variety than AutoSprite.',
      ko: '한 장의 프레임으로 AI 기반 스프라이트 애니메이션. AutoSprite보다 동작 다양성 우수.',
    },
    status: 'active', category: 'animation', tier: 'balanced', creditCost: 15,
    tags: [{ en: 'AI motion', ko: 'AI 모션' }, { en: 'Versatile', ko: '다용도' }],
  },
  {
    name: 'runway-gen3-turbo',
    displayName: 'Runway Gen-3 Turbo',
    description: {
      en: 'Premium video model adapted for sprite cycles. Highest fidelity — use for hero animations.',
      ko: '스프라이트 사이클로 활용한 프리미엄 비디오 모델. 최고 충실도 — 히어로 애니메이션용.',
    },
    status: 'inactive', category: 'animation', tier: 'premium', creditCost: 40,
    tags: [{ en: 'Top fidelity', ko: '최상 품질' }, { en: 'Slow', ko: '느림' }],
  },
];

export default function ProvidersPage() {
  const t = useTranslations();
  const locale = (useLocale() as 'en' | 'ko') ?? 'en';
  const CATEGORIES = [
    { id: 'image' as const,     label: t('settings.providers.categories.image'),     icon: Icons.image },
    { id: 'audio' as const,     label: t('settings.providers.categories.audio'),     icon: Icons.audio },
    { id: 'animation' as const, label: t('settings.providers.categories.animation'), icon: Icons.animation },
  ];

  const [selected, setSelected] = useState<Record<string, string>>({
    image: 'replicate-flux',
    audio: 'mubert',
    animation: 'autosprite',
  });

  const handleSelect = (category: string, name: string) => {
    setSelected((p) => ({ ...p, [category]: name }));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <h1 className="text-[16px] font-semibold text-[var(--text)]">{t('settings.providers.title')}</h1>
        <p className="text-[12px] text-[var(--text-3)]">{t('settings.providers.subtitle')}</p>
      </div>

      <div className="p-6 space-y-10 max-w-[1100px]">
        {CATEGORIES.map(({ id, label, icon }) => {
          const catProviders = INITIAL_PROVIDERS.filter((p) => p.category === id);
          return (
            <section key={id}>
              {/* Category header — neutral, icon + label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[var(--text-2)]">{icon}</span>
                <h2 className="text-[13px] font-semibold text-[var(--text)]">{label}</h2>
                <span className="text-[11px] font-mono text-[var(--text-3)]">
                  {catProviders.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {catProviders.map((provider) => (
                  <ProviderCard
                    key={provider.name}
                    provider={provider}
                    locale={locale}
                    selected={selected[id] === provider.name}
                    onSelect={() => handleSelect(id, provider.name)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
