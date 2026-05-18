// =============================================================================
// Grid & Coordinate Conversion Utilities
// Handles all four Arma 3 coordinate systems and their inter-conversion.
// =============================================================================

import type { GridSystem } from '../types/controls';
import { GUI_GRID_VARIANTS, UI_SCALE_FACTORS } from '../data/gridVariants';

// =============================================================================
// SafeZone Simulation
// In Arma 3, safeZone values depend on screen resolution and aspect ratio.
// We simulate standard values for the preview canvas.
// =============================================================================
export function computeSafeZone(
  canvasW: number,
  canvasH: number,
  uiScale: string
): { x: number; y: number; w: number; h: number } {
  const aspectRatio = canvasW / canvasH;
  const scale = UI_SCALE_FACTORS[uiScale] ?? 1.0;

  // Real safeZoneW is typically 1.0 for single monitor
  // safeZoneWAbs accounts for triple-head (min of w/h ratio capped at 1.2)
  const wAbs = Math.min(aspectRatio, 1.2);
  const hAbs = wAbs / 1.2;

  // safeZone origin: centered on screen
  const x = (1.0 - wAbs) / 2;
  const y = (1.0 - hAbs) / 2;

  return { x, y, w: wAbs * scale, h: hAbs * scale };
}

// =============================================================================
// GUI_GRID unit dimensions
// Based on \a3\ui_f\hpp\definecommongrids.inc
// =============================================================================
export function computeGuiGridUnits(safeZone: { x: number; y: number; w: number; h: number }) {
  const wAbs = Math.min(safeZone.w / safeZone.h, 1.2);
  const hAbs = wAbs / 1.2;
  return {
    gridW: wAbs / 40,
    gridH: hAbs / 25,
    gridX: safeZone.x,
    gridY: safeZone.y + safeZone.h - hAbs,
    wAbs,
    hAbs,
  };
}

// =============================================================================
// Pixel Grid units
// Based on \a3\3DEN\UI\macros.inc
// =============================================================================
export function computePixelGridUnits(
  canvasW: number,
  canvasH: number,
  safeZone: { x: number; y: number; w: number; h: number }
) {
  // pixelW = safeZoneW / screenWidth (in UI-space units per pixel)
  const pixelW = safeZone.w / canvasW;
  const pixelH = safeZone.h / canvasH;
  const pixelGrid = 5; // standard pixelGrid value
  const gridW = pixelW * pixelGrid;
  const gridH = pixelH * pixelGrid;
  const centerX = safeZone.x + safeZone.w / 2;
  const centerY = safeZone.y + safeZone.h / 2;
  return { pixelW, pixelH, pixelGrid, gridW, gridH, centerX, centerY };
}

