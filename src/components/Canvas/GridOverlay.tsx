// =============================================================================
// GridOverlay — Renders grid lines on the canvas
// Handles GUI_GRID (40×25), SafeZone (10% increments), and Pixel Grid.
// =============================================================================

import React from 'react';
import type { GridSystem } from '../../types/controls';

interface Props {
  gridSystem: GridSystem;
  canvasW: number;
  canvasH: number;
  scale: number;
  safeZone: { x: number; y: number; w: number; h: number };
}

export const GridOverlay: React.FC<Props> = ({ gridSystem, canvasW, canvasH, scale, safeZone }) => {
  const lines: React.ReactNode[] = [];

  if (gridSystem === 'gui_grid') {
    // 40 columns × 25 rows
    const cols = 40;
    const rows = 25;
    const cellW = (safeZone.w * canvasW * scale) / cols;
    const cellH = (safeZone.h * canvasH * scale) / rows;
    const originX = safeZone.x * canvasW * scale;
    const originY = safeZone.y * canvasH * scale;

    for (let i = 0; i <= cols; i++) {
      const x = originX + i * cellW;
      lines.push(
        <div
          key={`cv-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: x,
            top: originY,
            width: 1,
            height: safeZone.h * canvasH * scale,
            backgroundColor: i % 10 === 0 ? 'rgba(0,180,216,0.15)' : 'rgba(0,180,216,0.06)',
          }}
        />
      );
    }
    for (let j = 0; j <= rows; j++) {
      const y = originY + j * cellH;
      lines.push(
        <div
          key={`ch-${j}`}
          className="absolute pointer-events-none"
          style={{
            left: originX,
            top: y,
            height: 1,
            width: safeZone.w * canvasW * scale,
            backgroundColor: j % 5 === 0 ? 'rgba(0,180,216,0.15)' : 'rgba(0,180,216,0.06)',
          }}
        />
      );
    }
  } else if (gridSystem === 'safezone') {
    // 10% increments across safeZone
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const x = (safeZone.x + safeZone.w * (i / steps)) * canvasW * scale;
      const y = (safeZone.y + safeZone.h * (i / steps)) * canvasH * scale;
      const w = safeZone.w * canvasW * scale;
      const h = safeZone.h * canvasH * scale;
      const sx = safeZone.x * canvasW * scale;
      const sy = safeZone.y * canvasH * scale;

      lines.push(
        <div key={`sv-${i}`} className="absolute pointer-events-none" style={{ left: x, top: sy, width: 1, height: h, backgroundColor: 'rgba(0,180,216,0.1)' }} />
      );
      lines.push(
        <div key={`sh-${i}`} className="absolute pointer-events-none" style={{ left: sx, top: y, height: 1, width: w, backgroundColor: 'rgba(0,180,216,0.1)' }} />
      );
    }
  } else if (gridSystem === 'absolute') {
    // 10% increments across entire screen
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const p = (i / steps) * 100;
      lines.push(
        <div key={`av-${i}`} className="absolute pointer-events-none" style={{ left: `${p}%`, top: 0, width: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
      );
      lines.push(
        <div key={`ah-${i}`} className="absolute pointer-events-none" style={{ left: 0, top: `${p}%`, height: 1, width: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
      );
    }
  }

  return <>{lines}</>;
};
