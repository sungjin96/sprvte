'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { rgbToHsl, hslToRgb } from '@/lib/image/colorspace';
import {
  rgbaToCss,
  rgbaToHex,
  colorsEqual,
  type PaletteColor,
} from '@/lib/pixel-edit/palette';

interface PalettePanelProps {
  palette: PaletteColor[];
  activeColor: PaletteColor;
  onSelect: (color: PaletteColor) => void;
  onAddToPalette: (color: PaletteColor) => void;
  onRemove?: (color: PaletteColor) => void;
}

export function PalettePanel({
  palette,
  activeColor,
  onSelect,
  onAddToPalette,
  onRemove,
}: PalettePanelProps) {
  const t = useTranslations('pixelEditor.palette');
  const [r, g, b] = activeColor;
  const initialHsl = rgbToHsl(r, g, b);
  const [h, setH] = useState(initialHsl.h);
  const [s, setS] = useState(initialHsl.s);
  const [l, setL] = useState(initialHsl.l);

  const updateFree = (nh: number, ns: number, nl: number) => {
    setH(nh); setS(ns); setL(nl);
    const { r, g, b } = hslToRgb(nh, ns, nl);
    onSelect([r, g, b, 255]);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[var(--g0)] border-r border-[var(--border)]">
      {/* Extracted palette */}
      <div className="p-3 border-b border-[var(--border)]">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
          {t('extracted')}
        </h3>
        {palette.length === 0 ? (
          <p className="font-mono text-[10px] text-[var(--text-3)] opacity-60">{t('empty')}</p>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {palette.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelect(color)}
                onContextMenu={(e) => {
                  if (!onRemove) return;
                  e.preventDefault();
                  onRemove(color);
                }}
                className={cn(
                  'aspect-square rounded-[3px] border transition-all duration-[120ms]',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon)]',
                  colorsEqual(color, activeColor)
                    ? 'border-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)] scale-105'
                    : 'border-[var(--border-hi)] hover:border-[var(--text-3)]',
                )}
                style={{ backgroundColor: rgbaToCss(color) }}
                title={`${rgbaToHex(color)} — ${t('rightClickRemove')}`}
                aria-label={rgbaToHex(color)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Free picker (HSL) */}
      <div className="p-3 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
          {t('free')}
        </h3>

        {/* Current colour preview */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md border border-[var(--border-hi)] shrink-0"
            style={{ backgroundColor: rgbaToCss(activeColor) }}
          />
          <div className="flex-1">
            <div className="font-mono text-[11px] text-[var(--neon)]">
              {rgbaToHex(activeColor)}
            </div>
            <div className="font-mono text-[9px] text-[var(--text-3)]">
              RGB {r}, {g}, {b}
            </div>
          </div>
        </div>

        {/* H S L sliders */}
        <SliderRow label={t('hue')} value={Math.round(h * 360)} max={360}
          onChange={(v) => updateFree(v / 360, s, l)} />
        <SliderRow label={t('sat')} value={Math.round(s * 100)} max={100} suffix="%"
          onChange={(v) => updateFree(h, v / 100, l)} />
        <SliderRow label={t('light')} value={Math.round(l * 100)} max={100} suffix="%"
          onChange={(v) => updateFree(h, s, v / 100)} />

        <Button
          variant="ghost"
          onClick={() => onAddToPalette(activeColor)}
          className="w-full text-[11px] mt-1"
        >
          + {t('addToPalette')}
        </Button>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10px] uppercase text-[var(--text-3)]">{label}</span>
        <span className="font-mono text-[10px] text-[var(--text-2)]">
          {value}{suffix}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