// =============================================================================
// Evaluate a GUI_GRID expression string to a number (relative coords)
// Handles: "N * GUI_GRID_CENTER_W + GUI_GRID_CENTER_X"
//          "N * GUI_GRID_CENTER_W"
//          "N * GUI_GRID_CENTER_W + GUI_GRID_CENTER_X + offset"
// =============================================================================
export function evalGuiGridExpression(
  expr: string,
  safeZone: { x: number; y: number; w: number; h: number },
  variant: string
): number {
  if (typeof expr === 'number') return expr;
  if (!expr || typeof expr !== 'string') return 0;

  const units = computeGuiGridUnits(safeZone);
  const variantDef = GUI_GRID_VARIANTS.find(v => v.name === variant);

  // Build a scope with the relevant variables
  const scope: Record<string, number> = {
    // GUI_GRID unit dimensions
    GUI_GRID_W: units.gridW,
    GUI_GRID_H: units.gridH,
    GUI_GRID_X: units.gridX,
    GUI_GRID_Y: units.gridY,
    GUI_GRID_WAbs: units.wAbs,
    GUI_GRID_HAbs: units.hAbs,
    // SafeZone values (camelCase from game script commands)
    safeZoneX: safeZone.x,
    safeZoneY: safeZone.y,
    safeZoneW: safeZone.w,
    safeZoneH: safeZone.h,
    safeZoneXAbs: safeZone.x,
    safeZoneWAbs: safeZone.w,
    // All-lowercase variants (commonly used in community configs)
    safezoneX: safeZone.x,
    safezoneY: safeZone.y,
    safezoneW: safeZone.w,
    safezoneH: safeZone.h,
    safezoneXAbs: safeZone.x,
    safezoneWAbs: safeZone.w,
    safew: safeZone.w,
    safeh: safeZone.h,
    // Pixel grid aliases
    pixelW: 1 / 1920,
    pixelH: 1 / 1080,
    pixelGrid: 5,
    pixelGridBase: 5,
    pixelGridNoUIScale: 5,
    GRID_W: (1 / 1920) * 5,
    GRID_H: (1 / 1080) * 5,
  };

  // Add grid variant offsets
  if (variantDef) {
    // Parse variant expressions to get actual numerical offsets
    // The grid variants represent origin points with specific offsets
    // GUI_GRID_CENTER_X = safeZoneX + (safezoneW - GUI_GRID_WAbs) / 2 + GUI_GRID_CENTER_W * 20
    // Actually GUI_GRID_CENTER_* are absolute safeZone positions...

    // For simplicity, we compute the offset from center:
    const switchOn = variantDef.name;
    switch (switchOn) {
      case 'GUI_GRID_CENTER':
        scope.GUI_GRID_CENTER_X = safeZone.x + (safeZone.w - units.wAbs) / 2;
        scope.GUI_GRID_CENTER_Y = safeZone.y + (safeZone.h - units.hAbs) / 2;
        scope.GUI_GRID_CENTER_W = units.gridW;
        scope.GUI_GRID_CENTER_H = units.gridH;
        break;
      case 'GUI_GRID_TOPLEFT':
        scope.GUI_GRID_TOPLEFT_X = safeZone.x;
        scope.GUI_GRID_TOPLEFT_Y = safeZone.y;
        scope.GUI_GRID_TOPLEFT_W = units.gridW;
        scope.GUI_GRID_TOPLEFT_H = units.gridH;
        break;
      case 'GUI_GRID_TOPCENTER':
        scope.GUI_GRID_TOPCENTER_X = safeZone.x + (safeZone.w - units.wAbs) / 2;
        scope.GUI_GRID_TOPCENTER_Y = safeZone.y;
        scope.GUI_GRID_TOPCENTER_W = units.gridW;
        scope.GUI_GRID_TOPCENTER_H = units.gridH;
        break;
      case 'GUI_GRID_TOPRIGHT':
        scope.GUI_GRID_TOPRIGHT_X = safeZone.x + safeZone.w - units.gridW;
        scope.GUI_GRID_TOPRIGHT_Y = safeZone.y;
        scope.GUI_GRID_TOPRIGHT_W = units.gridW;
        scope.GUI_GRID_TOPRIGHT_H = units.gridH;
        break;
      case 'GUI_GRID_CENTERRIGHT':
        scope.GUI_GRID_CENTERRIGHT_X = safeZone.x + safeZone.w - units.gridW;
        scope.GUI_GRID_CENTERRIGHT_Y = safeZone.y + (safeZone.h - units.hAbs) / 2;
        scope.GUI_GRID_CENTERRIGHT_W = units.gridW;
        scope.GUI_GRID_CENTERRIGHT_H = units.gridH;
        break;
      case 'GUI_GRID_BOTTOMRIGHT':
        scope.GUI_GRID_BOTTOMRIGHT_X = safeZone.x + safeZone.w - units.gridW;
        scope.GUI_GRID_BOTTOMRIGHT_Y = safeZone.y + safeZone.h - units.gridH;
        scope.GUI_GRID_BOTTOMRIGHT_W = units.gridW;
        scope.GUI_GRID_BOTTOMRIGHT_H = units.gridH;
        break;
      case 'GUI_GRID_BOTTOMCENTER':
        scope.GUI_GRID_BOTTOMCENTER_X = safeZone.x + (safeZone.w - units.wAbs) / 2;
        scope.GUI_GRID_BOTTOMCENTER_Y = safeZone.y + safeZone.h - units.gridH;
        scope.GUI_GRID_BOTTOMCENTER_W = units.gridW;
        scope.GUI_GRID_BOTTOMCENTER_H = units.gridH;
        break;
      case 'GUI_GRID_BOTTOMLEFT':
        scope.GUI_GRID_BOTTOMLEFT_X = safeZone.x;
        scope.GUI_GRID_BOTTOMLEFT_Y = safeZone.y + safeZone.h - units.gridH;
        scope.GUI_GRID_BOTTOMLEFT_W = units.gridW;
        scope.GUI_GRID_BOTTOMLEFT_H = units.gridH;
        break;
      default:
        scope.GUI_GRID_CENTER_X = safeZone.x + (safeZone.w - units.wAbs) / 2;
        scope.GUI_GRID_CENTER_Y = safeZone.y + (safeZone.h - units.hAbs) / 2;
        scope.GUI_GRID_CENTER_W = units.gridW;
        scope.GUI_GRID_CENTER_H = units.gridH;
        break;
    }
  }

  // Simple evaluator — sort by key length DESC to avoid substring corruption
  // (e.g., GUI_GRID_W matching inside GUI_GRID_WAbs before WAbs is replaced)
  try {
    let sanitized = expr.replace(/\s+/g, '');
    const entries = Object.entries(scope).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      sanitized = sanitized.replaceAll(key, String(val));
    }
    // Evaluate the arithmetic expression
    const result = Function(`"use strict"; return (${sanitized});`)();
    return typeof result === 'number' && !isNaN(result) ? result : 0;
  } catch {
    return 0;
  }
}

