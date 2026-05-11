'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

function ColorSwatch({
  color,
  selected,
  onRemove,
  onClick,
  size = 'md',
  className,
}: ColorSwatchProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative rounded-md border cursor-pointer transition-all duration-[120ms] shrink-0',
        size === 'md' && 'w-8 h-8',
        size === 'sm' && 'w-6 h-6',
        selected
          ? 'border-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]'
          : 'border-[var(--border)] hover:border-[var(--border-hi)]',
        className,
      )}
      style={{ backgroundColor: color }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={color}
    >
      {onRemove && hovered && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black border border-[var(--border)] text-[var(--text-3)] hover:text-white text-[9px] flex items-center justify-center leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}

// Color palette editor
interface ColorPaletteEditorProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  max?: number;
  className?: string;
}

function ColorPaletteEditor({ colors, onChange, max = 8, className }: ColorPaletteEditorProps) {
  const t = useTranslations('common');
  const [inputColor, setInputColor] = useState('#00E5A0');

  const add = () => {
    if (colors.length < max && !colors.includes(inputColor)) {
      onChange([...colors, inputColor]);
    }
  };

  const remove = (i: number) => {
    onChange(colors.filter((_, idx) => idx !== i));
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {colors.map((c, i) => (
        <ColorSwatch key={c} color={c} onRemove={() => remove(i)} />
      ))}
      {colors.length < max && (
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={inputColor}
            onChange={(e) => setInputColor(e.target.value)}
            className="w-8 h-8 rounded-md border border-[var(--border)] cursor-pointer bg-transparent p-0.5"
          />
          <button
            type="button"
            onClick={add}
            className="h-8 px-2 rounded-md text-[11px] font-mono text-[var(--text-3)] border border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all"
          >
            {t('addColor')}
          </button>
        </div>
      )}
    </div>
  );
}

export { ColorSwatch, ColorPaletteEditor };
