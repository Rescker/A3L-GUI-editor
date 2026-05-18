// =============================================================================
// SelectionOverlay — Renders selection handles on selected controls
// =============================================================================

import React from 'react';
import type { ControlConfig, GridSystem } from '../../types/controls';
import { controlToCanvasCoords } from '../../utils/gridUtils';

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
}

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
          <div key={`sel-${ctrl.id}`} className="pointer-events-none">
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
            {[
              { cursor: 'nw-resize', left: x - handleSize, top: y - handleSize },
              { cursor: 'ne-resize', left: x + w, top: y - handleSize },
              { cursor: 'sw-resize', left: x - handleSize, top: y + h },
              { cursor: 'se-resize', left: x + w, top: y + h },
            ].map((handle, i) => (
              <div
                key={i}
                data-handle="resize"
                className="absolute z-10 pointer-events-auto"
                style={{
                  left: handle.left,
                  top: handle.top,
                  width: handleSize * 2,
                  height: handleSize * 2,
                  backgroundColor: '#e94560',
                  border: '1px solid white',
                  borderRadius: 1,
                  cursor: handle.cursor,
                }}
              />
            ))}

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
