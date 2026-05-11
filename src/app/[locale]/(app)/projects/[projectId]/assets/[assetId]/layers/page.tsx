'use client';

import { use } from 'react';
import Link from 'next/link';
import { LayerEditor } from '@/components/layer/LayerEditor';
import { LayerItem } from '@/components/layer/LayerCanvas';

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_LAYERS: LayerItem[] = [
  {
    id: 'layer-1',
    name: 'Base Body',
    fileUrl: 'https://picsum.photos/seed/layer1/512/512',
    layerData: {
      zIndex: 1,
      blendMode: 'normal',
      opacity: 100,
      visible: true,
      layerGroupId: 'group-1',
    },
  },
  {
    id: 'layer-2',
    name: 'Armor — Upper',
    fileUrl: 'https://picsum.photos/seed/layer2/512/512',
    layerData: {
      zIndex: 2,
      blendMode: 'normal',
      opacity: 90,
      visible: true,
      layerGroupId: 'group-1',
    },
  },
  {
    id: 'layer-3',
    name: 'Weapon',
    fileUrl: 'https://picsum.photos/seed/layer3/512/512',
    layerData: {
      zIndex: 3,
      blendMode: 'normal',
      opacity: 100,
      visible: true,
      layerGroupId: 'group-1',
    },
  },
];

interface LayerEditorPageProps {
  params: Promise<{ projectId: string; assetId: string }>;
}

export default function LayerEditorPage({ params }: LayerEditorPageProps) {
  const { projectId, assetId } = use(params);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] shrink-0 bg-[rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}/assets/${assetId}`}
            className="text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="text-[14px] font-semibold text-[var(--text)]">Layer Editor</h1>
            <p className="text-[11px] text-[var(--text-3)] font-mono">Alice Idle · {MOCK_LAYERS.length} layers</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-[var(--text-3)]">
            Drag layers to reorder · Toggle visibility · Adjust opacity & blend
          </span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <LayerEditor
          initialLayers={MOCK_LAYERS}
          onSaveComposite={async (layers) => {
            console.log('Save composite with layers:', layers.map((l) => l.name));
            await new Promise((r) => setTimeout(r, 1000));
          }}
        />
      </div>
    </div>
  );
}
