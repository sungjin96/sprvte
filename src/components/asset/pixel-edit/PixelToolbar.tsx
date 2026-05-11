'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/Slider';

export type Tool = 'pencil' | 'eraser' | 'eyedropper';

interface PixelToolbarProps {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  /** Brief mint flash on undo/redo trigger — driven by parent. */
  flashUndo?: boolean;
  flashRedo?: boolean;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 32;

export function PixelToolbar({
  tool,
  onToolChange,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  flashUndo,
  flashRedo,
}: PixelToolbarProps) {
  const t = useTranslations('pixelEditor');

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--g0)]">
      {/* Tools */}
      <div className="flex items-center gap-1">
        <ToolButton
          icon={<PencilIcon />}
          label={t('tool.pencil')}
          shortcut="P"
          active={tool === 'pencil'}
          onClick={() => onToolChange('pencil')}
        />
        <ToolButton
          icon={<EraserIcon />}
          label={t('tool.eraser')}
          shortcut="E"
          active={tool === 'eraser'}
          onClick={() => onToolChange('eraser')}
        />
        <ToolButton
          icon={<EyedropperIcon />}
          label={t('tool.eyedropper')}
          shortcut="I"
          active={tool === 'eyedropper'}
          onClick={() => onToolChange('eyedropper')}
        />
      </div>

      <Divider />

      {/* Undo / Redo */}
      <div className="flex items-center gap-1">
        <ToolButton
          icon={<UndoIcon />}
          label={t('undo')}
          shortcut="⌘Z"
          disabled={!canUndo}
          onClick={onUndo}
          flash={flashUndo}
        />
        <ToolButton
          icon={<RedoIcon />}
          label={t('redo')}
          shortcut="⌘⇧Z"
          disabled={!canRedo}
          onClick={onRedo}
          flash={flashRedo}
        />
      </div>

      <Divider />

      {/* Zoom */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-3)]">
          {t('zoom')}
        </span>
        <div className="flex-1 max-w-[200px]">
          <Slider
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.1}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
          />
        </div>
        <span className="font-mono text-[11px] text-[var(--neon)] w-12 text-right">
          {Number.isInteger(zoom) ? zoom : zoom.toFixed(1)}×
        </span>
      </div>
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────────────
function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
  flash,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  flash?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'group flex items-center gap-1.5 h-8 px-2 rounded-md border transition-all duration-[120ms]',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--neon)]',
        active && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[var(--neon)] shadow-[0_0_8px_var(--neon-glow)]',
        !active && !disabled && 'border-transparent text-[var(--text-2)] hover:bg-[var(--g2)] hover:text-[var(--text)]',
        disabled && 'border-transparent text-[var(--text-3)] opacity-40 cursor-not-allowed',
        flash && 'animate-[pulse_0.3s_ease-out] bg-[var(--neon-dim)] text-[var(--neon)]',
      )}
    >
      <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
      {shortcut && (
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] opacity-70">
          {shortcut}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-[var(--border)]" />;
}

// ── Icons (SVG, mint stroke) ─────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M2 12L4 11L11 4L10 3L3 10L2 12Z" strokeLinejoin="round" />
      <path d="M9 4L10 5" strokeLinecap="round" />
    </svg>
  );
}
function EraserIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M3 11L8 11L12 7L8 3L3 8L3 11Z" strokeLinejoin="round" />
      <path d="M5 11L8 8" strokeLinecap="round" />
    </svg>
  );
}
function EyedropperIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M9 2L12 5L7 10L4 10L4 7L9 2Z" strokeLinejoin="round" />
      <path d="M2 12L4 10" strokeLinecap="round" />
    </svg>
  );
}
function UndoIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M3 7L7 3M3 7L7 11M3 7H10C11 7 12 8 12 9.5V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RedoIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-full h-full">
      <path d="M11 7L7 3M11 7L7 11M11 7H4C3 7 2 8 2 9.5V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
