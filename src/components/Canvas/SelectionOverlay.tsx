// =============================================================================
// SelectionOverlay — Renders selection handles on selected controls
// Handles group bounding box for multi-select and individual handles for single.
// =============================================================================

import React from 'react';
import type { ControlConfig, GridSystem, ResizeDir } from '../../types/controls';
import { controlToCanvasCoords } from '../../utils/gridUtils';

const HANDLES: { dir: ResizeDir; cursor: string }[] = [
  { dir: 'nw', cursor: 'nwse-resize' },
  { dir: 'ne', cursor: 'nesw-resize' },
  { dir: 'sw', cursor: 'nesw-resize' },
  { dir: 'se', cursor: 'nwse-resize' },
];

const EDGE_HANDLES: { dir: ResizeDir; cursor: string }[] = [
  { dir: 'n', cursor: 'ns-resize' },
  { dir: 's', cursor: 'ns-resize' },
  { dir: 'e', cursor: 'ew-resize' },
  { dir: 'w', cursor: 'ew-resize' },
];

interface Props {
  controls: ControlConfig[];
  selectedIds: string[];
  gridSystem: GridSystem;
  gridVariant: string;
  canvasW: number;
  canvasH: number;
  uiScale: string;
  onHandleMouseDown: (controlId: string, dir: ResizeDir, e: React.MouseEvent) => void;
}

export const SelectionOverlay: React.FC<Props> = ({
  controls,
  selectedIds,
  gridSystem,
  gridVariant,
  canvasW,
  canvasH,
  uiScale,
  onHandleMouseDown,
}) => {
  const selectedControls = controls.filter(c => selectedIds.includes(c.id));
  const isMultiSelect = selectedIds.length > 1;

  const groupBBox = isMultiSelect ? computeGroupBBox(selectedControls, gridSystem, gridVariant, canvasW, canvasH, uiScale) : null;

  return (
    <>
      {groupBBox && (
        <GroupSelectionOverlay
          bbox={groupBBox}
          onHandleMouseDown={onHandleMouseDown}
          primaryControlId={selectedIds[0]}
        />
      )}

      {selectedControls.map((ctrl) => {
        const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, uiScale);
        const x = coords.x;
        const y = coords.y;
        const w = coords.w;
        const h = coords.h;

        return (
          <div key={`sel-${ctrl.id}`}>
            {/* Thin per-control indicator for multi-select */}
            {isMultiSelect && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: x - 1,
                  top: y - 1,
                  width: w + 2,
                  height: h + 2,
                  border: '1px dashed rgba(233,69,96,0.4)',
                  boxSizing: 'border-box',
                }}
              />
            )}

            {/* Single-select: full handles + border */}
            {!isMultiSelect && (
              <SingleSelectionHandles
                ctrl={ctrl}
                x={x}
                y={y}
                w={w}
                h={h}
                onHandleMouseDown={onHandleMouseDown}
              />
            )}
          </div>
        );
      })}
    </>
  );
};

