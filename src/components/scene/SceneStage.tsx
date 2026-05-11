'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image as KImage, Rect, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import {
  type ScenePlacement,
  buildPlacementTree,
  flattenForPaint,
  getDescendantIds,
} from '@/types/scenePlacement';

export type { ScenePlacement } from '@/types/scenePlacement';

interface SceneStageProps {
  width: number;       // logical scene width (e.g. 1920)
  height: number;      // logical scene height
  placements: ScenePlacement[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onChange: (id: string, attrs: Partial<ScenePlacement>) => void;
  /** Cascade move: apply (dx,dy) to placement AND all descendants in one update. */
  onCascadeMove: (rootId: string, dx: number, dy: number) => void;
  background: string;  // CSS color
  /** Display container size — stage scales to fit. */
  displayWidth: number;
  displayHeight: number;
  /** Enable smart guides (snap to centers/edges of stage and other placements). */
  snapEnabled?: boolean;
  /** Right-click on a placement (or empty space). */
  onContextMenu?: (e: { clientX: number; clientY: number; placementId: string | null }) => void;
}

const SNAP_THRESHOLD_PX = 6; // in stage units (logical px)

function useImage(src: string) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    let cancelled = false;
    el.onload = () => { if (!cancelled) setImg(el); };
    el.src = src;
    return () => { cancelled = true; };
  }, [src]);
  return img;
}

interface SnapTarget {
  axis: 'x' | 'y';
  value: number;
  /** Logical line endpoints in stage coords (for guide rendering). */
  lineFrom: number;
  lineTo: number;
}

function computeSnapTargets(
  draggedId: string,
  draggedCenter: { x: number; y: number },
  draggedHalf: { w: number; h: number },
  others: ScenePlacement[],
  imageBoxes: Map<string, { w: number; h: number }>,
  stageW: number,
  stageH: number,
): { snapX: SnapTarget | null; snapY: SnapTarget | null } {
  const targetsX: SnapTarget[] = [
    // Stage center / left / right
    { axis: 'x', value: stageW / 2,  lineFrom: 0, lineTo: stageH },
    { axis: 'x', value: 0,           lineFrom: 0, lineTo: stageH },
    { axis: 'x', value: stageW,      lineFrom: 0, lineTo: stageH },
  ];
  const targetsY: SnapTarget[] = [
    { axis: 'y', value: stageH / 2,  lineFrom: 0, lineTo: stageW },
    { axis: 'y', value: 0,           lineFrom: 0, lineTo: stageW },
    { axis: 'y', value: stageH,      lineFrom: 0, lineTo: stageW },
  ];

  // Add other placements' center / left / right / top / bottom
  for (const p of others) {
    if (p.id === draggedId) continue;
    const box = imageBoxes.get(p.id);
    if (!box) continue;
    const halfW = box.w / 2;
    const halfH = box.h / 2;
    targetsX.push({ axis: 'x', value: p.x,           lineFrom: 0, lineTo: stageH });
    targetsX.push({ axis: 'x', value: p.x - halfW,   lineFrom: 0, lineTo: stageH });
    targetsX.push({ axis: 'x', value: p.x + halfW,   lineFrom: 0, lineTo: stageH });
    targetsY.push({ axis: 'y', value: p.y,           lineFrom: 0, lineTo: stageW });
    targetsY.push({ axis: 'y', value: p.y - halfH,   lineFrom: 0, lineTo: stageW });
    targetsY.push({ axis: 'y', value: p.y + halfH,   lineFrom: 0, lineTo: stageW });
  }

  // Find closest target within threshold for each candidate point on dragged
  // (center, left edge, right edge for X; center, top, bottom for Y).
  const xCandidates = [draggedCenter.x, draggedCenter.x - draggedHalf.w, draggedCenter.x + draggedHalf.w];
  const yCandidates = [draggedCenter.y, draggedCenter.y - draggedHalf.h, draggedCenter.y + draggedHalf.h];

  let snapX: SnapTarget | null = null;
  let bestDX = SNAP_THRESHOLD_PX + 1;
  for (const t of targetsX) {
    for (let i = 0; i < xCandidates.length; i++) {
      const d = Math.abs(xCandidates[i] - t.value);
      if (d < bestDX) {
        bestDX = d;
        // Adjust snap so the candidate aligns: shift center by (target - candidate)
        const shift = t.value - xCandidates[i];
        snapX = { ...t, value: draggedCenter.x + shift };
      }
    }
  }

  let snapY: SnapTarget | null = null;
  let bestDY = SNAP_THRESHOLD_PX + 1;
  for (const t of targetsY) {
    for (let i = 0; i < yCandidates.length; i++) {
      const d = Math.abs(yCandidates[i] - t.value);
      if (d < bestDY) {
        bestDY = d;
        const shift = t.value - yCandidates[i];
        snapY = { ...t, value: draggedCenter.y + shift };
      }
    }
  }

  return { snapX, snapY };
}

