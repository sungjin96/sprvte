'use client';

import { useRef, useState, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  type LiveLayer,
  buildLayerTree,
  flattenForDisplay,
  getDescendantIds,
} from '@/types/liveLayer';
import { ContextMenu, ContextMenuItem } from '@/components/ui/ContextMenu';
import type { DropPosition } from '@/lib/layers/operations';

interface LayerStackProps {
  layers: LiveLayer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onRename?: (id: string, name: string) => void;
  /** Drop sourceId before/after/inside targetId. */
  onMoveTo?: (sourceId: string, targetId: string, position: DropPosition) => void;
  /** Drop sourceId on empty area at end of panel = move to root. */
  onMoveToRoot?: (sourceId: string) => void;
  /** AI re-split: regenerate the entire layer tree (mock at this stage). */
  onResplit?: () => void;
  /** AI regenerate: regenerate just this one layer. */
  onRegenerateLayer?: (id: string) => void;
  /** Delete a layer + cascade descendants. Returns descendant count for UI warning. */
  onDeleteLayer?: (id: string) => void;
  onImport?: (file: File) => void;
  importing?: boolean;
  resplitting?: boolean;
}

const Icons = {
  Eye: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <path d="M1 7s2-4.5 6-4.5S13 7 13 7s-2 4.5-6 4.5S1 7 1 7z" />
      <circle cx="7" cy="7" r="2" />
    </svg>
  ),
  EyeOff: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <path d="M1 1l12 12M3 4.5C2.2 5.4 1.5 6.4 1 7c0 0 2 4.5 6 4.5 1.4 0 2.6-.4 3.6-1M5.5 5.5a2 2 0 0 0 3 3M11 9.5C12.2 8.6 12.7 7.6 13 7c0 0-2-4.5-6-4.5-.4 0-.8 0-1.2.1" strokeLinecap="round" />
    </svg>
  ),
  Lock: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <rect x="3" y="6.5" width="8" height="6" rx="1" />
      <path d="M5 6.5V4.5a2 2 0 0 1 4 0v2" />
    </svg>
  ),
  LockOpen: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-3.5 h-3.5">
      <rect x="3" y="6.5" width="8" height="6" rx="1" />
      <path d="M5 6.5V4.5a2 2 0 0 1 4 0v1" strokeLinecap="round" />
    </svg>
  ),
  Star: (
    <svg viewBox="0 0 14 14" fill="currentColor" className="w-3 h-3">
      <path d="M7 1l1.8 3.6L13 5.2l-3 2.9.7 4.1L7 10.3l-3.7 2L4 8.1 1 5.2l4.2-.6L7 1z" />
    </svg>
  ),
  Chevron: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
      <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Folder: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5">
      <path d="M2 4.5a1 1 0 0 1 1-1h2.5l1 1H11a1 1 0 0 1 1 1V11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4.5z" />
    </svg>
  ),
  FolderOpen: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5">
      <path d="M2 4.5a1 1 0 0 1 1-1h2.5l1 1H11a1 1 0 0 1 1 1V6H2V4.5zM2 6h10l-1 5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6z" strokeLinejoin="round" />
    </svg>
  ),
  Import: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
      <path d="M7 1v8M3.5 5.5L7 9l3.5-3.5M2 12h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Refresh: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3 h-3">
      <path d="M2 7a5 5 0 0 1 9-3M12 7a5 5 0 0 1-9 3M11 1v3h-3M3 13v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Spinner: (
    <span className="inline-block w-3 h-3 rounded-full border-2 border-[var(--border-hi)] border-t-[var(--neon)] animate-spin" />
  ),
};

