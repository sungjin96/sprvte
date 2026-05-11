import { cn } from '@/lib/utils';

type ProviderStatus = 'active' | 'inactive' | 'error';

/** Pricing/quality tier — drives model lineup curation */
export type ModelTier = 'budget' | 'balanced' | 'premium';

/**
 * Localized text bag — model display names stay English by convention,
 * but descriptions are localized so Korean users actually understand them.
 * Phase B: this moves into the `models` table as JSONB.
 */
export interface LocalizedText {
  en: string;
  ko: string;
}

export interface Provider {
  name: string;
  displayName: string;            // English brand name, never translated
  description: LocalizedText;     // localized
  status: ProviderStatus;
  category: 'image' | 'audio' | 'animation';
  tier?: ModelTier;
  /** Credit cost per generation — admin can adjust live */
  creditCost?: number;
  /** Short chips: localized */
  tags?: LocalizedText[];
}

interface ProviderCardProps {
  provider: Provider;
  onSelect?: () => void;
  selected?: boolean;
  /** Active locale — defaults to 'en' for safety */
  locale?: 'en' | 'ko';
}

/**
 * Model card — shows a single AI model in the catalog.
 * Design rule: neon (--neon) is reserved for the *selected* state only.
 * Status, tags, credit cost all use neutral surfaces.
 */
function ProviderCard({ provider, onSelect, selected, locale = 'en' }: ProviderCardProps) {
  const desc = provider.description[locale] ?? provider.description.en;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex flex-col gap-3 p-4 rounded-xl border text-left w-full',
        'transition-all duration-150',
        selected
          // Selected: subtle neon outline only — no fill, no glow flood
          ? 'border-[var(--neon)] bg-[var(--g1)]'
          : 'border-[var(--border-hi)] bg-[var(--g1)] hover:border-[var(--text-3)] hover:bg-[var(--g2)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[var(--text)] truncate">
              {provider.displayName}
            </h3>
            {/* Selected indicator — only neon usage on the card */}
            {selected && (
              <svg viewBox="0 0 12 12" fill="none" stroke="var(--neon)" strokeWidth="1.8" className="w-3 h-3 shrink-0">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Credit cost — neutral monospace */}
        {provider.creditCost !== undefined && (
          <span className="shrink-0 text-[11px] font-mono text-[var(--text-2)] px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--g2)]">
            {provider.creditCost} cr
          </span>
        )}
      </div>

      <p className="text-[12px] text-[var(--text-2)] leading-snug line-clamp-3">
        {desc}
      </p>

      {/* Tags row */}
      {provider.tags && provider.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto">
          {provider.tags.map((tag, i) => {
            const text = tag[locale] ?? tag.en;
            return (
              <span
                key={`${i}-${text}`}
                className="text-[10px] font-mono text-[var(--text-3)] px-1.5 py-0.5 rounded border border-[var(--border)]"
              >
                {text}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}

export { ProviderCard };
