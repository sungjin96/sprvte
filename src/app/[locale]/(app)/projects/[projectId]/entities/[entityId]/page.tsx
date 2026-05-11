'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ReferenceImageStrip, ReferenceSlotState } from '@/components/entity/ReferenceImageStrip';
import { GuideAutoPrompt } from '@/components/entity/GuideAutoPrompt';
import { LayerStack } from '@/components/entity/LayerStack';
import { LiveCanvas } from '@/components/entity/LiveCanvas';
import { LiveChat } from '@/components/entity/LiveChat';
import { StylePreviewPanel } from '@/components/entity/StylePreviewPanel';
import { Button } from '@/components/ui/Button';
import { ResizableSplit } from '@/components/layout/ResizableSplit';
import type { LiveLayer, LayerEditEntry, CompositionSnapshot } from '@/types/liveLayer';
import type { OutputSize } from '@/components/asset/OutputSizeSelector';
import { templateToMockLayers } from '@/lib/layers/templates';
import {
  moveLayerTo,
  moveLayerToRoot,
  deleteLayer,
  renameLayer,
  toggleLayerField,
  type DropPosition,
} from '@/lib/layers/operations';
import { PixelizeCompareDrawer } from '@/components/asset/PixelizeCompareDrawer';
import { CreateAnimationDialog } from '@/components/asset/CreateAnimationDialog';

// Mock entity registry. Real impl will fetch by entityId from DB.
// For pixelation test fixtures (ent-pixel-test-*), we use a single-layer
// flat composite pointing at /test-fixtures/<slug>.png so the canvas
// shows the user's reference art directly (drop your two character
// images in public/test-fixtures/ — see README there).
interface MockEntityInfo {
  id: string;
  name: string;
  category: 'character' | 'map' | 'item' | 'ui' | 'effect';
  mode: 'standard' | 'quality';
  /** When set, a single-layer mock is used with this image (no anatomical split). */
  flatImageUrl?: string;
}

const MOCK_ENTITY_REGISTRY: Record<string, MockEntityInfo> = {
  'ent-1':              { id: 'ent-1',              name: 'Warrior Alice',   category: 'character', mode: 'quality' },
  'ent-2':              { id: 'ent-2',              name: 'Mage Zephyr',     category: 'character', mode: 'standard' },
  'ent-3':              { id: 'ent-3',              name: 'Dark Forest',     category: 'map',       mode: 'quality' },
  'ent-4':              { id: 'ent-4',              name: 'Flame Sword',     category: 'item',      mode: 'standard' },
  'ent-pixel-test-1':   { id: 'ent-pixel-test-1',   name: 'Sprvte Sentinel', category: 'character', mode: 'quality',  flatImageUrl: '/test-fixtures/spryte-sentinel.png' },
  'ent-pixel-test-2':   { id: 'ent-pixel-test-2',   name: 'Sprvte Scout',    category: 'character', mode: 'standard', flatImageUrl: '/test-fixtures/spryte-scout.png' },
};

function resolveEntity(entityId: string): MockEntityInfo {
  return MOCK_ENTITY_REGISTRY[entityId] ?? {
    id: entityId, name: 'Unknown Entity', category: 'character', mode: 'standard',
  };
}

const MOCK_REFS: ReferenceSlotState[] = [
  { type: 'front', imageUrl: 'https://picsum.photos/seed/ref-front/256/256', status: 'ready' },
  { type: 'side', status: 'empty' },
  { type: 'back', status: 'empty' },
];

/**
 * Build the layer tree for a given entity.
 * - flatImageUrl set → single visible layer at that URL (test-fixtures path).
 * - else → anatomical category template (templateToMockLayers).
 *
 * Real backend will replace these with SAM2 worker output; structure stays
 * identical so PSD/Aseprite imports preserve grouping.
 */
function buildMockLayers(entity: MockEntityInfo): LiveLayer[] {
  if (entity.flatImageUrl) {
    return [{
      id: 'flat',
      name: entity.name,
      kind: 'body',
      parentId: null,
      order: 0,
      isGroup: false,
      visible: true,
      locked: false,
      status: 'idle',
      thumbUrl: entity.flatImageUrl,
      imageUrl: entity.flatImageUrl,
    }];
  }
  return templateToMockLayers(entity.category);
}

