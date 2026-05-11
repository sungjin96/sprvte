'use client';

import { useEffect, useState } from 'react';

export interface CompositionEvent {
  compositionId: string;
  stage: 'queued' | 'generating' | 'splitting' | 'persisting' | 'completed' | 'failed';
  progress: number;
  baseImageUrl?: string;
  layers?: { id: string; name: string; layerImageUrl: string; maskUrl: string }[];
  error?: string;
}

/**
 * Subscribes to /api/compositions/[id]/events (SSE).
 * Returns the latest event. Component decides how to react.
 */
export function useCompositionEvents(compositionId: string | null): CompositionEvent | null {
  const [event, setEvent] = useState<CompositionEvent | null>(null);

  useEffect(() => {
    if (!compositionId) {
      setEvent(null);
      return;
    }
    const es = new EventSource(`/api/compositions/${compositionId}/events`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as CompositionEvent;
        setEvent(data);
        if (data.stage === 'completed' || data.stage === 'failed') {
          es.close();
        }
      } catch (err) {
        console.error('[useCompositionEvents] parse error', err);
      }
    };

    es.onerror = () => {
      // Browser auto-retries; close after first failure to avoid runaway.
      es.close();
    };

    return () => es.close();
  }, [compositionId]);

  return event;
}
