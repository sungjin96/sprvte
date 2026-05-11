'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AssetVersion {
  id: string;
  fileUrl?: string | null;
  createdAt: string;
  label?: string; // e.g. 'variation', 'pixel', 'remove-bg'
  isCurrent?: boolean;
}

interface VersionHistoryProps {
  versions: AssetVersion[];
  onRollback?: (versionId: string) => void;
}

const ACTION_LABELS: Record<string, string> = {
  variation: 'Variation',
  pixel: 'Pixel Art',
  'remove-bg': 'BG Removed',
  animate: 'Animated',
  original: 'Original',
};

function VersionHistory({ versions, onRollback }: VersionHistoryProps) {
  if (!versions.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">Version History</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <div className="space-y-2">
        {versions.map((v) => (
          <div
            key={v.id}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
              v.isCurrent
                ? 'border-[var(--neon)] bg-[var(--neon-dim)]'
                : 'border-[var(--border)] bg-[var(--g1)]',
            )}
          >
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] shrink-0 relative bg-[var(--g2)]">
              {v.fileUrl && <Image src={v.fileUrl} alt="version" fill className="object-cover" />}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <p className={cn('text-[12px] font-medium', v.isCurrent ? 'text-[var(--neon)]' : 'text-[var(--text)]')}>
                {v.isCurrent ? 'Current' : ACTION_LABELS[v.label ?? ''] ?? 'Edit'}
              </p>
              <p className="text-[11px] text-[var(--text-3)] font-mono">{v.createdAt.slice(0, 10)}</p>
            </div>

            {/* Rollback */}
            {!v.isCurrent && onRollback && (
              <button
                type="button"
                onClick={() => onRollback(v.id)}
                className="text-[11px] font-mono text-[var(--text-3)] hover:text-[var(--neon)] transition-colors shrink-0"
              >
                Restore
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { VersionHistory };