const MOCK_GALLERY: CompositionSnapshot[] = [
  { id: 'snap-1', name: 'Alice — Combat ready', thumbUrl: 'https://picsum.photos/seed/snap1/256/192', layers: [], createdAt: new Date(Date.now() - 86_400_000).toISOString() },
  { id: 'snap-2', name: 'Alice — Casual', thumbUrl: 'https://picsum.photos/seed/snap2/256/192', layers: [], createdAt: new Date(Date.now() - 172_800_000).toISOString() },
];

interface EntityWorkspacePageProps {
  params: Promise<{ projectId: string; entityId: string }>;
}

export default function EntityWorkspacePage({ params }: EntityWorkspacePageProps) {
  const { projectId, entityId } = use(params);
  const router = useRouter();
  const t = useTranslations('entityWorkspace');
  const tGuide = useTranslations('guide');
  const tCat = useTranslations('entities.category');
  const tMode = useTranslations('entities.mode');

  // Resolve mock entity from URL — different per entityId so navigating
  // between entities shows different content (was previously hardcoded).
  const entity = useMemo(() => resolveEntity(entityId), [entityId]);
  const initialLayers = useMemo(() => buildMockLayers(entity), [entity]);
  const initialFirstLeaf = useMemo(
    () => initialLayers.find((l) => !l.isGroup)?.id ?? null,
    [initialLayers],
  );

  // Live editor state — re-keyed when entity changes
  const [layers, setLayers] = useState<LiveLayer[]>(initialLayers);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(initialFirstLeaf);
  const [resplitting, setResplitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [history, setHistory] = useState<LayerEditEntry[]>([]);
  const [autoPrompt, setAutoPrompt] = useState(tGuide('defaultAutoPrompt'));
  const [gallery, setGallery] = useState<CompositionSnapshot[]>(MOCK_GALLERY);
  const [seedStage, setSeedStage] = useState<'ready' | 'idle' | 'generating' | 'splitting'>('ready');
  const [showLockInModal, setShowLockInModal] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [activeTab, setActiveTab] = useState('live');
  const [outputSize, setOutputSize] = useState<OutputSize>('regular');
  const [pixelizeOpen, setPixelizeOpen] = useState(false);
  const [createAnimOpen, setCreateAnimOpen] = useState(false);

  const isQuality = entity.mode === 'quality';
  const activeLayer = useMemo(() => layers.find((l) => l.id === activeLayerId) ?? null, [layers, activeLayerId]);
  const layerHistory = useMemo(
    () => activeLayerId ? history.filter((h) => h.layerId === activeLayerId) : [],
    [history, activeLayerId],
  );

  // Mock generators
  const handleSubmitPrompt = (prompt: string) => {
    if (!activeLayer) return;

    // Snapshot current image as previous BEFORE regenerating (single-step undo)
    const previousImageUrl = activeLayer.imageUrl ?? null;
    const previousThumbUrl = activeLayer.thumbUrl ?? null;

    setLayers((prev) => prev.map((l) => l.id === activeLayer.id ? { ...l, status: 'generating' } : l));

    setTimeout(() => {
      const ts = Date.now();
      const newImageUrl = `https://picsum.photos/seed/${activeLayer.id}-${ts}/512/384`;
      const newThumbUrl = `https://picsum.photos/seed/${activeLayer.id}-${ts}/64/64`;

      setLayers((prev) => prev.map((l) => l.id === activeLayer.id ? {
        ...l,
        status: 'idle',
        thumbUrl: newThumbUrl,
        imageUrl: newImageUrl,
        previousImageUrl,
        previousThumbUrl,
      } : l));
      setHistory((prev) => [
        {
          id: `h-${ts}`,
          layerId: activeLayer.id,
          prompt,
          resultThumbUrl: newThumbUrl,
          previousThumbUrl,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }, 2200);
  };

  const handleRevert = (entryId: string) => {
    // Find the entry → swap current ↔ previous on the layer.
    // Only the most-recent entry per layer is revertible (single-step undo).
    const entry = history.find((h) => h.id === entryId);
    if (!entry) return;
    const layer = layers.find((l) => l.id === entry.layerId);
    if (!layer || !layer.previousImageUrl) return;

    setLayers((prev) => prev.map((l) => l.id !== entry.layerId ? l : {
      ...l,
      imageUrl: layer.previousImageUrl ?? null,
      thumbUrl: layer.previousThumbUrl ?? null,
      // Clear previous so we can't double-undo
      previousImageUrl: null,
      previousThumbUrl: null,
    }));
    // Drop the reverted entry from history
    setHistory((prev) => prev.filter((h) => h.id !== entryId));
  };

  const handleImport = (file: File) => {
    setImporting(true);
    // Stub: real implementation parses .psd via ag-psd, .aseprite via aseprite-loader, .png with manifest sidecar
    // For UI mock, simulate processing then no-op
    console.log('[import] file:', file.name, file.size, 'bytes');
    setTimeout(() => {
      setImporting(false);
    }, 1500);
  };

  const handleStartCanvas = (config?: { model: string; outputSize: OutputSize }) => {
    console.log('[seed] config:', config);
    if (config) setOutputSize(config.outputSize);
    setSeedStage('generating');
    setTimeout(() => setSeedStage('splitting'), 1500);
    setTimeout(() => {
      setLayers(initialLayers);
      setActiveLayerId(initialFirstLeaf);
      setSeedStage('ready');
    }, 3500);
  };

  // ── Layer manipulation handlers ────────────────────────────────────────────
  const handleMoveTo = (sourceId: string, targetId: string, position: DropPosition) => {
    setLayers((curr) => moveLayerTo(curr, sourceId, targetId, position));
  };
  const handleMoveToRoot = (id: string) => {
    setLayers((curr) => moveLayerToRoot(curr, id));
  };
  const handleRename = (id: string, name: string) => {
    setLayers((curr) => renameLayer(curr, id, name));
  };
  const handleDeleteLayer = (id: string) => {
    setLayers((curr) => {
      const { layers: next, removedIds } = deleteLayer(curr, id);
      // Clear selection if it was deleted
      if (activeLayerId && removedIds.includes(activeLayerId)) {
        const fallback = next.find((l) => !l.isGroup)?.id ?? null;
        setActiveLayerId(fallback);
      }
      return next;
    });
  };
  const handleRegenerateLayer = (id: string) => {
    setLayers((curr) => curr.map((l) => l.id === id ? { ...l, status: 'generating' } : l));
    setTimeout(() => {
      const ts = Date.now();
      setLayers((curr) => curr.map((l) => l.id === id ? {
        ...l,
        status: 'idle',
        thumbUrl: `https://picsum.photos/seed/${id}-${ts}/64/64`,
        imageUrl: `https://picsum.photos/seed/${id}-${ts}/512/384`,
      } : l));
    }, 1800);
  };
  const handleResplit = () => {
    setResplitting(true);
    setTimeout(() => {
      // Mock: re-emit the category template (real backend would call SAM2 worker)
      const fresh = buildMockLayers(entity).map((l) => ({
        ...l,
        // Bust thumbnail URLs so the user sees a visual change
        thumbUrl: l.thumbUrl ? `${l.thumbUrl}?v=${Date.now()}` : l.thumbUrl,
        imageUrl: l.imageUrl ? `${l.imageUrl}?v=${Date.now()}` : l.imageUrl,
      }));
      setLayers(fresh);
      setActiveLayerId(fresh.find((l) => !l.isGroup)?.id ?? null);
      setResplitting(false);
    }, 2200);
  };

  const handleLockIn = () => {
    if (!snapshotName.trim()) return;
    setGallery((g) => [
      {
        id: `snap-${Date.now()}`,
        name: snapshotName.trim(),
        thumbUrl: `https://picsum.photos/seed/snap-${Date.now()}/256/192`,
        layers: [...layers],
        createdAt: new Date().toISOString(),
      },
      ...g,
    ]);
    setSnapshotName('');
    setShowLockInModal(false);
  };

  const left = (
    <div className="border-r border-[var(--border)] flex flex-col overflow-y-auto h-full">
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[15px] font-semibold text-[var(--text)]">{entity.name}</h2>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
            isQuality
              ? 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]'
              : 'bg-[var(--g2)] text-[var(--text-3)] border-[var(--border)]'
          }`}>
            {tMode(entity.mode)}
          </span>
        </div>
        <p className="text-[12px] text-[var(--text-3)]">{tCat(entity.category)}</p>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {isQuality && (
          <>
            <ReferenceImageStrip slots={MOCK_REFS} />
            <GuideAutoPrompt prompt={autoPrompt} onPromptChange={setAutoPrompt} />
            <Link href={`/projects/${projectId}/entities/${entityId}/guide`}>
              <Button variant="ghost" className="w-full text-[12px]">{tGuide('edit')}</Button>
            </Link>
          </>
        )}

        {layers.length > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <LayerStack
              layers={layers}
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
              onToggleVisibility={(id) =>
                setLayers((prev) => toggleLayerField(prev, id, 'visible'))
              }
              onToggleLock={(id) =>
                setLayers((prev) => toggleLayerField(prev, id, 'locked'))
              }
              onToggleExpand={(id) =>
                setLayers((prev) => toggleLayerField(prev, id, 'expanded'))
              }
              onRename={handleRename}
              onMoveTo={handleMoveTo}
              onMoveToRoot={handleMoveToRoot}
              onDeleteLayer={handleDeleteLayer}
              onRegenerateLayer={handleRegenerateLayer}
              onResplit={handleResplit}
              onImport={handleImport}
              importing={importing}
              resplitting={resplitting}
            />
          </div>
        )}
      </div>
    </div>
  );

  const right = (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
      <div className="px-5 pt-4 border-b border-[var(--border)] shrink-0">
        <TabsList>
          <TabsTrigger value="live">{t('tabLive')}</TabsTrigger>
          <TabsTrigger value="gallery">{t('tabGallery', { n: gallery.length })}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="live" className="flex-1 overflow-y-auto p-5 space-y-4">
        {layers.length === 0 || seedStage !== 'ready' ? (
          <StylePreviewPanel
            referenceImages={MOCK_REFS.map((r) => ({ type: r.type, imageUrl: r.imageUrl }))}
            guideSummary={[
              { label: '체형', value: '운동선수형, 슬림' },
              { label: '특징', value: '은발, 왼쪽 눈 흉터' },
              { label: '복장', value: '은빛 갑옷, 진홍색 망토' },
              { label: '성격', value: '용맹함, 자신감' },
            ]}
            palette={['#c0c0c0', '#8b0000', '#ffd700', '#1a1a2e']}
            onStartCanvas={handleStartCanvas}
            isGenerating={seedStage === 'ready' ? 'idle' : seedStage}
          />
        ) : (
          <>
            {/* Asset-level actions toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="primary"
                onClick={() => setPixelizeOpen(true)}
                disabled={!activeLayer?.imageUrl}
                className="gap-1.5 text-[12px]"
                title={activeLayer?.imageUrl
                  ? '활성 레이어 이미지를 픽셀 아트로 변환 + AI 옵션 + 수동 터치업 (무료)'
                  : '활성 레이어 이미지가 필요합니다'}
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <rect x="2" y="2" width="4" height="4" rx="0.5" />
                  <rect x="8" y="2" width="4" height="4" rx="0.5" />
                  <rect x="2" y="8" width="4" height="4" rx="0.5" />
                  <rect x="8" y="8" width="4" height="4" rx="0.5" />
                </svg>
                픽셀 변환
              </Button>

              {/*
               * Animation entries — two flows:
               *   "만들기": prompt + 옵션 → mock create → animation editor
               *   "기존 편집": link to existing sprite_sheet asset (mock: ast-anim-1)
               * Entity-level multi-animation system (one entity → N animations
               * idle/walk/attack) is the B handoff (v6).
               */}
              <Button
                variant="primary"
                onClick={() => setCreateAnimOpen(true)}
                className="gap-1.5 text-[12px]"
                title="프롬프트로 새 애니메이션 생성 — sprite_sheet 에셋 자동 생성 후 편집기로 이동"
              >
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                  <path d="M3 1.5l9 5.5-9 5.5V1.5z" fill="currentColor" />
                  <path d="M11 11h2M12 10v2" strokeLinecap="round" />
                </svg>
                애니메이션 만들기
              </Button>
              <Link href={`/projects/${projectId}/assets/ast-anim-1/animation`}>
                <Button
                  variant="ghost"
                  className="gap-1.5 text-[12px] text-[var(--text-3)] hover:text-[var(--text-2)]"
                  title="기존 sprite_sheet 애니메이션 편집기 열기 (mock: ast-anim-1)"
                >
                  기존 편집
                </Button>
              </Link>

              <span className="font-mono text-[10px] text-[var(--text-3)] ml-auto opacity-60">
                활성 레이어 = {activeLayer?.name ?? '없음'}
              </span>
            </div>

            <LiveCanvas
              layers={layers}
              activeLayerId={activeLayerId}
              outputSize={outputSize}
              onOutputSizeChange={setOutputSize}
              onLockIn={() => setShowLockInModal(true)}
            />
            <LiveChat
              activeLayer={activeLayer}
              history={layerHistory}
              onSubmit={handleSubmitPrompt}
              onRevert={handleRevert}
            />
          </>
        )}
      </TabsContent>

      <TabsContent value="gallery" className="flex-1 overflow-y-auto p-5">
        {gallery.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--text)] mb-1">{t('gallery.empty')}</p>
            <p className="text-[12px] text-[var(--text-3)]">{t('gallery.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {gallery.map((snap) => (
              <div
                key={snap.id}
                className="group rounded-[12px] border border-[var(--border)] bg-[rgba(255,255,255,0.04)] overflow-hidden hover:border-[rgba(0,229,160,0.25)] hover:bg-[rgba(255,255,255,0.06)] transition-all duration-[180ms]"
              >
                <div className="aspect-[4/3] bg-[var(--g1)] overflow-hidden">
                  {snap.thumbUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={snap.thumbUrl} alt={snap.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-medium text-[var(--text)] truncate mb-1">{snap.name}</p>
                  <p className="font-mono text-[10px] text-[var(--text-3)]">
                    {new Date(snap.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[120ms]">
                    <button className="flex-1 px-2 py-1 rounded-[6px] text-[11px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[100ms]">
                      {t('gallery.loadToCanvas')}
                    </button>
                    <button className="px-2 py-1 rounded-[6px] text-[11px] text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors duration-[100ms]">
                      ↓
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      <ResizableSplit
        initialLeftWidth={320}
        minLeft={260}
        maxLeft={560}
        storageKey="sprvte:entity-workspace:left-width"
      >
        {left}
        {right}
      </ResizableSplit>

      {/* Lock-in modal */}
      {/* Pixelize compare + AI + touch-up drawer */}
      <PixelizeCompareDrawer
        open={pixelizeOpen}
        onClose={() => setPixelizeOpen(false)}
        sourceUrl={activeLayer?.imageUrl ?? ''}
        assetName={`${entity.name} · ${activeLayer?.name ?? ''}`}
        onSelect={(size, options, aiDataUrl) => {
          console.log('[entity-pixelize] save:', { size, options, aiUsed: !!aiDataUrl, entityId, activeLayer: activeLayer?.id });
        }}
      />

      {/* Create animation dialog — generates new sprite_sheet from prompt */}
      <CreateAnimationDialog
        open={createAnimOpen}
        onClose={() => setCreateAnimOpen(false)}
        entityName={entity.name}
        defaultPrompt={autoPrompt}
        onCreated={(data, mockAssetId) => {
          console.log('[create-animation] entity:', entityId, 'data:', data, '→ asset:', mockAssetId);
          setCreateAnimOpen(false);
          // Real: would refetch entity assets. Mock: route to the demo
          // animation editor with that asset id.
          router.push(`/projects/${projectId}/assets/${mockAssetId}/animation`);
        }}
      />

      {showLockInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
          onClick={() => setShowLockInModal(false)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] border border-[var(--border-hi)] bg-[rgba(20,20,28,0.97)] backdrop-blur-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[var(--text)] mb-2">{t('live.lockInTitle')}</h3>
            <p className="text-[12px] text-[var(--text-2)] mb-5">{t('live.lockInBody')}</p>

            <label className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)] block mb-2">
              {t('live.lockInName')}
            </label>
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder={`${entity.name} — ${new Date().toLocaleDateString()}`}
              autoFocus
              className="w-full bg-[rgba(255,255,255,0.04)] border border-[var(--border)] rounded-[10px] text-[13px] text-[var(--text)] px-3.5 py-2.5 outline-none focus:border-[rgba(0,229,160,0.4)] focus:shadow-[0_0_0_3px_var(--neon-ring)] mb-5 placeholder:text-[var(--text-3)]"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLockInModal(false)}
                className="px-3.5 py-2 rounded-[8px] text-[13px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] transition-all duration-[120ms]"
              >
                {t('live.cancel')}
              </button>
              <button
                type="button"
                onClick={handleLockIn}
                disabled={!snapshotName.trim()}
                className="px-3.5 py-2 rounded-[8px] text-[13px] font-semibold text-black bg-[var(--neon)] shadow-[0_0_16px_var(--neon-glow)] hover:brightness-110 transition-all duration-[120ms] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('live.lockInSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