// =============================================================================
// Convert a grid expression to canvas pixel position
// =============================================================================
export function gridExprToPixel(
  expr: string | number,
  grid: GridSystem,
  variant: string,
  canvasWidth: number,
  canvasHeight: number,
  safeZone: { x: number; y: number; w: number; h: number },
  vertical = false,
  isSize = false
): number {
  const dimension = vertical ? canvasHeight : canvasWidth;

  if (typeof expr === 'number') {
    switch (grid) {
      case 'absolute': {
        // Legacy absolute: origin = top-left of 4:3 area centered on screen.
        // x/y positions include the letterbox offset; w/h sizes do NOT.
        const ar43Width = canvasHeight * (4 / 3);
        const effectiveW = Math.min(canvasWidth, ar43Width);
        if (vertical) {
          return expr * canvasHeight;
        }
        const base = expr * effectiveW;
        return isSize ? base : (canvasWidth - ar43Width) / 2 + base;
      }
      case 'safezone':
        if (vertical) {
          return (safeZone.y + expr * safeZone.h) * canvasHeight;
        }
        if (isSize) return expr * safeZone.w * canvasWidth;
        return (safeZone.x + expr * safeZone.w) * canvasWidth;
      case 'gui_grid': {
        const val = evalGuiGridExpression(String(expr), safeZone, variant);
        return val * dimension;
      }
      case 'pixel_grid': {
        const units = computePixelGridUnits(canvasWidth, canvasHeight, safeZone);
        if (vertical) {
          if (isSize) return expr * units.gridH * canvasHeight;
          return (safeZone.y * canvasHeight) + expr * units.gridH * canvasHeight;
        }
        if (isSize) return expr * units.gridW * canvasWidth;
        return (safeZone.x * canvasWidth) + expr * units.gridW * canvasWidth;
      }
      default:
        return expr * dimension;
    }
  }

  if (typeof expr === 'string') {
    const val = evalGuiGridExpression(expr, safeZone, variant);
    // String expressions in absolute mode: size = no letterbox, position = with letterbox
    if (grid === 'absolute') {
      const ar43Width = canvasHeight * (4 / 3);
      const effectiveW = Math.min(canvasWidth, ar43Width);
      if (vertical) {
        return val * canvasHeight;
      }
      const base = val * effectiveW;
      return isSize ? base : (canvasWidth - ar43Width) / 2 + base;
    }
    return val * dimension;
  }

  return 0;
}

