'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface BgRemovalButtonProps {
  assetId: string;
  onSuccess?: (newFileUrl: string) => void;
}

function BgRemovalButton({ assetId, onSuccess }: BgRemovalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/remove-bg`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onSuccess?.(data.fileUrl);
    } catch {
      // toast error in Phase C
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="ghost" onClick={handleClick} disabled={loading} className="gap-1.5">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
        <rect x="1" y="1" width="14" height="14" rx="3" strokeDasharray="3 2" />
        <path d="M5 8h6M8 5v6" strokeLinecap="round" />
      </svg>
      {loading ? 'Removing…' : 'Remove BG'}
    </Button>
  );
}

export { BgRemovalButton };
