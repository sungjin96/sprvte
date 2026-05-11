'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface GuideAutoPromptProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onRegenerate?: () => Promise<void>;
  loading?: boolean;
  className?: string;
}

function GuideAutoPrompt({ prompt, onPromptChange, onRegenerate, loading, className }: GuideAutoPromptProps) {
  const t = useTranslations('guide');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const busy = loading || isRegenerating;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">
            {t('autoPrompt')}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--neon-dim)] text-[var(--neon)] border border-[rgba(0,229,160,0.2)]">
            AI
          </span>
        </div>
        {onRegenerate && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={busy}
            className="h-6 px-2 text-[11px] gap-1"
          >
            {busy ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M2.5 8a5.5 5.5 0 1 1 1.3 3.5" strokeLinecap="round" />
                <path d="M2.5 11.5V8h3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {t('regenerate')}
          </Button>
        )}
      </div>

      {/* Prompt textarea */}
      <div className="relative">
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={4}
          placeholder={t('autoPromptPlaceholder')}
          className="font-mono text-[12px] leading-relaxed"
          disabled={busy}
        />
        {busy && (
          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[11px] text-[var(--text-3)] leading-snug">
        {t('autoPromptManualNote')}
      </p>
    </div>
  );
}

export { GuideAutoPrompt };