// =============================================================================
// Group Selection Bounding Box (multi-select)
// =============================================================================
function GroupSelectionOverlay({
  bbox,
  onHandleMouseDown,
  primaryControlId,
}: {
  bbox: { x: number; y: number; w: number; h: number };
  onHandleMouseDown: (controlId: string, dir: ResizeDir, e: React.MouseEvent) => void;
  primaryControlId: string;
}) {
  const x = bbox.x;
  const y = bbox.y;
  const w = bbox.w;
  const h = bbox.h;
  const handleSize = 7;

  return (
    <div>
      {/* Group bounding box */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: x - 2,
          top: y - 2,
          width: w + 4,
          height: h + 4,
          border: '2px dashed rgba(233,69,96,0.7)',
          boxSizing: 'border-box',
        }}
      />

      {/* Corner handles on group bbox */}
      {HANDLES.map((handle, i) => {
        const hx =
          handle.dir === 'nw' || handle.dir === 'sw'
            ? x - handleSize
            : x + w - handleSize;
        const hy =
          handle.dir === 'nw' || handle.dir === 'ne'
            ? y - handleSize
            : y + h - handleSize;

        return (
          <div
            key={i}
            data-handle="resize"
            className="absolute z-20"
            style={{
              left: hx,
              top: hy,
              width: handleSize * 2,
              height: handleSize * 2,
              backgroundColor: '#e94560',
              border: '1px solid white',
              borderRadius: 2,
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(primaryControlId, handle.dir, e);
            }}
          />
        );
      })}

      {/* Edge handles on group bbox */}
      {EDGE_HANDLES.map((handle, i) => {
        const midX = x + w / 2 - handleSize;
        const midY = y + h / 2 - handleSize;
        const hx =
          handle.dir === 'w'
            ? x - handleSize
            : handle.dir === 'e'
              ? x + w - handleSize
              : midX;
        const hy =
          handle.dir === 'n'
            ? y - handleSize
            : handle.dir === 's'
              ? y + h - handleSize
              : midY;

        return (
          <div
            key={`edge-${i}`}
            data-handle="resize"
            className="absolute z-20"
            style={{
              left: hx,
              top: hy,
              width: handleSize * 2,
              height: handleSize * 2,
              backgroundColor: '#3b82f6',
              border: '1px solid white',
              borderRadius: 2,
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(primaryControlId, handle.dir, e);
            }}
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Single Control Selection Handles
// =============================================================================
function SingleSelectionHandles({
  ctrl,
  x,
  y,
  w,
  h,
  onHandleMouseDown,
}: {
  ctrl: ControlConfig;
  x: number;
  y: number;
  w: number;
  h: number;
  onHandleMouseDown: (controlId: string, dir: ResizeDir, e: React.MouseEvent) => void;
}) {
  const handleSize = 6;

  return (
    <>
      {/* Selection border */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: x - 1,
          top: y - 1,
          width: w + 2,
          height: h + 2,
          border: '2px solid #e94560',
          boxSizing: 'border-box',
        }}
      />

      {/* Corner handles */}
      {HANDLES.map((handle, i) => {
        const hx =
          handle.dir === 'nw' || handle.dir === 'sw'
            ? x - handleSize
            : x + w - handleSize;
        const hy =
          handle.dir === 'nw' || handle.dir === 'ne'
            ? y - handleSize
            : y + h - handleSize;

        return (
          <div
            key={i}
            data-handle="resize"
            className="absolute z-20"
            style={{
              left: hx,
              top: hy,
              width: handleSize * 2,
              height: handleSize * 2,
              backgroundColor: '#e94560',
              border: '1px solid white',
              borderRadius: 1,
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(ctrl.id, handle.dir, e);
            }}
          />
        );
      })}

      {/* Edge handles */}
      {EDGE_HANDLES.map((handle, i) => {
        const midX = x + w / 2 - handleSize;
        const midY = y + h / 2 - handleSize;
        const hx =
          handle.dir === 'w'
            ? x - handleSize
            : handle.dir === 'e'
              ? x + w - handleSize
              : midX;
        const hy =
          handle.dir === 'n'
            ? y - handleSize
            : handle.dir === 's'
              ? y + h - handleSize
              : midY;

        return (
          <div
            key={`edge-${i}`}
            data-handle="resize"
            className="absolute z-20"
            style={{
              left: hx,
              top: hy,
              width: handleSize * 2,
              height: handleSize * 2,
              backgroundColor: '#3b82f6',
              border: '1px solid white',
              borderRadius: 1,
              cursor: handle.cursor,
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onHandleMouseDown(ctrl.id, handle.dir, e);
            }}
          />
        );
      })}

      {/* Label */}
      <div
        className="absolute pointer-events-none z-10"
        style={{
          left: x,
          top: y - 20,
          backgroundColor: '#e94560',
          color: 'white',
          fontSize: 10,
          padding: '1px 4px',
          borderRadius: 2,
          whiteSpace: 'nowrap',
        }}
      >
        {ctrl.className} (IDC: {ctrl.idc})
      </div>
    </>
  );
}

// =============================================================================
// Helpers
// =============================================================================
function computeGroupBBox(
  controls: ControlConfig[],
  gridSystem: GridSystem,
  gridVariant: string,
  canvasW: number,
  canvasH: number,
  uiScale: string
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ctrl of controls) {
    const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, uiScale);
    minX = Math.min(minX, coords.x);
    minY = Math.min(minY, coords.y);
    maxX = Math.max(maxX, coords.x + coords.w);
    maxY = Math.max(maxY, coords.y + coords.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
