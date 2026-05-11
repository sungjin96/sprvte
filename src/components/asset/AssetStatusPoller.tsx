'use client';

import { useEffect, useRef } from 'react';
import { AssetStatus } from '@/types/asset';

interface AssetStatusPollerProps {
  assetId: string;
  currentStatus: AssetStatus;
  onStatusChange: (status: AssetStatus, fileUrl?: string) => void;
  intervalMs?: number;
}

/**
 * Headless poller — mounts when status is pending/processing, polls until done/failed.
 * Replace the fetch URL with the real API route in Phase C.
 */
function AssetStatusPoller({
  assetId,
  currentStatus,
  onStatusChange,
  intervalMs = 2000,
}: AssetStatusPollerProps) {
  const active = currentStatus === 'pending' || currentStatus === 'processing';
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/assets/${assetId}/status`);
        if (!res.ok) return;
        const data: { status: AssetStatus; fileUrl?: string } = await res.json();
        if (data.status !== currentStatus) {
          onStatusChange(data.status, data.fileUrl);
        }
      } catch {
        // Network error — silently retry
      }
    };

    timerRef.current = setInterval(poll, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assetId, currentStatus, onStatusChange, intervalMs, active]);

  return null; // Headless
}

export { AssetStatusPoller };
