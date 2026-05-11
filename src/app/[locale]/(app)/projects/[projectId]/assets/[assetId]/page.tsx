'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { BgRemovalButton } from '@/components/asset/BgRemovalButton';
import { VariationButton } from '@/components/asset/VariationButton';
import { ExportButton } from '@/components/asset/ExportButton';
import { TagEditor } from '@/components/asset/TagEditor';
import { VersionHistory, AssetVersion } from '@/components/asset/VersionHistory';
import { AnimationPreview } from '@/components/asset/AnimationPreview';
import { AudioPlayer } from '@/components/asset/AudioPlayer';
import { PaletteSwapPanel } from '@/components/asset/PaletteSwapPanel';
import { PixelSizeSelector } from '@/components/asset/PixelSizeSelector';
import { PixelizeCompareDrawer } from '@/components/asset/PixelizeCompareDrawer';
import { Button } from '@/components/ui/Button';
import { Asset, ASSET_TYPE_LABELS, AUDIO_ASSET_TYPES } from '@/types/asset';
import type { OutputSize } from '@/components/asset/OutputSizeSelector';

// ── Mock ──────────────────────────────────────────────────────────────────────
const MOCK_ASSET: Asset = {
  id: 'ast-1',
  projectId: 'proj-1',
  entityId: 'ent-1',
  name: 'Alice Idle',
  type: 'character',
  status: 'completed',
  fileUrl: 'https://picsum.photos/seed/alice1/512/512',
  createdAt: '2026-04-25T10:00:00Z',
  updatedAt: '2026-04-25T10:05:00Z',
};

const MOCK_VERSIONS: AssetVersion[] = [
  { id: 'ast-1', fileUrl: 'https://picsum.photos/seed/alice1/256/256', createdAt: '2026-04-25T10:00:00Z', label: 'original', isCurrent: true },
  { id: 'ast-0b', fileUrl: 'https://picsum.photos/seed/alice0/256/256', createdAt: '2026-04-24T09:00:00Z', label: 'variation' },
];

const MOCK_TAGS = ['warrior', 'character', 'silver-armor'];

const STATUS_MAP: Record<string, 'done' | 'processing' | 'pending' | 'error'> = {
  completed: 'done',
  processing: 'processing',
  pending: 'pending',
  failed: 'error',
};

interface AssetDetailPageProps {
  params: Promise<{ projectId: string; assetId: string }>;
}

