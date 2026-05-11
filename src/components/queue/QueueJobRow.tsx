'use client';

import { cn } from '@/lib/utils';
import { ProgressBar } from '@/components/ui/ProgressBar';

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';

export interface QueueJob {
  id: string;
  name: string;
  status: JobStatus;
  progress?: number;
  assetType?: string;
  projectName?: string;
  createdAt: string;
  error?: string;
}

interface QueueJobRowProps {
  job: QueueJob;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  waiting: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  active: 'text-[var(--neon)] bg-[var(--neon-dim)] border-[rgba(0,229,160,0.2)]',
  completed: 'text-[var(--text-3)] bg-[var(--g1)] border-[var(--border)]',
  failed: 'text-red-400 bg-red-400/10 border-red-400/20',
  delayed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
};

function QueueJobRow({ job, onCancel, onRetry }: QueueJobRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--g1)] hover:bg-[var(--g2)] transition-colors">
      {/* Status badge */}
      <span
        className={cn(
          'shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wide border',
          STATUS_STYLES[job.status],
        )}
      >
        {job.status}
      </span>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--text)] truncate">{job.name}</span>
          {job.assetType && (
            <span className="text-[10px] font-mono text-[var(--text-3)] shrink-0">{job.assetType}</span>
          )}
        </div>
        {job.projectName && (
          <span className="text-[11px] text-[var(--text-3)]">{job.projectName}</span>
        )}
        {job.status === 'active' && job.progress !== undefined && (
          <div className="mt-1.5">
            <ProgressBar value={job.progress} size="sm" />
          </div>
        )}
        {job.status === 'failed' && job.error && (
          <p className="text-[11px] text-red-400 mt-0.5 truncate">{job.error}</p>
        )}
      </div>

      {/* Time */}
      <span className="text-[11px] font-mono text-[var(--text-3)] shrink-0">
        {job.createdAt.slice(11, 19)}
      </span>

      {/* Actions */}
      <div className="flex gap-1.5 shrink-0">
        {job.status === 'failed' && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(job.id)}
            className="h-6 px-2 text-[11px] font-mono rounded border border-[var(--neon)] text-[var(--neon)] bg-[var(--neon-dim)] hover:bg-[rgba(0,229,160,0.1)] transition-colors"
          >
            Retry
          </button>
        )}
        {(job.status === 'waiting' || job.status === 'active') && onCancel && (
          <button
            type="button"
            onClick={() => onCancel(job.id)}
            className="h-6 px-2 text-[11px] font-mono rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export { QueueJobRow };
