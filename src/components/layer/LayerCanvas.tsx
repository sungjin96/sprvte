'use client';

import { useEffect, useRef } from 'react';
import { LayerData, BlendMode } from '@/types/asset';

export interface LayerItem {
  id: string;
  fileUrl: string;
  name: string;
  layerData: LayerData;
}

const BLEND_MODE_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  add: 'lighter',
  'soft-light': 'soft-light',
};

interface LayerCanvasProps {
  layers: LayerItem[];
  selectedLayerId?: string | null;
  canvasSize?: number; // square px, default 512
}

function LayerCanvas({ layers, selectedLayerId, canvasSize = 512 }: LayerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load all visible layer images (cached)
    const visibleLayers = layers
      .filter((l) => l.layerData.visible && l.fileUrl)
      .sort((a, b) => a.layerData.zIndex - b.layerData.zIndex);

    if (!visibleLayers.length) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let isCancelled = false;

    const loadImage = (url: string): Promise<HTMLImageElement> => {
      const cached = imageCache.current.get(url);
      if (cached) return Promise.resolve(cached);
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { imageCache.current.set(url, img); resolve(img); };
        img.onerror = reject;
        img.src = url;
      });
    };

    Promise.all(visibleLayers.map((l) => loadImage(l.fileUrl))).then((images) => {
      if (isCancelled) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      images.forEach((img, i) => {
        const layer = visibleLayers[i];
        ctx.save();
        ctx.globalAlpha = layer.layerData.opacity / 100;
        ctx.globalCompositeOperation = BLEND_MODE_MAP[layer.layerData.blendMode] ?? 'source-over';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      });

      // Draw selected layer highlight border
      if (selectedLayerId) {
        const selectedIdx = visibleLayers.findIndex((l) => l.id === selectedLayerId);
        if (selectedIdx !== -1) {
          ctx.save();
          ctx.strokeStyle = 'rgba(0,229,160,0.7)';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
          ctx.restore();
        }
      }
    });

    return () => { isCancelled = true; };
  }, [layers, selectedLayerId]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--g1)]">
      {/* Checkerboard for transparency */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        }}
      />
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="relative w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}

export { LayerCanvas };
