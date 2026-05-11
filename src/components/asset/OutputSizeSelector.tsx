'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

/**
 * Unified size/pixelation selector.
 * 'regular' = no pixelation, full resolution
 * number = post-process pixelation to that target size (8~512)
 */
export type OutputSize = 'regular' | 8 | 16 | 32 | 64 | 128 | 256 | 512;

const PIXEL_OPTIONS: number[] = [8, 16, 32, 64, 128, 256, 512];

interface OutputSizeSelectorProps {
  value: OutputSize;
  onChange: (size: OutputSize) => void;
  /** Show as compact (smaller chips) */
  compact?: boolean;
}

export function OutputSizeSelector({ value, onChange, compact }: OutputSizeSelectorProps) {
  const t = useTranslations('outputSize');

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {/* Regular (no pixelation) */}
      <button
        type="button"
        onClick={() => onChange('regular')}
        className={cn(
          'rounded-lg border font-mono transition-all flex items-center gap-1.5',
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
          value === 'regular'
            ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
            : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
        )}
        title={t('regularHint')}
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3 h-3">
          <circle cx="6" cy="6" r="4" />
        </svg>
        {t('regular')}
      </button>

      {/* Visual divider */}
      <span className="font-mono text-[10px] text-[var(--text-3)] px-1 opacity-50">|</span>

      {/* Pixel sizes */}
      {PIXEL_OPTIONS.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size as OutputSize)}
          className={cn(
            'rounded-lg border font-mono transition-all',
            compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
            value === size
              ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
              : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
          )}
          title={`${size}×${size} ${t('pixelArt')}`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

/**
 * Live preview wrapper — applies CSS-based pixelation to children.
 * For UI demonstration. Server-side does proper palette quantization + NN.
 */
export function PixelationPreview({
  size,
  imageUrl,
  alt,
  className,
}: {
  size: OutputSize;
  imageUrl: string;
  alt: string;
  className?: string;
}) {
  if (size === 'regular') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={alt} className={className} />;
  }

  // CSS-based mock preview: scale-down then scale-up via image-rendering: pixelated
  // (Real server-side path uses palette quantization + NN downscale for clean output)
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={{
        imageRendering: 'pixelated',
        // Approximate effect: container should constrain visual size
      }}
    />
  );
}
