'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface FrameReorderProps {
  frames: string[]; // URLs
  onChange: (newOrder: string[]) => void;
}

function FrameReorder({ frames, onChange }: FrameReorderProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }
    const newFrames = [...frames];
    const [moved] = newFrames.splice(dragIndex, 1);
    newFrames.splice(dropIndex, 0, moved);
    onChange(newFrames);
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--text-3)]">
          Frame Order — {frames.length} frames
        </span>
        <p className="text-[11px] text-[var(--text-3)]">Drag to reorder</p>
      </div>

      <div ref={ghostRef} className="flex flex-wrap gap-2">
        {frames.map((url, i) => (
          <div
            key={`${url}-${i}`}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative w-16 h-16 rounded-lg border overflow-hidden cursor-grab active:cursor-grabbing',
              'select-none transition-all',
              dragIndex === i && 'opacity-30 scale-95',
              overIndex === i && dragIndex !== i && 'border-[var(--neon)] ring-1 ring-[var(--neon)]',
              dragIndex !== i && overIndex !== i && 'border-[var(--border)]',
            )}
          >
            <Image src={url} alt={`Frame ${i + 1}`} fill className="object-cover pointer-events-none" />
            {/* Frame number */}
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-white/60">
              {i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { FrameReorder };
