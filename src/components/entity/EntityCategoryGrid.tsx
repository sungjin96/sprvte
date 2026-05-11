'use client';

import { useTranslations } from 'next-intl';
import { Entity, EntityCategory, ENTITY_CATEGORY_LABELS } from '@/types/entity';
import { ENTITY_CATEGORY_SVG } from './categoryIcons';
import { EntityCard } from './EntityCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface EntityCategoryGridProps {
  entities: Entity[];
  projectId: string;
  locale: string;
  onCreateInCategory?: (category: EntityCategory) => void;
}

// All categories to always display sections for
const ALL_CATEGORIES: EntityCategory[] = ['character', 'map', 'item', 'ui', 'audio', 'effect'];

function EntityCategoryGrid({ entities, projectId, locale, onCreateInCategory }: EntityCategoryGridProps) {
  const t = useTranslations('entities');
  const byCategory = ALL_CATEGORIES.reduce<Record<EntityCategory, Entity[]>>(
    (acc, cat) => {
      acc[cat] = entities.filter((e) => e.category === cat);
      return acc;
    },
    {} as Record<EntityCategory, Entity[]>,
  );

  const nonEmpty = ALL_CATEGORIES.filter((cat) => byCategory[cat].length > 0);
  const empty = ALL_CATEGORIES.filter((cat) => byCategory[cat].length === 0);

  if (entities.length === 0) {
    return (
      <EmptyState
        heading={t('empty')}
        body={t('emptyBody')}
      />
    );
  }

  return (
    <div className="space-y-8">
      {nonEmpty.map((cat) => (
        <section key={cat}>
          {/* Section header */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-4 h-4 text-[var(--text-2)]">{ENTITY_CATEGORY_SVG[cat]}</span>
            <h2 className="text-[13px] font-semibold text-[var(--text)] uppercase tracking-wide font-mono">
              {ENTITY_CATEGORY_LABELS[cat]}
            </h2>
            <span className="ml-1 text-[11px] text-[var(--text-3)] font-mono">
              {byCategory[cat].length}
            </span>
            <div className="flex-1 h-px bg-[var(--border)] ml-2" />
            {onCreateInCategory && (
              <button
                type="button"
                onClick={() => onCreateInCategory(cat)}
                className="text-[11px] text-[var(--text-3)] hover:text-[var(--neon)] transition-colors font-mono"
              >
                + Add
              </button>
            )}
          </div>

          {/* Entity cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {byCategory[cat].map((entity) => (
              <EntityCard key={entity.id} entity={entity} projectId={projectId} locale={locale} />
            ))}
          </div>
        </section>
      ))}

      {/* Empty categories — collapsed hint strip */}
      {empty.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {empty.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onCreateInCategory?.(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[var(--border)] text-[11px] text-[var(--text-3)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)] transition-all"
            >
              <span className="w-3.5 h-3.5">{ENTITY_CATEGORY_SVG[cat]}</span>
              <span className="font-mono">+ {ENTITY_CATEGORY_LABELS[cat]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { EntityCategoryGrid };
