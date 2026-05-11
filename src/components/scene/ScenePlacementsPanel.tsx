'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  type ScenePlacement,
  buildPlacementTree,
  flattenForDisplay,
  type PlacementTreeNode,
} from '@/types/scenePlacement';

export type DropPosition = 'before' | 'after' | 'inside';

interface ScenePlacementsPanelProps {
  placements: ScenePlacement[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onChange: (id: string, attrs: Partial<ScenePlacement>) => void;
  /** Reorder via arrow buttons. */
  onReorder: (id: string, direction: 'up' | 'down') => void;
  /** Drop sourceId before/after/inside targetId. */
  onMoveTo?: (sourceId: string, targetId: string, position: DropPosition) => void;
  /** Move sourceId to root (when dropped on empty area at end of panel). */
  onMoveToRoot?: (sourceId: string) => void;
  /** Right-click on a row. */
  onContextMenu?: (e: { clientX: number; clientY: number; placementId: string }) => void;
  /** Inline rename. */
  onRename?: (id: string, name: string) => void;
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
  Up: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
      <path d="M3 7l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Down: (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
      <path d="M3 5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
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
};

export function ScenePlacementsPanel({
  placements,
  selectedIds,
  onSelectionChange,
  onChange,
  onReorder,
  onMoveTo,
  onMoveToRoot,
  onContextMenu,
  onRename,
}: ScenePlacementsPanelProps) {
  const t = useTranslations('scenes.layersPanel');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; position: DropPosition } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const tree = buildPlacementTree(placements);
  const flat = flattenForDisplay(tree);

  const handleClick = (id: string, e: React.MouseEvent) => {
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    if (additive) {
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((s) => s !== id)
          : [...selectedIds, id],
      );
    } else {
      onSelectionChange([id]);
    }
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

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-baseline justify-between bg-[var(--g1)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-3)]">
          {t('title')}
        </span>
        <span className="font-mono text-[10px] text-[var(--text-3)] opacity-70">
          {placements.length} · {t('hint')}
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto py-1"
        onDragOver={(e) => {
          // Allow drop on empty area below all rows
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          // Drop on empty area = move to root
          if (e.target === e.currentTarget && draggingId && onMoveToRoot) {
            e.preventDefault();
            onMoveToRoot(draggingId);
          }
          setDraggingId(null);
          setDropTarget(null);
        }}
      >
        {flat.map((node) => (
          <PlacementRow
            key={node.placement.id}
            node={node}
            selected={selectedIds.includes(node.placement.id)}
            renaming={renamingId === node.placement.id}
            renameDraft={renameDraft}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onSetRenameDraft={setRenameDraft}
            onCommitRename={commitRename}
            onCancelRename={() => { setRenamingId(null); setRenameDraft(''); }}
            onClick={(e) => handleClick(node.placement.id, e)}
            onDoubleClick={() => startRename(node.placement.id, node.placement.name ?? node.placement.assetId)}
            onToggleVisible={() => onChange(node.placement.id, { visible: !node.placement.visible })}
            onToggleExpand={() => onChange(node.placement.id, { expanded: !(node.placement.expanded ?? true) })}
            onMoveUp={() => onReorder(node.placement.id, 'up')}
            onMoveDown={() => onReorder(node.placement.id, 'down')}
            moveUpLabel={t('moveUp')}
            moveDownLabel={t('moveDown')}
            onDragStart={(id) => setDraggingId(id)}
            onDragOverRow={(id, position) => setDropTarget({ id, position })}
            onDragLeaveRow={() => setDropTarget(null)}
            onDropRow={(id, position) => {
              if (draggingId && draggingId !== id && onMoveTo) onMoveTo(draggingId, id, position);
              setDraggingId(null);
              setDropTarget(null);
            }}
            onDragEndRow={() => { setDraggingId(null); setDropTarget(null); }}
            onContextMenuRow={onContextMenu}
          />
        ))}

        {placements.length === 0 && (
          <div className="px-3 py-6 text-center font-mono text-[10px] text-[var(--text-3)] opacity-70">
            empty
          </div>
        )}
      </div>
    </div>
  );
}

