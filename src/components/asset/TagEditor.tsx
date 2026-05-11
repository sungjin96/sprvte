'use client';

import { useState, KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

function TagEditor({ tags, onChange, className }: TagEditorProps) {
  const t = useTranslations('assets.tagEditor');
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    onChange([...tags, tag]);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div
      className={cn(
        'flex flex-wrap gap-1.5 items-center min-h-[36px] px-2.5 py-1.5 rounded-lg border border-[var(--border)]',
        'bg-[var(--g1)] focus-within:border-[var(--border-hi)] transition-colors',
        className,
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--g3)] text-[11px] font-mono text-[var(--text-2)]"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-[var(--text-3)] hover:text-red-400 transition-colors"
          >
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
              <path d="M1 1l6 6M7 1L1 7" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length ? '' : t('placeholder')}
        className="flex-1 min-w-[80px] bg-transparent text-[12px] text-[var(--text)] placeholder:text-[var(--text-3)] outline-none"
      />
    </div>
  );
}

export { TagEditor };