function PlacementNode({
  placement,
  isSelected,
  onSelect,
  onChange,
  onCascadeMove,
  others,
  imageBoxes,
  setImageBox,
  stageW,
  stageH,
  snapEnabled,
  onDragGuides,
  descendantIds,
  stageRef,
}: {
  placement: ScenePlacement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (attrs: Partial<ScenePlacement>) => void;
  onCascadeMove: (rootId: string, dx: number, dy: number) => void;
  others: ScenePlacement[];
  imageBoxes: Map<string, { w: number; h: number }>;
  setImageBox: (id: string, box: { w: number; h: number }) => void;
  stageW: number;
  stageH: number;
  snapEnabled: boolean;
  onDragGuides: (snapX: SnapTarget | null, snapY: SnapTarget | null) => void;
  descendantIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
}) {
  const img = useImage(placement.imageUrl);
  const ref = useRef<Konva.Image | null>(null);
  const dragStartRef = useRef<{
    parentX: number;
    parentY: number;
    children: Map<string, { x: number; y: number }>;
  } | null>(null);

  // Register image natural box once loaded
  useEffect(() => {
    if (img) {
      const sc = placement.scale / 100;
      setImageBox(placement.id, { w: img.width * sc, h: img.height * sc });
    }
  }, [img, placement.id, placement.scale, setImageBox]);

  // Skip groups (no own visual)
  if (placement.isGroup) return null;
  if (!img || !placement.visible) return null;

  const scaleVal = placement.scale / 100;
  const halfW = (img.width * scaleVal) / 2;
  const halfH = (img.height * scaleVal) / 2;

  return (
    <KImage
      ref={ref}
      id={`placement-${placement.id}`}
      image={img}
      x={placement.x}
      y={placement.y}
      width={img.width}
      height={img.height}
      offsetX={img.width / 2}
      offsetY={img.height / 2}
      scaleX={scaleVal * (placement.flipX ? -1 : 1)}
      scaleY={scaleVal * (placement.flipY ? -1 : 1)}
      rotation={placement.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragStart={() => {
        const stage = stageRef.current;
        const children = new Map<string, { x: number; y: number }>();
        if (stage) {
          for (const cid of descendantIds) {
            const cnode = stage.findOne(`#placement-${cid}`) as Konva.Image | null;
            if (cnode) children.set(cid, { x: cnode.x(), y: cnode.y() });
          }
        }
        dragStartRef.current = {
          parentX: placement.x,
          parentY: placement.y,
          children,
        };
      }}
      onDragMove={(e) => {
        const node = e.target;
        let snapX: SnapTarget | null = null;
        let snapY: SnapTarget | null = null;
        if (snapEnabled) {
          const center = { x: node.x(), y: node.y() };
          const result = computeSnapTargets(
            placement.id,
            center,
            { w: halfW, h: halfH },
            others,
            imageBoxes,
            stageW,
            stageH,
          );
          snapX = result.snapX;
          snapY = result.snapY;
          if (snapX) node.x(snapX.value);
          if (snapY) node.y(snapY.value);
        }
        onDragGuides(snapX, snapY);

        // Cascade descendants visually (no state update — committed onDragEnd)
        const snap = dragStartRef.current;
        if (snap && snap.children.size > 0) {
          const dx = node.x() - snap.parentX;
          const dy = node.y() - snap.parentY;
          const stage = stageRef.current;
          if (stage) {
            for (const [cid, origin] of snap.children) {
              const cnode = stage.findOne(`#placement-${cid}`) as Konva.Image | null;
              if (cnode) {
                cnode.x(origin.x + dx);
                cnode.y(origin.y + dy);
              }
            }
          }
        }
      }}
      onDragEnd={(e) => {
        onDragGuides(null, null);
        const newX = Math.round(e.target.x());
        const newY = Math.round(e.target.y());
        const dx = newX - placement.x;
        const dy = newY - placement.y;
        dragStartRef.current = null;
        // Cascade: this updates self AND all descendants by same delta in one batch
        onCascadeMove(placement.id, dx, dy);
      }}
      onTransformEnd={() => {
        const node = ref.current;
        if (!node) return;
        // Konva sets node.scaleX/Y to the COMBINED final value
        // (props scale × user-drag delta). So we read it directly — no
        // double-multiplication. Math.abs strips flip sign.
        const sx = Math.abs(node.scaleX());
        const sy = Math.abs(node.scaleY());
        const newScalePct = Math.round(((sx + sy) / 2) * 100);
        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          scale: Math.max(10, Math.min(400, newScalePct)),
          rotation: Math.round(node.rotation()),
        });
        // Don't manually reset node.scaleX/Y — React re-renders with
        // the new prop and Konva will sync. Manual reset would race
        // with the upcoming render and corrupt next transform.
      }}
      stroke={isSelected ? '#00E5A0' : undefined}
      strokeWidth={isSelected ? 1 / scaleVal : 0}
      strokeEnabled={isSelected}
      shadowEnabled={isSelected}
      shadowColor="#00E5A0"
      shadowBlur={isSelected ? 16 : 0}
      shadowOpacity={isSelected ? 0.6 : 0}
      perfectDrawEnabled={false}
    />
  );
}

