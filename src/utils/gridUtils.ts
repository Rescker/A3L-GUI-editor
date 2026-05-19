// =============================================================================
// Grid & Coordinate Conversion Utilities
// Engine-Accurate math for Arma 3 UI coordinate systems.
// =============================================================================

import type { GridSystem } from '../types/controls';
import { GUI_GRID_VARIANTS, UI_SCALE_FACTORS } from '../data/gridVariants';

// =============================================================================
// SafeZone Simulation (Engine Accurate com margens reais)
// =============================================================================
export function computeSafeZone(
  canvasW: number,
  canvasH: number,
  uiScale: string
): { x: number; y: number; w: number; h: number } {
  
  // A MÁGICA TÁ AQUI: Ajustando a "altura" da tela com base no que você seleciona.
  // 1.4 simula o UI Size "Small" do Arma 3, que é o que cria aquelas margens 
  // gigantes do seu print in-game, já que seu ATM tem h=1.
  let safeH = 1.4; 

  // Ajusta dinamicamente se você mudar aquele dropdown no seu painel
  if (uiScale.includes('Normal')) safeH = 1.2; // Deixa uma margem média
  if (uiScale.includes('Small')) safeH = 1.4;  // Margens gigantes (idêntico ao seu in-game)
  if (uiScale.includes('Large')) safeH = 1.0;  // Engole as margens (cola no teto)
  
  // No Arma, 1 unidade de X sempre equivale a 4/3 unidades de Y
  const scaleY = canvasH / safeH;
  const scaleX = scaleY * (4 / 3); 
  
  // Calcula a largura total da tela nas unidades do Arma
  const safeW = canvasW / scaleX;
  
  // Centraliza o grid base (1.0 x 1.0) no meio do seu monitor
  const safeX = (1.0 - safeW) / 2;
  const safeY = (1.0 - safeH) / 2;

  return { x: safeX, y: safeY, w: safeW, h: safeH };
}

// =============================================================================
// GUI_GRID unit dimensions
// =============================================================================
export function computeGuiGridUnits(safeZone: { x: number; y: number; w: number; h: number }) {
  const ratio = safeZone.w / safeZone.h;
  const wAbs = Math.min(ratio, 1.2);
  const hAbs = wAbs / 1.2;
  
  return {
    gridW: wAbs / 40,
    gridH: hAbs / 25,
    gridX: safeZone.x + (safeZone.w - wAbs) / 2,
    gridY: safeZone.y + (safeZone.h - hAbs) / 2,
    wAbs,
    hAbs,
  };
}

// =============================================================================
// Pixel Grid units
// =============================================================================
export function computePixelGridUnits(
  canvasW: number,
  canvasH: number,
  safeZone: { x: number; y: number; w: number; h: number }
) {
  const scaleY = canvasH / safeZone.h;
  const scaleX = scaleY * (4 / 3);
  
  const pixelGrid = 5;
  const gridW = (1 / scaleX) * pixelGrid;
  const gridH = (1 / scaleY) * pixelGrid;
  const centerX = safeZone.x + safeZone.w / 2;
  const centerY = safeZone.y + safeZone.h / 2;
  
  return { pixelW: 1/scaleX, pixelH: 1/scaleY, pixelGrid, gridW, gridH, centerX, centerY };
}

