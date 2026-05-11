'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/Slider';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AnimationPreviewProps {
  frames: string[]; // image URLs
  defaultFps?: number;
  className?: string;
}

function AnimationPreview({ frames, defaultFps = 12, className }: AnimationPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState(defaultFps);
  const [pingPong, setPingPong] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all frames
  useEffect(() => {
    if (!frames.length) return;
    setLoading(true);
    Promise.all(
      frames.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          }),
      ),
    )
      .then((imgs) => { setLoadedImages(imgs); setLoading(false); })
      .catch(() => setLoading(false));
  }, [frames]);

  // Draw current frame
  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      const img = loadedImages[index];
      if (!canvas || !img) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    },
    [loadedImages],
  );

  // Animation loop
  useEffect(() => {
    if (!playing || !loadedImages.length) return;
    const total = loadedImages.length;
    let frame = currentFrame;
    let direction = 1;

    const interval = setInterval(() => {
      drawFrame(frame);
      setCurrentFrame(frame);

      if (pingPong) {
        frame += direction;
        if (frame >= total - 1) direction = -1;
        if (frame <= 0) direction = 1;
      } else {
        frame = (frame + 1) % total;
      }
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [playing, fps, pingPong, loadedImages, drawFrame, currentFrame]);

  // Draw initial frame when paused
  useEffect(() => {
    if (!playing) drawFrame(currentFrame);
  }, [playing, currentFrame, drawFrame]);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-40', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!frames.length) {
    return (
      <div className={cn('flex items-center justify-center h-40 text-[var(--text-3)] text-sm', className)}>
        No frames
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Canvas */}
      <div className="relative flex items-center justify-center bg-[var(--g1)] rounded-xl overflow-hidden border border-[var(--border)] min-h-[160px]">
        {/* Checkerboard background for transparency */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
          }}
        />
        <canvas
          ref={canvasRef}
          className="relative max-w-full max-h-[240px] object-contain pixelated"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Frame counter */}
        <span className="absolute bottom-2 right-2 text-[10px] font-mono text-white/50 bg-black/40 px-1.5 py-0.5 rounded">
          {currentFrame + 1} / {frames.length}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--g2)] hover:bg-[var(--g3)] text-[var(--text)] transition-colors"
        >
          {playing ? (
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <rect x="2" y="1" width="4" height="12" rx="1" />
              <rect x="8" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
              <path d="M3 1.5l9 5.5-9 5.5V1.5z" />
            </svg>
          )}
        </button>

        {/* FPS slider */}
        <div className="flex-1">
          <Slider min={1} max={30} step={1} value={fps} onChange={setFps} label="FPS" unit=" fps" />
        </div>

        {/* Ping-pong toggle */}
        <button
          type="button"
          onClick={() => setPingPong((p) => !p)}
          title="Ping-pong mode"
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-lg border text-[10px] font-mono transition-all',
            pingPong
              ? 'border-[var(--neon)] bg-[var(--neon-dim)] text-[var(--neon)]'
              : 'border-[var(--border)] bg-[var(--g1)] text-[var(--text-3)] hover:border-[var(--border-hi)]',
          )}
        >
          ↔
        </button>
      </div>
    </div>
  );
}

export { AnimationPreview };