export default function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { projectId, assetId } = use(params);
  const [asset] = useState<Asset>(MOCK_ASSET);
  const [tags, setTags] = useState<string[]>(MOCK_TAGS);
  const [pixelSize, setPixelSize] = useState(64);
  const [compareOpen, setCompareOpen] = useState(false);

  const isAudio = AUDIO_ASSET_TYPES.includes(asset.type);
  const isSpriteSheet = asset.type === 'sprite_sheet';
  const badgeStatus = STATUS_MAP[asset.status] ?? 'pending';

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[rgba(8,8,12,0.85)] backdrop-blur-[16px] [backdrop-saturate:180%]">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/assets`}
            className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[16px] font-semibold text-[var(--text)]">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-[var(--text-3)]">{ASSET_TYPE_LABELS[asset.type]}</span>
              <Badge status={badgeStatus} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <BgRemovalButton assetId={assetId} />
          <VariationButton assetId={assetId} />
          {/* Pixelize: zero AI cost, primary discoverability */}
          {!isAudio && asset.fileUrl && (
            <Button
              variant="ghost"
              onClick={() => setCompareOpen(true)}
              className="gap-1.5 border border-[rgba(0,229,160,0.35)] text-[var(--neon)] hover:bg-[var(--neon-dim)]"
              title="픽셀 변환 (비교) — 무료"
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <rect x="2" y="2" width="4" height="4" rx="0.5" />
                <rect x="8" y="2" width="4" height="4" rx="0.5" />
                <rect x="2" y="8" width="4" height="4" rx="0.5" />
                <rect x="8" y="8" width="4" height="4" rx="0.5" />
              </svg>
              픽셀 변환
            </Button>
          )}
          <ExportButton assetId={assetId} projectId={projectId} />
          {isSpriteSheet && (
            <Link href={`/projects/${projectId}/assets/${assetId}/animation`}>
              <Button variant="primary" className="gap-1.5">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <rect x="1" y="3" width="3" height="8" rx="0.5" />
                  <rect x="5.5" y="3" width="3" height="8" rx="0.5" />
                  <rect x="10" y="3" width="3" height="8" rx="0.5" />
                </svg>
                Edit Frames
              </Button>
            </Link>
          )}
          {!isAudio && !isSpriteSheet && (
            <Link href={`/projects/${projectId}/assets/${assetId}/layers`}>
              <Button variant="primary" className="gap-1.5">
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M7 1 1 4.5l6 3.5 6-3.5L7 1Z" />
                  <path d="M1 8l6 3.5L13 8" />
                </svg>
                Edit Layers
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-0 min-h-[calc(100vh-60px)]">
        {/* Preview */}
        <div className="flex-1 flex items-start justify-center p-8">
          <div className="w-full max-w-[480px] space-y-4">
            {isAudio ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--g1)] p-6">
                <AudioPlayer
                  src={asset.fileUrl ?? ''}
                  onTrimChange={(s, e) => console.log('Trim:', s, e)}
                />
              </div>
            ) : isSpriteSheet ? (
              <AnimationPreview
                frames={[
                  'https://picsum.photos/seed/f1/64/64',
                  'https://picsum.photos/seed/f2/64/64',
                  'https://picsum.photos/seed/f3/64/64',
                  'https://picsum.photos/seed/f4/64/64',
                ]}
              />
            ) : (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--g1)]">
                {asset.fileUrl && (
                  <Image
                    src={asset.fileUrl}
                    alt={asset.name}
                    fill
                    className="object-contain p-4"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[300px] shrink-0 border-l border-[var(--border)] overflow-y-auto">
          <Tabs defaultValue="info" className="flex flex-col">
            <div className="px-4 pt-4 border-b border-[var(--border)]">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </div>

            {/* Info tab */}
            <TabsContent value="info" className="p-4 space-y-4">
              <div className="space-y-2">
                {[
                  ['Type', ASSET_TYPE_LABELS[asset.type]],
                  ['Status', asset.status],
                  ['Created', asset.createdAt.slice(0, 16).replace('T', ' ')],
                  ['Asset ID', asset.id],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wide">{label}</span>
                    <span className="text-[12px] text-[var(--text-2)] text-right font-mono">{val}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wide mb-1.5">Tags</p>
                <TagEditor tags={tags} onChange={setTags} />
              </div>
            </TabsContent>

            {/* Edit tab */}
            <TabsContent value="edit" className="p-4 space-y-5">
              <div>
                <p className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wide mb-2">Pixel Art Convert</p>
                <Button
                  variant="primary"
                  className="w-full text-[12px] gap-1.5"
                  onClick={() => setCompareOpen(true)}
                  disabled={!asset.fileUrl}
                >
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <rect x="2" y="2" width="4" height="4" rx="0.5" />
                    <rect x="8" y="2" width="4" height="4" rx="0.5" />
                    <rect x="2" y="8" width="4" height="4" rx="0.5" />
                    <rect x="8" y="8" width="4" height="4" rx="0.5" />
                  </svg>
                  픽셀 변환 (비교)
                </Button>
                <p className="mt-2 text-[10px] font-mono text-[var(--text-3)] opacity-70">
                  AI 비용 없음 · 모든 사이즈 한 번에 비교
                </p>
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <PaletteSwapPanel assetId={assetId} />
              </div>
            </TabsContent>

            {/* History tab */}
            <TabsContent value="history" className="p-4">
              <VersionHistory versions={MOCK_VERSIONS} onRollback={(id) => console.log('Rollback to:', id)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Pixelize compare drawer */}
      <PixelizeCompareDrawer
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        sourceUrl={asset.fileUrl ?? ''}
        assetName={asset.name}
        onSelect={(size, options, aiDataUrl) => {
          console.log('[pixelize] save:', { size, options, aiUsed: !!aiDataUrl, assetId: asset.id });
          // Mock: real impl POSTs to /api/pixelate (with options) → new Asset version.
          // If aiDataUrl present, that's the AI-generated bytes — upload directly.
        }}
      />
    </div>
  );
}
