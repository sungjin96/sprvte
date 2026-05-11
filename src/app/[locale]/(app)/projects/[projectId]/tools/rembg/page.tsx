'use client';

import { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent, TouchEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp'];
const CREDIT_COST = 2;

type Stage = 'idle' | 'processing' | 'result' | 'error';

// Mock entity list (until DB wired)
const MOCK_ENTITIES = [
  { id: 'e1', name: 'Warrior Alice' },
  { id: 'e2', name: 'Mage Zephyr' },
  { id: 'e3', name: 'Dark Forest' },
  { id: 'e4', name: 'Flame Sword' },
];

export default function RembgPage() {
  const t = useTranslations('rembg');

  const [stage, setStage] = useState<Stage>('idle');
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [sliderX, setSliderX] = useState(50);
  const compareRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [showRefMenu, setShowRefMenu] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedRefType, setSelectedRefType] = useState<'front' | 'side' | 'back' | 'style'>('front');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_BYTES) return t('errFileTooLarge');
    if (!ALLOWED.includes(file.type)) return t('errWrongFormat');
    return null;
  };

  const handleFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      setErrorMsg(err);
      setStage('error');
      return;
    }

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setStage('processing');
    setProgress(0);

    // Mock processing — real implementation calls /api/rembg
    let p = 0;
    const interval = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) {
        clearInterval(interval);
        setProgress(100);
        // Mock result: same image (in real impl this is the rembg output)
        setResultUrl(url);
        setStage('result');
        setSliderX(50);
      } else {
        setProgress(p);
      }
    }, 200);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(null);
    setResultUrl(null);
    setProgress(0);
    setErrorMsg(null);
    setStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Slider drag
  const updateSlider = (clientX: number) => {
    if (!compareRef.current) return;
    const rect = compareRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.max(0, Math.min(100, x)));
  };

  const onSliderMouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    dragging.current = true;
  };

  useEffect(() => {
    const onMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!dragging.current) return;
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      if (clientX != null) updateSlider(clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 z-10 px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]"
        style={{ WebkitBackdropFilter: 'blur(16px) saturate(180%)' }}
      >
        <div className="flex items-baseline justify-between">
          <h1 className="text-[16px] font-semibold text-[var(--text)]">
            {t('title')}
            {stage === 'processing' && (
              <span className="ml-2 text-[12px] text-[var(--text-3)] font-mono">
                — {t('processing')}
              </span>
            )}
            {stage === 'result' && (
              <span className="ml-2 text-[12px] text-[var(--neon)] font-mono">
                — {t('complete')}
              </span>
            )}
          </h1>
          <span className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-[0.04em]">
            {t('creditCost', { n: CREDIT_COST })}
          </span>
        </div>
        <p className="text-[12px] text-[var(--text-3)] mt-0.5">{t('subtitle')}</p>
      </div>

      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* STAGE: idle */}
        {stage === 'idle' && (
          <>
            <div
              onDragEnter={onDragEnter}
              onDragOver={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'rounded-[14px] border-2 border-dashed py-16 px-6',
                'flex flex-col items-center justify-center gap-3 cursor-pointer',
                'transition-all duration-[160ms]',
                dragOver
                  ? 'border-[var(--neon)] bg-[var(--neon-dim)]'
                  : 'border-[var(--border-hi)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(0,229,160,0.4)] hover:bg-[rgba(0,229,160,0.02)]',
              )}
            >
              <div className={cn(
                'w-16 h-16 transition-colors duration-[160ms]',
                dragOver ? 'text-[var(--neon)]' : 'text-[var(--text-2)]',
              )}>
                <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                  <path d="M16 44V18a4 4 0 0 1 4-4h17l11 11v19a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4z" />
                  <path d="M37 14v11h11" />
                  <path d="M32 36V24M27 29l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-[14px] text-[var(--text)] text-center">{t('dropZoneTitle')}</p>
              <p className="text-[12px] text-[var(--text-3)] font-mono">{t('dropZoneFormats')}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="mt-2 px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
              >
                {t('selectFile')}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onFileInput}
              className="hidden"
            />
          </>
        )}

        {/* STAGE: processing */}
        {stage === 'processing' && originalUrl && (
          <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                  {t('originalLabel')}
                </p>
                <div className="aspect-square rounded-[10px] bg-[var(--g1)] border border-[var(--border)] overflow-hidden">
                  <img src={originalUrl} alt="original" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                  {t('resultLabel')}
                </p>
                <div className="aspect-square rounded-[10px] bg-[var(--g1)] border border-[var(--border)] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--border-hi)] border-t-[var(--neon)] animate-spin" />
                  <span className="font-mono text-[11px] text-[var(--text-3)]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-1 rounded-full bg-[var(--g1)] overflow-hidden">
                <div
                  className="h-full bg-[var(--neon)] transition-all duration-[160ms]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={reset}
                  className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STAGE: result */}
        {stage === 'result' && originalUrl && resultUrl && (
          <div>
            <div className="rounded-[14px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden">
              <div
                ref={compareRef}
                className="relative w-full bg-[var(--g1)] select-none"
                style={{ aspectRatio: '16 / 10' }}
              >
                {/* Result (transparent — checkerboard background) */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)',
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                  }}
                >
                  <img src={resultUrl} alt="result" className="w-full h-full object-contain" />
                </div>

                {/* Original (clipped from left) */}
                <div
                  className="absolute inset-0"
                  style={{ clipPath: `inset(0 ${100 - sliderX}% 0 0)` }}
                >
                  <img src={originalUrl} alt="original" className="w-full h-full object-contain" />
                </div>

                {/* Slider handle */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[var(--neon)] cursor-ew-resize"
                  style={{
                    left: `${sliderX}%`,
                    transform: 'translateX(-1px)',
                    boxShadow: '0 0 8px var(--neon-glow)',
                  }}
                  onMouseDown={onSliderMouseDown}
                  onTouchStart={onSliderMouseDown}
                >
                  <div
                    className="absolute top-1/2 left-1/2 w-[24px] h-[24px] rounded-full bg-[var(--neon)] border-2 border-black flex items-center justify-center"
                    style={{ transform: 'translate(-50%, -50%)' }}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="#000" strokeWidth="2" className="w-3 h-3">
                      <path d="M5 5l-3 3 3 3M11 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                {/* Labels */}
                <span className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-[0.08em] text-white px-2 py-1 rounded-[4px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px]">
                  {t('originalLabel')}
                </span>
                <span className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--neon)] px-2 py-1 rounded-[4px] bg-[rgba(0,0,0,0.7)] backdrop-blur-[8px]">
                  {t('resultLabel')}
                </span>
              </div>
            </div>

            <p className="mt-3 font-mono text-[11px] text-[var(--text-3)]">
              {t('processingTime', { sec: '3.2' })} · {t('creditsUsed', { n: CREDIT_COST })}
            </p>

            {/* Action bar */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] font-semibold text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 hover:shadow-[0_0_28px_var(--neon-glow)] transition-all duration-[120ms]"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                  <path d="M7 1v9M3.5 6.5L7 10l3.5-3.5M2 12h10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('downloadPng')}
              </button>

              {/* Add as reference dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRefMenu((s) => !s)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
                >
                  {t('addAsReference')}
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className={cn('w-3 h-3 transition-transform duration-[120ms]', showRefMenu && 'rotate-180')}>
                    <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {showRefMenu && (
                  <div className="absolute top-full left-0 mt-1 w-[280px] z-20 rounded-[10px] border border-[var(--border-hi)] bg-[rgba(12,12,18,0.97)] backdrop-blur-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                      {t('selectEntity')}
                    </p>
                    <div className="max-h-[160px] overflow-y-auto mb-3">
                      {MOCK_ENTITIES.map((ent) => (
                        <button
                          key={ent.id}
                          type="button"
                          onClick={() => setSelectedEntity(ent.id)}
                          className={cn(
                            'w-full text-left px-2 py-1.5 rounded-[6px] text-[13px] transition-colors duration-[100ms]',
                            selectedEntity === ent.id
                              ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
                              : 'text-[var(--text-2)] hover:bg-[var(--g1)] hover:text-[var(--text)]',
                          )}
                        >
                          {ent.name}
                        </button>
                      ))}
                    </div>

                    <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] mb-2">
                      {t('selectRefType')}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(['front', 'side', 'back', 'style'] as const).map((type) => {
                        const labels = {
                          front: t('refTypeFront'),
                          side: t('refTypeSide'),
                          back: t('refTypeBack'),
                          style: t('refTypeStyle'),
                        };
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedRefType(type)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all duration-[100ms]',
                              selectedRefType === type
                                ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.3)]'
                                : 'bg-transparent text-[var(--text-3)] border-[var(--border)] hover:border-[var(--border-hi)] hover:text-[var(--text-2)]',
                            )}
                          >
                            {labels[type]}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedEntity}
                      onClick={() => { setShowRefMenu(false); /* TODO: persist ref */ }}
                      className={cn(
                        'w-full px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-[120ms]',
                        selectedEntity
                          ? 'bg-[var(--neon)] text-black shadow-[0_0_12px_var(--neon-glow)] hover:brightness-110'
                          : 'bg-[var(--g1)] text-[var(--text-3)] cursor-not-allowed',
                      )}
                    >
                      {t('save')}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={reset}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
              >
                {t('processAnother')}
              </button>
            </div>
          </div>
        )}

        {/* STAGE: error */}
        {stage === 'error' && (
          <div className="rounded-[14px] border border-[rgba(255,60,60,0.2)] bg-[rgba(255,60,60,0.06)] p-6 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 text-[rgba(255,100,100,0.9)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 7v5M12 16v.01" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[14px] text-[var(--text)]">{errorMsg}</p>
            <button
              type="button"
              onClick={reset}
              className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms]"
            >
              {t('retry')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