export function SceneStage({
  width,
  height,
  placements,
  selectedIds,
  onSelectionChange,
  onChange,
  onCascadeMove,
  background,
  displayWidth,
  displayHeight,
  snapEnabled = true,
  onContextMenu,
}: SceneStageProps) {
  const trRef = useRef<Konva.Transformer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  // Image natural sizes (after scale) for snap targets.
  // Stable callback reference; bails out when value unchanged to prevent
  // infinite re-render loops (PlacementNode useEffect → setState → re-render).
  const [imageBoxes, setImageBoxes] = useState<Map<string, { w: number; h: number }>>(new Map());
  const setImageBox = useCallback((id: string, box: { w: number; h: number }) => {
    setImageBoxes((prev) => {
      const existing = prev.get(id);
      if (existing && existing.w === box.w && existing.h === box.h) return prev;
      const next = new Map(prev);
      next.set(id, box);
      return next;
    });
  }, []);

  // Active snap guides (rendered as lines)
  const [guides, setGuides] = useState<{ snapX: SnapTarget | null; snapY: SnapTarget | null }>({
    snapX: null,
    snapY: null,
  });

  // Fit-contain
  const scale = Math.min(displayWidth / width, displayHeight / height);

  // Update transformer when selection changes
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const nodes = selectedIds
      .map((id) => stage.findOne(`#placement-${id}`))
      .filter((n): n is Konva.Node => Boolean(n));
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, placements]);

  if (displayWidth === 0 || displayHeight === 0) return null;

  // Tree-based paint order: parent before children (children paint on top)
  const tree = buildPlacementTree(placements);
  const paintList = flattenForPaint(tree);

  const handlePlacementClick = (id: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const evt = e.evt as MouseEvent;
    const additive = evt.shiftKey || evt.metaKey || evt.ctrlKey;
    if (additive) {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      } else {
        onSelectionChange([...selectedIds, id]);
      }
    } else {
      onSelectionChange([id]);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={displayWidth}
      height={displayHeight}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelectionChange([]);
      }}
      onContextMenu={(e) => {
        if (!onContextMenu) return;
        e.evt.preventDefault();
        const target = e.target;
        let placementId: string | null = null;
        // Walk up to find the placement node id
        let node: Konva.Node | null = target;
        while (node && !placementId) {
          const id = node.id();
          if (id?.startsWith('placement-')) placementId = id.replace('placement-', '');
          node = node.getParent();
        }
        // Auto-select on right-click if not already selected
        if (placementId && !selectedIds.includes(placementId)) {
          onSelectionChange([placementId]);
        }
        onContextMenu({
          clientX: e.evt.clientX,
          clientY: e.evt.clientY,
          placementId,
        });
      }}
    >
      {/* Background */}
      <Layer listening={false}>
        <Rect x={0} y={0} width={width} height={height} fill={background} />
      </Layer>

      {/* Placements (paint order: parents before children) */}
      <Layer>
        {paintList.map((p) => (
          <PlacementNode
            key={p.id}
            placement={p}
            isSelected={selectedIds.includes(p.id)}
            onSelect={(e) => handlePlacementClick(p.id, e)}
            onChange={(attrs) => onChange(p.id, attrs)}
            onCascadeMove={onCascadeMove}
            others={placements}
            imageBoxes={imageBoxes}
            setImageBox={setImageBox}
            stageW={width}
            stageH={height}
            snapEnabled={snapEnabled}
            onDragGuides={(sx, sy) => setGuides({ snapX: sx, snapY: sy })}
            descendantIds={getDescendantIds(placements, p.id)}
            stageRef={stageRef}
          />
        ))}
      </Layer>

      {/* Snap guides */}
      {(guides.snapX || guides.snapY) && (
        <Layer listening={false}>
          {guides.snapX && (
            <Line
              points={[guides.snapX.value, guides.snapX.lineFrom, guides.snapX.value, guides.snapX.lineTo]}
              stroke="#FF4FE7"
              strokeWidth={1 / scale}
              dash={[6 / scale, 4 / scale]}
            />
          )}
          {guides.snapY && (
            <Line
              points={[guides.snapY.lineFrom, guides.snapY.value, guides.snapY.lineTo, guides.snapY.value]}
              stroke="#FF4FE7"
              strokeWidth={1 / scale}
              dash={[6 / scale, 4 / scale]}
            />
          )}
        </Layer>
      )}

      {/* Transformer (resize/rotate handles) */}
      <Layer>
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          borderStroke="#00E5A0"
          borderStrokeWidth={1}
          anchorFill="#00E5A0"
          anchorStroke="#000"
          anchorSize={8}
          rotateAnchorOffset={20}
          boundBoxFunc={(oldBox, newBox) => {
            const min = 10;
            if (Math.abs(newBox.width) < min || Math.abs(newBox.height) < min) {
              return oldBox;
            }
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}
