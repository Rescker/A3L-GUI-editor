// =============================================================================
// SelectionOverlay — Renders selection handles on selected controls
// Handles fire onHandleMouseDown when a resize corner is grabbed.
// =============================================================================

import React from 'react';
import type { ControlConfig, GridSystem } from '../../types/controls';
import { controlToCanvasCoords } from '../../utils/gridUtils';

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface Props {
  controls: ControlConfig[];
  selectedIds: string[];
  gridSystem: GridSystem;
  gridVariant: string;
  canvasW: number;
  canvasH: number;
  scale: number;
  safeZone: { x: number; y: number; w: number; h: number };
  uiScale: string;
  onHandleMouseDown: (controlId: string, dir: ResizeDir, e: React.MouseEvent) => void;
}

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

export const SelectionOverlay: React.FC<Props> = ({
  controls,
  selectedIds,
  gridSystem,
  gridVariant,
  canvasW,
  canvasH,
  scale,
  safeZone,
  uiScale,
  onHandleMouseDown,
}) => {
  const selectedControls = controls.filter(c => selectedIds.includes(c.id));

  return (
    <>
      {selectedControls.map((ctrl) => {
        const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, uiScale);
        const x = coords.x * scale;
        const y = coords.y * scale;
        const w = coords.w * scale;
        const h = coords.h * scale;
        const handleSize = 6;

        return (
          <div key={`sel-${ctrl.id}`}>
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
          </div>
        );
      })}
    </>
  );
};