// =============================================================================
// Convert canvas pixel position to grid expression string
// =============================================================================
export function pixelToGridExpr(
  px: number,
  py: number,
  w: number,
  h: number,
  grid: GridSystem,
  variant: string,
  canvasWidth: number,
  canvasHeight: number
): { x: string; y: string; w: string; h: string } {
  const relX = px / canvasWidth;
  const relY = py / canvasHeight;
  const relW = w / canvasWidth;
  const relH = h / canvasHeight;

  const safeZone = computeSafeZone(canvasWidth, canvasHeight, 'normal');
  const units = computeGuiGridUnits(safeZone);

  switch (grid) {
    case 'absolute':
      return {
        x: roundFloat(relX).toString(),
        y: roundFloat(relY).toString(),
        w: roundFloat(relW).toString(),
        h: roundFloat(relH).toString(),
      };
    case 'safezone':
      return {
        x: roundFloat(relX - safeZone.x / safeZone.w).toString(),
        y: roundFloat(relY - safeZone.y / safeZone.h).toString(),
        w: roundFloat(relW / safeZone.w).toString(),
        h: roundFloat(relH / safeZone.h).toString(),
      };
    case 'gui_grid': {
      // Find grid unit values relative to variant origin
      const gridUnits = computeGuiGridUnits(safeZone);
      const variantGridX = evalGuiGridExpression(`0.0`, safeZone, variant);
      const variantGridY = evalGuiGridExpression(`0.0`, safeZone, variant);

      const xGrid = (relX - variantGridX) / gridUnits.gridW;
      const yGrid = (relY - variantGridY) / gridUnits.gridH;
      const wGrid = relW / gridUnits.gridW;
      const hGrid = relH / gridUnits.gridH;

      const varXExpr = `${variant}_X`;
      const varYExpr = `${variant}_Y`;
      const varWExpr = `${variant}_W`;
      const varHExpr = `${variant}_H`;

      return {
        x: `${roundFloat(xGrid)} * ${varWExpr} + ${varXExpr}`,
        y: `${roundFloat(yGrid)} * ${varHExpr} + ${varYExpr}`,
        w: `${roundFloat(wGrid)} * ${varWExpr}`,
        h: `${roundFloat(hGrid)} * ${varHExpr}`,
      };
    }
    case 'pixel_grid': {
      const pxUnits = computePixelGridUnits(canvasWidth, canvasHeight, safeZone);
      const xPxGrid = roundFloat((relX - safeZone.x) / pxUnits.gridW);
      const yPxGrid = roundFloat((relY - safeZone.y) / pxUnits.gridH);
      const wPxGrid = roundFloat(relW / pxUnits.gridW);
      const hPxGrid = roundFloat(relH / pxUnits.gridH);

      return {
        x: `${xPxGrid} * GRID_W + safeZoneX`,
        y: `${yPxGrid} * GRID_H + safeZoneY`,
        w: `${wPxGrid} * GRID_W`,
        h: `${hPxGrid} * GRID_H`,
      };
    }
  }
}

// =============================================================================
// Convert grid values to canvas pixels for rendering
// =============================================================================
export function controlToCanvasCoords(
  control: { x: string | number; y: string | number; w: string | number; h: string | number },
  grid: GridSystem,
  variant: string,
  canvasWidth: number,
  canvasHeight: number,
  uiScale: string
): { x: number; y: number; w: number; h: number } {
  const safeZone = computeSafeZone(canvasWidth, canvasHeight, uiScale);

  return {
    x: gridExprToPixel(control.x, grid, variant, canvasWidth, canvasHeight, safeZone, false, false),
    y: gridExprToPixel(control.y, grid, variant, canvasWidth, canvasHeight, safeZone, true, false),
    w: gridExprToPixel(control.w, grid, variant, canvasWidth, canvasHeight, safeZone, false, true),
    h: gridExprToPixel(control.h, grid, variant, canvasWidth, canvasHeight, safeZone, true, true),
  };
}

// =============================================================================
// Helpers
// =============================================================================
function roundFloat(val: number, decimals = 4): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export { roundFloat };
