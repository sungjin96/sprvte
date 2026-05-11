import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Entity, ENTITY_CATEGORY_LABELS } from '@/types/entity';
import { ENTITY_CATEGORY_SVG } from './categoryIcons';

interface EntityCardProps {
  entity: Entity;
  projectId: string;
  locale: string;
  className?: string;
}

function EntityCard({ entity, projectId, locale, className }: EntityCardProps) {
  const icon = ENTITY_CATEGORY_SVG[entity.category];
  const label = ENTITY_CATEGORY_LABELS[entity.category] ?? entity.category;

  return (
    <Link
      href={`/${locale}/projects/${projectId}/entities/${entity.id}?category=${entity.category}`}
      className={cn(
        'group relative flex flex-col gap-3 p-4 rounded-xl',
        'bg-[var(--g1)] border border-[var(--border-hi)]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
        'hover:border-[var(--neon)] hover:bg-[var(--g2)]',
        'hover:shadow-[0_4px_16px_rgba(0,229,160,0.08)]',
        'transition-all duration-150',
        className,
      )}
    >
      {/* Mode badge */}
      <span
        className={cn(
          'absolute top-3 right-3 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide',
          entity.mode === 'quality'
            ? 'bg-[var(--neon-dim)] text-[var(--neon)] border border-[rgba(0,229,160,0.2)]'
            : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-3)] border border-[var(--border)]',
        )}
      >
        {entity.mode}
      </span>

      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--g2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-2)] p-2">
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold text-[var(--text)] truncate pr-12">{entity.name}</h3>
        <p className="text-[11px] text-[var(--text-3)] mt-0.5 font-mono uppercase tracking-wide">{label}</p>
        {entity.description && (
          <p className="text-[12px] text-[var(--text-2)] mt-1.5 line-clamp-2 leading-snug">{entity.description}</p>
        )}
      </div>
    </Link>
  );
}

export { EntityCard };
