'use client';

import type { OutputSize } from '@/components/asset/OutputSizeSelector';

/**
 * Mock AI pixelation client.
 *
 * Real implementation will POST to `/api/pixelate` with `provider: 'replicate'`
 * which routes to Replicate `astropulse/pixelator`. For v5 mock, we hit the
 * same endpoint with "AI-like" parameter overrides (smoother, dithered) so
 * the user sees a visibly different result vs sharp algorithm output.
 *
 * Cost contract:
 *   Real Replicate cost ≈ $0.005 per image. We charge 5 credits per call.
 *   Cache hits cost 0 — caller controls cache via key.
 */

export const AI_PIXELATE_COST = 5;

const AI_OPTION_OVERRIDES = {
  paletteSize: 24,
  bilateral: true,
  dithering: 'floyd-steinberg' as const,
  maxSaturation: 0.95,
  // softer contrast — mimics AI's "painterly" output
  // (real Replicate model has its own learned bias)
};

export async function fetchAIPixelate(
  sourceUrl: string,
  size: Exclude<OutputSize, 'regular'>,
): Promise<string> {
  // Simulate Replicate call latency. Real Replicate astropulse: ~3-8s.
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 800));

  const res = await fetch('/api/pixelate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: sourceUrl,
      size,
      ...AI_OPTION_OVERRIDES,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error ?? `pixelate failed (${res.status})`);
  }
  const blob = await res.blob();
  // Convert to dataURL for in-memory cache (no Storage in mock phase)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function aiCacheKey(sourceUrl: string, size: Exclude<OutputSize, 'regular'>): string {
  // D-Q1.a — key on (source, size) only. Slider option changes don't
  // re-charge AI; caching is generous on purpose.
  return `${sourceUrl}::${size}`;
}
