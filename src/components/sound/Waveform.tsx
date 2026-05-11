'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  onReady?: (durationSec: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  className?: string;
}

/**
 * Wrapper around wavesurfer.js for audio waveform visualization.
 * Mounts a wavesurfer instance per audioUrl. Click to seek.
 */
export function Waveform({
  audioUrl,
  height = 80,
  waveColor = 'rgba(255,255,255,0.28)',
  progressColor = '#00E5A0',
  onReady,
  onPlayPause,
  className,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor,
      progressColor,
      cursorColor: '#00E5A0',
      cursorWidth: 1,
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      normalize: true,
      url: audioUrl,
    });

    wsRef.current = ws;

    ws.on('ready', () => {
      const dur = ws.getDuration();
      onReady?.(dur);
    });
    ws.on('play', () => onPlayPause?.(true));
    ws.on('pause', () => onPlayPause?.(false));
    ws.on('finish', () => onPlayPause?.(false));

    return () => {
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl, height, waveColor, progressColor, onReady, onPlayPause]);

  return <div ref={containerRef} className={className} />;
}
