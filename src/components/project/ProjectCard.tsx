import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  assetCount?: number;
  className?: string;
  locale?: string;
}

function ProjectCard({ project, assetCount, className, locale }: ProjectCardProps) {
  const href = locale ? `/${locale}/projects/${project.id}` : `/projects/${project.id}`;
  return (
    <Link
      href={href}
      className={cn(
        'group flex flex-col gap-4 p-5 rounded-xl',
        'bg-[var(--g1)] border border-[var(--border-hi)]',
        'shadow-[0_2px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]',
        'hover:border-[var(--neon)] hover:bg-[var(--g2)]',
        'hover:shadow-[0_4px_24px_rgba(0,229,160,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]',
        'transition-all duration-150',
        className,
      )}
    >
      {/* Color palette strip */}
      {project.colorPalette && project.colorPalette.length > 0 && (
        <div className="flex gap-1 h-2">
          {project.colorPalette.map((color) => (
            <div
              key={color}
              className="flex-1 rounded-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Name */}
      <div>
        <h3 className="text-[15px] font-semibold text-[var(--text)] group-hover:text-white transition-colors">
          {project.name}
        </h3>
        <div className="flex items-center gap-2 mt-1.5">
          {project.genre && (
            <span className="text-[11px] font-mono text-[var(--text-3)] px-1.5 py-0.5 rounded bg-[var(--g2)] border border-[var(--border)]">
              {project.genre}
            </span>
          )}
          {project.artStyle && (
            <span className="text-[11px] font-mono text-[var(--text-3)] px-1.5 py-0.5 rounded bg-[var(--g2)] border border-[var(--border)]">
              {project.artStyle}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[11px] text-[var(--text-3)] font-mono">
          {assetCount !== undefined ? `${assetCount} assets` : ''}
        </span>
        <span className="text-[11px] text-[var(--text-3)] font-mono">
          {project.createdAt.slice(0, 10)}
        </span>
      </div>
    </Link>
  );
}

export { ProjectCard };