export function LayerStack({
  layers,
  activeLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onToggleExpand,
  onRename,
  onMoveTo,
  onMoveToRoot,
  onResplit,
  onRegenerateLayer,
  onDeleteLayer,
  onImport,
  importing,
  resplitting,
}: LayerStackProps) {
  const t = useTranslations('entityWorkspace');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: DropPosition } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [menu, setMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  const tree = buildLayerTree(layers);
  const flat = flattenForDisplay(tree);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) onImport(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameDraft(currentName);
  };

  const commitRename = () => {
    if (renamingId && renameDraft.trim() && onRename) {
      onRename(renamingId, renameDraft.trim());
    }
    setRenamingId(null);
    setRenameDraft('');
  };

  // Build context menu items for the right-clicked layer.
  const menuItems: ContextMenuItem[] = (() => {
    if (!menu) return [];
    const layer = layers.find((l) => l.id === menu.layerId);
    if (!layer) return [];
    const descendantCount = getDescendantIds(layers, menu.layerId).length;
    const deleteLabel = descendantCount > 0
      ? `${t('contextMenu.delete')} (${t('contextMenu.deleteCascade', { n: descendantCount })})`
      : t('contextMenu.delete');

    const items: ContextMenuItem[] = [];

    if (onRegenerateLayer && !layer.isGroup) {
      items.push({
        label: t('contextMenu.regenerate'),
        onClick: () => onRegenerateLayer(layer.id),
      });
    }
    if (onResplit) {
      items.push({
        label: t('contextMenu.resplit'),
        onClick: () => onResplit(),
      });
    }
    if (items.length > 0) items.push({ kind: 'separator' });

    items.push({
      label: t('contextMenu.rename'),
      shortcut: 'F2',
      onClick: () => startRename(layer.id, layer.name),
    });
    items.push({
      label: layer.visible ? t('contextMenu.hide') : t('contextMenu.show'),
      onClick: () => onToggleVisibility(layer.id),
    });
    items.push({
      label: layer.locked ? t('contextMenu.unlock') : t('contextMenu.lock'),
      onClick: () => onToggleLock(layer.id),
    });

    if (onDeleteLayer) {
      items.push({ kind: 'separator' });
      items.push({
        label: deleteLabel,
        shortcut: '⌫',
        danger: true,
        onClick: () => onDeleteLayer(layer.id),
      });
    }
    return items;
  })();

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
          {t('layerStack')}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-3)] opacity-70">
          {t('layerStackHint')}
        </span>
      </div>

      <div
        className="space-y-[2px]"
        onDragOver={(e) => {
          // Allow drop on the empty area below all rows = move to root.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          if (e.target === e.currentTarget && draggingId && onMoveToRoot) {
            e.preventDefault();
            onMoveToRoot(draggingId);
          }
          setDraggingId(null);
          setDropTarget(null);
        }}
      >
        {flat.map(({ layer, depth, children }) => {
          const active = layer.id === activeLayerId;
          const isGroup = layer.isGroup;
          const expanded = isGroup ? (layer.expanded ?? true) : false;
          const hasChildren = children.length > 0;
          const canHaveChildren = isGroup || hasChildren;
          const isDragging = draggingId === layer.id;
          const dropMark = dropTarget?.id === layer.id ? dropTarget.position : null;
          const isRenaming = renamingId === layer.id;

          return (
            <div
              key={layer.id}
              role="button"
              tabIndex={0}
              draggable={!isRenaming}
              onClick={() => {
                if (layer.locked) return;
                onSelectLayer(layer.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!layer.locked && onRename) startRename(layer.id, layer.name);
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !layer.locked && !isRenaming) {
                  e.preventDefault();
                  onSelectLayer(layer.id);
                }
                if (e.key === 'F2' && !layer.locked && onRename) {
                  e.preventDefault();
                  startRename(layer.id, layer.name);
                }
              }}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', layer.id);
                setDraggingId(layer.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggingId === layer.id) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                const h = rect.height;
                let position: DropPosition;
                if (offsetY < h * 0.25) position = 'before';
                else if (offsetY > h * 0.75) position = 'after';
                else position = 'inside';
                setDropTarget({ id: layer.id, position });
              }}
              onDragLeave={() => {
                setDropTarget((curr) => (curr?.id === layer.id ? null : curr));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggingId && draggingId !== layer.id && dropMark && onMoveTo) {
                  onMoveTo(draggingId, layer.id, dropMark);
                }
                setDraggingId(null);
                setDropTarget(null);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setDropTarget(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                onSelectLayer(layer.id);
                setMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
              }}
              className={cn(
                'group relative flex items-center gap-1.5 pr-2 py-1 rounded-md',
                'text-[12px] border cursor-grab active:cursor-grabbing',
                'transition-all duration-[120ms]',
                active && 'bg-[var(--neon-dim)] text-[var(--neon)] border-[rgba(0,229,160,0.2)]',
                !active && 'border-transparent text-[var(--text-2)] hover:bg-[var(--g1)] hover:text-[var(--text)]',
                !layer.visible && 'opacity-50',
                layer.locked && 'cursor-not-allowed',
                isDragging && 'opacity-30',
                dropMark === 'inside' && 'ring-1 ring-[var(--neon)] ring-inset bg-[var(--neon-dim)]',
              )}
              style={{ paddingLeft: 4 + depth * 14 }}
            >
              {/* Drop indicator line for before/after */}
              {(dropMark === 'before' || dropMark === 'after') && (
                <span
                  className={cn(
                    'pointer-events-none absolute left-0 right-0 h-[2px] bg-[var(--neon)] shadow-[0_0_4px_var(--neon-glow)]',
                    dropMark === 'before' ? '-top-[1px]' : '-bottom-[1px]',
                  )}
                />
              )}

              {/* Tree guides + chevron */}
              {canHaveChildren ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleExpand(layer.id); }}
                  className={cn(
                    'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-[2px] text-[var(--text-3)] hover:text-[var(--text)]',
                    'transition-transform duration-[120ms]',
                    expanded && 'rotate-90',
                  )}
                >
                  {Icons.Chevron}
                </button>
              ) : (
                <span className="shrink-0 w-3.5 h-3.5" />
              )}

              {/* Active star */}
              <span className={cn('shrink-0 w-3 h-3 flex items-center justify-center', active ? 'text-[var(--neon)]' : 'text-transparent')}>
                {active && Icons.Star}
              </span>

              {/* Thumbnail / folder icon */}
              <div
                className={cn(
                  'w-5 h-5 rounded-[3px] shrink-0 border bg-[var(--g1)] overflow-hidden flex items-center justify-center',
                  active ? 'border-[var(--neon)]' : 'border-[var(--border)]',
                )}
              >
                {layer.status === 'generating' ? (
                  Icons.Spinner
                ) : isGroup ? (
                  <span className={cn(active ? 'text-[var(--neon)]' : 'text-[var(--text-3)]')}>
                    {expanded ? Icons.FolderOpen : Icons.Folder}
                  </span>
                ) : layer.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={layer.thumbUrl} alt={layer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-mono text-[7px] text-[var(--text-3)] uppercase">
                    {layer.kind.slice(0, 3)}
                  </span>
                )}
              </div>

              {/* Name (or rename input) */}
              {isRenaming ? (
                <input
                  type="text"
                  value={renameDraft}
                  autoFocus
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename();
                    else if (e.key === 'Escape') { setRenamingId(null); setRenameDraft(''); }
                  }}
                  className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[var(--neon)] rounded-[3px] px-1 py-0 text-[12px] text-[var(--text)] outline-none"
                />
              ) : (
                <span className={cn('flex-1 truncate', isGroup && 'font-medium')}>{layer.name}</span>
              )}

              {/* Visibility toggle */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                className={cn(
                  'shrink-0 w-5 h-5 flex items-center justify-center rounded-[4px]',
                  layer.visible ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]',
                  'hover:bg-[var(--g2)] hover:text-[var(--text)]',
                )}
                title={layer.visible ? t('contextMenu.hide') : t('contextMenu.show')}
              >
                {layer.visible ? Icons.Eye : Icons.EyeOff}
              </button>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}
                className={cn(
                  'shrink-0 w-5 h-5 flex items-center justify-center rounded-[4px]',
                  layer.locked ? 'text-[var(--neon)]' : 'text-[var(--text-3)]',
                  'hover:bg-[var(--g2)]',
                )}
                title={layer.locked ? t('contextMenu.unlock') : t('contextMenu.lock')}
              >
                {layer.locked ? Icons.Lock : Icons.LockOpen}
              </button>
            </div>
          );
        })}
      </div>

      {/* AI re-split */}
      {onResplit && (
        <button
          type="button"
          onClick={onResplit}
          disabled={resplitting}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-[11px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('resplitHint')}
        >
          {resplitting ? (
            <>
              {Icons.Spinner}
              <span>{t('resplitting')}</span>
            </>
          ) : (
            <>
              {Icons.Refresh}
              <span>{t('resplit')}</span>
            </>
          )}
        </button>
      )}

      {/* Import button */}
      {onImport && (
        <>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-[11px] text-[var(--text-2)] bg-[var(--g1)] border border-[var(--border)] hover:bg-[var(--g2)] hover:text-[var(--text)] hover:border-[var(--border-hi)] transition-all duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('importHint')}
          >
            {importing ? (
              <>
                {Icons.Spinner}
                <span>{t('importing')}</span>
              </>
            ) : (
              <>
                {Icons.Import}
                <span>{t('importLayers')}</span>
              </>
            )}
          </button>
          <p className="mt-1 font-mono text-[9px] text-[var(--text-3)] text-center opacity-60">
            {t('importHint')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".aseprite,.ase,.psd,.psb,.png,.svg"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}

      <ContextMenu
        position={menu ? { x: menu.x, y: menu.y } : null}
        items={menuItems}
        onClose={() => setMenu(null)}
      />
    </div>
  );
}
