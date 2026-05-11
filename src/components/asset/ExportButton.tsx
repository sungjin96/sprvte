'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type ExportMode = 'single' | 'zip' | 'atlas';

interface ExportButtonProps {
  assetId: string;
  projectId?: string;
  modes?: ExportMode[];
}

const MODE_LABELS: Record<ExportMode, string> = {
  single: 'Download',
  zip: 'Project ZIP',
  atlas: 'Sprite Atlas',
};

function ExportButton({ assetId, projectId, modes = ['single', 'atlas'] }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportMode | null>(null);

  const handleExport = async (mode: ExportMode) => {
    setLoading(mode);
    setOpen(false);
    try {
      let url = '';
      if (mode === 'single') {
        url = `/api/assets/${assetId}/download`;
      } else if (mode === 'zip' && projectId) {
        url = `/api/projects/${projectId}/export`;
      } else if (mode === 'atlas') {
        url = `/api/assets/${assetId}/export/atlas`;
      }
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = mode === 'zip' ? 'project.zip' : mode === 'atlas' ? 'atlas.zip' : 'asset.png';
      a.click();
      URL.revokeObjectURL(href);
    } catch {
      // toast error in Phase C
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[12px] font-medium transition-all',
          'border-[var(--border)] bg-[var(--g1)] text-[var(--text-2)]',
          'hover:border-[var(--border-hi)] hover:bg-[var(--g2)] hover:text-[var(--text)]',
        )}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
          <path d="M7 1v8M4 6l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 10v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" strokeLinecap="round" />
        </svg>
        Export
        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
          <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-40 rounded-xl border border-[var(--border-hi)] bg-[rgba(10,10,10,0.95)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden py-1">
            {modes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleExport(mode)}
                disabled={loading === mode}
                className="w-full text-left px-3 py-2 text-[12px] text-[var(--text-2)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-colors"
              >
                {loading === mode ? 'Exporting…' : MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export { ExportButton };