// =============================================================================
// Evaluate a GUI_GRID expression string
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

  const scope: Record<string, number> = {
    GUI_GRID_W: units.gridW,
    GUI_GRID_H: units.gridH,
    GUI_GRID_X: units.gridX,
    GUI_GRID_Y: units.gridY,
    GUI_GRID_WAbs: units.wAbs,
    GUI_GRID_HAbs: units.hAbs,
    safeZoneX: safeZone.x,
    safeZoneY: safeZone.y,
    safeZoneW: safeZone.w,
    safeZoneH: safeZone.h,
    safeZoneXAbs: safeZone.x,
    safeZoneWAbs: safeZone.w,
    safeZoneXA: safeZone.x + safeZone.w,
    safezoneX: safeZone.x,
    safezoneY: safeZone.y,
    safezoneW: safeZone.w,
    safezoneH: safeZone.h,
    safew: safeZone.w,
    safeh: safeZone.h,
  };

  if (variantDef) {
    const switchOn = variantDef.name;
    switch (switchOn) {
      case 'GUI_GRID_CENTER':
      default:
        scope.GUI_GRID_CENTER_X = units.gridX;
        scope.GUI_GRID_CENTER_Y = units.gridY;
        scope.GUI_GRID_CENTER_W = units.gridW;
        scope.GUI_GRID_CENTER_H = units.gridH;
        break;
      case 'GUI_GRID_TOPLEFT':
        scope.GUI_GRID_TOPLEFT_X = safeZone.x;
        scope.GUI_GRID_TOPLEFT_Y = safeZone.y;
        scope.GUI_GRID_TOPLEFT_W = units.gridW;
        scope.GUI_GRID_TOPLEFT_H = units.gridH;
        break;
      case 'GUI_GRID_BOTTOMRIGHT':
        scope.GUI_GRID_BOTTOMRIGHT_X = safeZone.x + safeZone.w - units.gridW;
        scope.GUI_GRID_BOTTOMRIGHT_Y = safeZone.y + safeZone.h - units.gridH;
        scope.GUI_GRID_BOTTOMRIGHT_W = units.gridW;
        scope.GUI_GRID_BOTTOMRIGHT_H = units.gridH;
        break;
    }
  }

  try {
    let sanitized = expr.replace(/\s+/g, '');
    const entries = Object.entries(scope).sort((a, b) => b[0].length - a[0].length);
    for (const [key, val] of entries) {
      sanitized = sanitized.replaceAll(key, String(val));
    }
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
  const scaleY = canvasHeight / safeZone.h;
  const scaleX = scaleY * (4 / 3);

  // Calcula o valor final no sistema métrico do Arma (seja via macro ou número puro)
  const val = typeof expr === 'string' ? evalGuiGridExpression(expr, safeZone, variant) : expr;

  switch (grid) {
    case 'pixel_grid': {
      const units = computePixelGridUnits(canvasWidth, canvasHeight, safeZone);
      if (vertical) {
        if (isSize) return val * units.gridH * canvasHeight;
        return (safeZone.y * canvasHeight) + val * units.gridH * canvasHeight;
      }
      if (isSize) return val * units.gridW * canvasWidth;
      return (safeZone.x * canvasWidth) + val * units.gridW * canvasWidth;
    }

    // A MÁGICA ESTÁ AQUI: Absolute, SafeZone e GUI_GRID usam EXATAMENTE
    // a mesma matemática de renderização por baixo dos panos na engine!
    case 'absolute':
    case 'safezone':
    case 'gui_grid':
    default:
      if (vertical) {
        return isSize ? (val * scaleY) : ((val - safeZone.y) * scaleY);
      } else {
        return isSize ? (val * scaleX) : ((val - safeZone.x) * scaleX);
      }
  }
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
  canvasHeight: number,
  uiScale: string
): { x: string; y: string; w: string; h: string } {
  const safeZone = computeSafeZone(canvasWidth, canvasHeight, uiScale);
  const scaleY = canvasHeight / safeZone.h;
  const scaleX = scaleY * (4 / 3);

  // Converte de pixels brutos da tela web de volta para coordenadas globais do Arma
  const armaX = (px / scaleX) + safeZone.x;
  const armaY = (py / scaleY) + safeZone.y;
  const armaW = w / scaleX;
  const armaH = h / scaleY;

  switch (grid) {
    case 'absolute':
      // O Absolute armazena o número cru sem compensar as bordas do SafeZone
      return {
        x: roundFloat(armaX).toString(),
        y: roundFloat(armaY).toString(),
        w: roundFloat(armaW).toString(),
        h: roundFloat(armaH).toString(),
      };
      
    case 'safezone':
      // O SafeZone compensa as bordas negativadas para que o script final fique "safeZoneX + ..."
      // AGORA SIM: A string vai formatada com a matemática macro real do Arma!
      return {
        x: `${roundFloat((armaX - safeZone.x) / safeZone.w)} * safezoneW + safezoneX`,
        y: `${roundFloat((armaY - safeZone.y) / safeZone.h)} * safezoneH + safezoneY`,
        w: `${roundFloat(armaW / safeZone.w)} * safezoneW`,
        h: `${roundFloat(armaH / safeZone.h)} * safezoneH`,
      };
      
    case 'gui_grid': {
      const gridUnits = computeGuiGridUnits(safeZone);
      const varOriginX = evalGuiGridExpression(`${variant}_X`, safeZone, variant);
      const varOriginY = evalGuiGridExpression(`${variant}_Y`, safeZone, variant);

      const xGrid = (armaX - varOriginX) / gridUnits.gridW;
      const yGrid = (armaY - varOriginY) / gridUnits.gridH;
      const wGrid = armaW / gridUnits.gridW;
      const hGrid = armaH / gridUnits.gridH;

      const varWExpr = `${variant}_W`;
      const varHExpr = `${variant}_H`;

      return {
        x: `${roundFloat(xGrid)} * ${varWExpr} + ${variant}_X`,
        y: `${roundFloat(yGrid)} * ${varHExpr} + ${variant}_Y`,
        w: `${roundFloat(wGrid)} * ${varWExpr}`,
        h: `${roundFloat(hGrid)} * ${varHExpr}`,
      };
    }
    case 'pixel_grid': {
      return { x: '0', y: '0', w: '0', h: '0' }; // Simplificado
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

export function roundFloat(val: number, decimals = 4): number {
  return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function computePixelToGridScale(
  canvasWidth: number,
  canvasHeight: number,
  uiScale: string
): { scaleX: number; scaleY: number } {
  const safeZone = computeSafeZone(canvasWidth, canvasHeight, uiScale);
  const scaleY = canvasHeight / safeZone.h;
  const scaleX = scaleY * (4 / 3);
  return { scaleX, scaleY };
}

export function applyExpressionDelta(expr: string | number, delta: number): string | number {
  if (typeof expr === 'number') return roundFloat(expr + delta);

  const trimmed = expr.trim();

  // Caso "NUMBER + REST" ou "NUMBER - REST" — ajusta apenas o primeiro número
  const match = trimmed.match(/^([\d.-]+)\s*(\s*[+-]\s*.+)$/);
  if (match) {
    const baseVal = parseFloat(match[1]);
    const rest = match[2];
    if (!isNaN(baseVal)) {
      const newVal = roundFloat(baseVal + delta);
      return `${newVal}${rest}`;
    }
  }

  // Caso "+NUMBER" isolado — ajusta o número com sinal
  const signMatch = trimmed.match(/^([+-])\s*([\d.]+)\s*$/);
  if (signMatch) {
    const sign = signMatch[1];
    const val = parseFloat(signMatch[2]);
    if (!isNaN(val)) {
      const newVal = roundFloat((sign === '-' ? -val : val) + delta);
      return roundFloat(newVal).toString();
    }
  }

  // Fallback: avalia a expressão, aplica delta, retorna número puro
  const evalResult = tryEvalNumber(trimmed);
  if (evalResult !== null) {
    return roundFloat(evalResult + delta).toString();
  }

  return roundFloat(parseFloat(trimmed) + delta).toString();
}

function tryEvalNumber(expr: string): number | null {
  try {
    const result = Function(`"use strict"; return (${expr.replace(/\s+/g, '')});`)();
    return typeof result === 'number' && !isNaN(result) ? result : null;
  } catch {
    return null;
  }
}