function PlacementRow({
  node,
  selected,
  renaming,
  renameDraft,
  draggingId,
  dropTarget,
  onSetRenameDraft,
  onCommitRename,
  onCancelRename,
  onClick,
  onDoubleClick,
  onToggleVisible,
  onToggleExpand,
  onMoveUp,
  onMoveDown,
  moveUpLabel,
  moveDownLabel,
  onDragStart,
  onDragOverRow,
  onDragLeaveRow,
  onDropRow,
  onDragEndRow,
  onContextMenuRow,
}: {
  node: PlacementTreeNode;
  selected: boolean;
  renaming: boolean;
  renameDraft: string;
  draggingId: string | null;
  dropTarget: { id: string; position: DropPosition } | null;
  onSetRenameDraft: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onToggleVisible: () => void;
  onToggleExpand: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  moveUpLabel: string;
  moveDownLabel: string;
  onDragStart: (id: string) => void;
  onDragOverRow: (id: string, position: DropPosition) => void;
  onDragLeaveRow: () => void;
  onDropRow: (id: string, position: DropPosition) => void;
  onDragEndRow: () => void;
  onContextMenuRow?: (e: { clientX: number; clientY: number; placementId: string }) => void;
}) {
  const { placement, depth } = node;
  const hasChildren = node.children.length > 0;
  const isGroup = placement.isGroup;
  const expanded = placement.expanded ?? true;
  const canHaveChildren = isGroup || hasChildren; // groups always; non-groups only if already a parent
  const isDragging = draggingId === placement.id;
  const dropMark = dropTarget?.id === placement.id ? dropTarget.position : null;
  const displayName = placement.name ?? placement.assetId.replace(/^a-/, '');

  return (
    <div
      role="button"
      draggable={!renaming}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', placement.id);
        onDragStart(placement.id);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggingId === placement.id) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const h = rect.height;
        // 3 zones: top 25% = before, middle 50% = inside (parent), bottom 25% = after
        // For non-group leaves that aren't already parents, "inside" still works (becomes parent)
        let position: DropPosition;
        if (offsetY < h * 0.25) position = 'before';
        else if (offsetY > h * 0.75) position = 'after';
        else position = 'inside';
        onDragOverRow(placement.id, position);
      }}
      onDragLeave={onDragLeaveRow}
      onDrop={(e) => {
        e.preventDefault();
        if (!dropMark) return;
        onDropRow(placement.id, dropMark);
      }}
      onDragEnd={onDragEndRow}
      onContextMenu={(e) => {
        if (!onContextMenuRow) return;
        e.preventDefault();
        onContextMenuRow({ clientX: e.clientX, clientY: e.clientY, placementId: placement.id });
      }}
      onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      tabIndex={0}
      className={cn(
        'group relative w-full flex items-center gap-1 py-1 pr-2 text-[11px] text-left cursor-grab active:cursor-grabbing transition-colors duration-[100ms]',
        selected
          ? 'bg-[var(--neon-dim)] text-[var(--neon)]'
          : 'text-[var(--text-2)] hover:bg-[var(--g1)] hover:text-[var(--text)]',
        !placement.visible && 'opacity-50',
        isDragging && 'opacity-30',
        // 'inside' drop indicator covers the whole row
        dropMark === 'inside' && 'ring-1 ring-[var(--neon)] ring-inset bg-[var(--neon-dim)]',
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
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

      {/* Expand chevron (groups OR placements with children) */}
      {canHaveChildren ? (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
          className={cn(
            'shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-[2px] text-[var(--text-3)] hover:text-[var(--text)]',
            'transition-transform duration-[120ms]',
            expanded && 'rotate-90',
          )}
        >
          {Icons.Chevron}
        </span>
      ) : (
        <span className="shrink-0 w-3.5 h-3.5" />
      )}

      {/* Thumbnail OR folder icon */}
      <div className={cn(
        'w-5 h-5 shrink-0 rounded-[3px] border bg-[var(--g1)] overflow-hidden flex items-center justify-center',
        selected ? 'border-[var(--neon)]' : 'border-[var(--border)]',
      )}>
        {isGroup ? (
          <span className={cn(selected ? 'text-[var(--neon)]' : 'text-[var(--text-3)]')}>
            {expanded ? Icons.FolderOpen : Icons.Folder}
          </span>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={placement.imageUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Name (or rename input) */}
      {renaming ? (
        <input
          type="text"
          value={renameDraft}
          autoFocus
          onChange={(e) => onSetRenameDraft(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitRename();
            else if (e.key === 'Escape') onCancelRename();
          }}
          className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[var(--neon)] rounded-[3px] px-1 py-0 text-[11px] font-mono text-[var(--text)] outline-none"
        />
      ) : (
        <span className={cn('flex-1 truncate font-mono', isGroup && 'font-medium')}>
          {displayName}
        </span>
      )}

      {/* z-order */}
      {!isGroup && (
        <span className="font-mono text-[9px] text-[var(--text-3)] opacity-60">
          z{placement.zOrder}
        </span>
      )}

      {/* Reorder buttons */}
      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-[100ms]">
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          title={moveUpLabel}
          className="w-5 h-5 inline-flex items-center justify-center rounded-[3px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
        >
          {Icons.Up}
        </span>
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          title={moveDownLabel}
          className="w-5 h-5 inline-flex items-center justify-center rounded-[3px] text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--g2)] transition-colors duration-[100ms]"
        >
          {Icons.Down}
        </span>
      </span>

      {/* Visibility toggle */}
      <span
        role="button"
        onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
        className={cn(
          'w-5 h-5 inline-flex items-center justify-center rounded-[3px] transition-colors duration-[100ms]',
          placement.visible ? 'text-[var(--text-3)] hover:text-[var(--text)]' : 'text-[var(--text-3)] opacity-70',
          'hover:bg-[var(--g2)]',
        )}
      >
        {placement.visible ? Icons.Eye : Icons.EyeOff}
      </span>
    </div>
  );
}
