'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AudioPlayerProps {
  src: string;
  trimStart?: number; // seconds
  trimEnd?: number;   // seconds
  onTrimChange?: (start: number, end: number) => void;
  className?: string;
}

function AudioPlayer({ src, trimStart = 0, trimEnd, onTrimChange, className }: AudioPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [localTrimStart, setLocalTrimStart] = useState(trimStart);
  const [localTrimEnd, setLocalTrimEnd] = useState<number | undefined>(trimEnd);
  const effectiveTrimEnd = localTrimEnd ?? duration;

  // Draw waveform via AnalyserNode
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLen = analyser.frequencyBinCount;
    const dataArr = new Uint8Array(bufferLen);
    analyser.getByteFrequencyData(dataArr);

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = (width / bufferLen) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLen; i++) {
      const barHeight = (dataArr[i] / 255) * height;
      ctx.fillStyle = `rgba(0,229,160,${0.5 + (dataArr[i] / 255) * 0.5})`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Init audio element
  useEffect(() => {
    const audio = new Audio(src);
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      if (!localTrimEnd) setLocalTrimEnd(audio.duration);
      setLoading(false);
    });

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => { setPlaying(false); });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const startContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaElementSource(audioRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    drawWaveform();
  }, [drawWaveform]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else {
      startContext();
      audio.currentTime = localTrimStart;
      audio.play();
      setPlaying(true);
      rafRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const handleTrimStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalTrimStart(v);
    onTrimChange?.(v, effectiveTrimEnd);
  };

  const handleTrimEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalTrimEnd(v);
    onTrimChange?.(localTrimStart, v);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center h-24', className)}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Waveform canvas */}
      <div className="relative h-16 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--g1)]">
        <canvas ref={canvasRef} className="w-full h-full" width={600} height={64} />
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
        {/* Trim range overlay */}
        {duration > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 bg-black/40"
              style={{ left: 0, width: `${(localTrimStart / duration) * 100}%` }}
            />
            <div
              className="absolute top-0 bottom-0 bg-black/40"
              style={{
                left: `${(effectiveTrimEnd / duration) * 100}%`,
                right: 0,
              }}
            />
          </>
        )}
      </div>

      {/* Transport */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--g2)] hover:bg-[var(--g3)] text-[var(--text)] transition-colors shrink-0"
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

        {/* Seek */}
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 rounded-full accent-[var(--neon)]"
        />
        <span className="text-[11px] font-mono text-[var(--text-3)] shrink-0">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>

      {/* Trim controls */}
      {onTrimChange && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-3)] w-16">Trim in</span>
            <input
              type="range"
              min={0}
              max={effectiveTrimEnd}
              step={0.1}
              value={localTrimStart}
              onChange={handleTrimStartChange}
              className="flex-1 h-1 rounded-full accent-[var(--neon)]"
            />
            <span className="text-[11px] font-mono text-[var(--text-3)] w-12 text-right">{fmt(localTrimStart)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--text-3)] w-16">Trim out</span>
            <input
              type="range"
              min={localTrimStart}
              max={duration}
              step={0.1}
              value={effectiveTrimEnd}
              onChange={handleTrimEndChange}
              className="flex-1 h-1 rounded-full accent-[var(--neon)]"
            />
            <span className="text-[11px] font-mono text-[var(--text-3)] w-12 text-right">{fmt(effectiveTrimEnd)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { AudioPlayer };
