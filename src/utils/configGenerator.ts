// =============================================================================
// Config Generator — Produces Arma 3 config.cpp / description.ext output
// Supports multiple output formats matching the official GUI editor.
// =============================================================================

import type { ControlConfig, DialogConfig, GeneratorOptions } from '../types/controls';
import { hasStyleFlag } from './styleUtils';

// =============================================================================
// Main generation entry point
// =============================================================================
export function generateDialogConfig(dialog: DialogConfig, options: Partial<GeneratorOptions> = {}): string {
  const opts: GeneratorOptions = {
    format: 'full_dialog',
    gridSystem: 'gui_grid',
    gridVariant: 'GUI_GRID_CENTER',
    indentSize: 2,
    useInheritance: true,
    emitIncludes: false,
    usePreprocessorColors: false,
    exportZone: 'all',
    tabCount: 1,
    ...options,
  };

  let output = '';
  if (opts.emitIncludes) {
    output += generateIncludes(opts);
    output += '\n';
  }

  if (opts.usePreprocessorColors) {
    output += generateColorDefines();
    output += '\n';
  }

  switch (opts.format) {
    case 'class':
      return output + generateControlClasses(dialog, opts);
    case 'full_dialog':
      return output + generateFullDialog(dialog, opts);
    case 'hud':
      return output + generateHUD(dialog, opts);
    case 'editor_format':
      return generateEditorFormat(dialog, opts);
    default:
      return '';
  }
}

// =============================================================================
// Format: Full Dialog Wrapper
// =============================================================================
function generateFullDialog(dialog: DialogConfig, opts: GeneratorOptions): string {
  const lines: string[] = [];
  const tab = ' '.repeat(opts.indentSize);

  lines.push(`class ${dialog.className}`);
  lines.push('{');
  lines.push(`${tab}idd = ${dialog.idd};`);
  lines.push(`${tab}movingEnable = ${dialog.movingEnable ? 1 : 0};`);

  if (dialog.containerType !== 'hud') {
    lines.push(`${tab}enableSimulation = ${dialog.enableSimulation ? 1 : 0};`);
  }

  if (dialog.onLoad) {
    lines.push(`${tab}onLoad = "${escapeString(dialog.onLoad)}";`);
  }
  if (dialog.onUnload) {
    lines.push(`${tab}onUnload = "${escapeString(dialog.onUnload)}";`);
  }

  // Display-level event handlers
  for (const eh of dialog.eventHandlers) {
    lines.push(`${tab}${eh.event} = "${escapeString(eh.code)}";`);
  }

  // HUD-only properties
  if (dialog.containerType === 'hud') {
    lines.push(`${tab}fadeIn = ${dialog.fadeIn ?? 0};`);
    lines.push(`${tab}fadeOut = ${dialog.fadeOut ?? 0};`);
    lines.push(`${tab}duration = ${dialog.duration ?? 1e11};`);
  }

  // Controls Background
  if (dialog.controlsBackground.length > 0 && opts.exportZone !== 'controls' && opts.exportZone !== 'objects') {
    lines.push(`${tab}class ControlsBackground`);
    lines.push(`${tab}{`);
    for (const ctrl of dialog.controlsBackground) {
      lines.push(...generateControlClass(ctrl, opts, 2));
    }
    lines.push(`${tab}};`);
  }

  // Controls
  if (dialog.controls.length > 0 && opts.exportZone !== 'background' && opts.exportZone !== 'objects') {
    lines.push(`${tab}class Controls`);
    lines.push(`${tab}{`);
    for (const ctrl of dialog.controls) {
      lines.push(...generateControlClass(ctrl, opts, 2));
    }
    lines.push(`${tab}};`);
  }

  // Objects
  if (dialog.objects.length > 0 && (opts.exportZone === 'all' || opts.exportZone === 'objects')) {
    lines.push(`${tab}class Objects`);
    lines.push(`${tab}{`);
    for (const ctrl of dialog.objects) {
      lines.push(...generateControlClass(ctrl, opts, 2));
    }
    lines.push(`${tab}};`);
  }

  lines.push('};');
  return lines.join('\n');
}

// =============================================================================
// Format: HUD (RscTitles Wrapper)
// =============================================================================
function generateHUD(dialog: DialogConfig, opts: GeneratorOptions): string {
  const lines: string[] = [];
  const tab = ' '.repeat(opts.indentSize);

  lines.push('class RscTitles');
  lines.push('{');
  lines.push(...generateFullDialog(dialog, opts).split('\n').map(l => `${tab}${l}`));
  lines.push('};');
  return lines.join('\n');
}

// =============================================================================
// Format: Control Classes (no dialog wrapper)
// =============================================================================
function generateControlClasses(dialog: DialogConfig, opts: GeneratorOptions): string {
  const lines: string[] = [];
  const allControls = getExportControls(dialog, opts);

  for (const ctrl of allControls) {
    lines.push(...generateControlClass(ctrl, opts, 0));
  }
  return lines.join('\n');
}

// =============================================================================
// Format: Editor Format ($[...])
// =============================================================================
function generateEditorFormat(dialog: DialogConfig, opts: GeneratorOptions): string {
  const gridDef = JSON.stringify([['x', 'y', 'w', 'h'], 40, 25, 'GUI_GRID_CENTER']);
  const controls: string[] = [];
  const allControls = getExportControls(dialog, opts);

  for (const ctrl of allControls) {
    const entry: unknown[] = [
      ctrl.className,
      ctrl.parentClass,
      ctrl.type,
      ctrl.style,
      ctrl.x,
      ctrl.y,
      ctrl.w,
      ctrl.h,
      ctrl.sizeEx,
      ctrl.font,
      // ... more fields as needed
    ];
    controls.push(`\t${JSON.stringify(entry)}`);
  }

  return `$[1, ${gridDef},\n${controls.join(',\n')}\n]`;
}

// =============================================================================
// Generate a single control class
// =============================================================================
function generateControlClass(ctrl: ControlConfig, opts: GeneratorOptions, depth: number): string[] {
  const lines: string[] = [];
  const tab = ' '.repeat(opts.indentSize * (depth + opts.tabCount));
  const indent = ' '.repeat(opts.indentSize * (depth + opts.tabCount + 1));

  // idc comment for special IDCs
  const specialComments: Record<number, string> = {
    1: ' // IDC_OK — closes dialog, exit code 1',
    2: ' // IDC_CANCEL — closes dialog, exit code 2',
    3: ' // IDC_AUTOCANCEL',
    4: ' // IDC_ABORT',
    5: ' // IDC_RESTART',
    6: ' // IDC_USER_BUTTON',
    7: ' // IDC_EXIT_TO_MAIN',
  };

  if (opts.useInheritance && ctrl.parentClass) {
    lines.push(`${tab}class ${ctrl.className} : ${ctrl.parentClass}`);
  } else {
    lines.push(`${tab}class ${ctrl.className}`);
  }
  lines.push(`${tab}{`);

  // IDC
  const idcComment = specialComments[ctrl.idc] ?? '';
  if (ctrl.idc === -1) {
    lines.push(`${indent}idc = -1;${idcComment}`);
  } else {
    lines.push(`${indent}idc = ${ctrl.idc};${idcComment}`);
  }

  // Type (only emit if not inherited or explicit)
  if (!opts.useInheritance) {
    const typeName = getTypeConstant(ctrl.type);
    lines.push(`${indent}type = ${typeName};`);
  }

  // Style
  if (ctrl.style !== 0 || !opts.useInheritance) {
    if (!opts.useInheritance || ctrl.style !== 0) {
      lines.push(`${indent}style = ${styleFlagsToHex(ctrl.style)};`);
    }
  }

  // Position & Size — emit as expression or number
  lines.push(`${indent}x = ${formatCoordExpr(ctrl.x)};`);
  lines.push(`${indent}y = ${formatCoordExpr(ctrl.y)};`);
  lines.push(`${indent}w = ${formatCoordExpr(ctrl.w)};`);
  lines.push(`${indent}h = ${formatCoordExpr(ctrl.h)};`);

  // Font & size
  if (ctrl.font) {
    lines.push(`${indent}font = "${escapeString(ctrl.font)}";`);
  }
  if (ctrl.sizeEx) {
    lines.push(`${indent}sizeEx = ${ctrl.sizeEx};`);
  }

  // Colors
  if (!arraysEqual(ctrl.colorText, [1, 1, 1, 1])) {
    lines.push(`${indent}colorText[] = {${ctrl.colorText.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (!arraysEqual(ctrl.colorBackground, [0, 0, 0, 0])) {
    lines.push(`${indent}colorBackground[] = {${ctrl.colorBackground.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (ctrl.colorDisabled && !arraysEqual(ctrl.colorDisabled, [1, 1, 1, 0.25])) {
    lines.push(`${indent}colorDisabled[] = {${ctrl.colorDisabled.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (ctrl.colorBackgroundActive) {
    lines.push(`${indent}colorBackgroundActive[] = {${ctrl.colorBackgroundActive.map(v => v.toFixed(2)).join(', ')}};`);
  }

  // Text
  if (ctrl.text) {
    lines.push(`${indent}text = "${escapeString(ctrl.text)}";`);
  }

  // Shadow
  if (ctrl.shadow !== 0) {
    lines.push(`${indent}shadow = ${ctrl.shadow};`);
  }

  // Tooltip
  if (ctrl.tooltip) {
    lines.push(`${indent}tooltip = "${escapeString(ctrl.tooltip)}";`);
  }
  if (ctrl.tooltipColorText) {
    lines.push(`${indent}tooltipColorText[] = {${ctrl.tooltipColorText.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (ctrl.tooltipColorBox) {
    lines.push(`${indent}tooltipColorBox[] = {${ctrl.tooltipColorBox.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (ctrl.tooltipColorShade) {
    lines.push(`${indent}tooltipColorShade[] = {${ctrl.tooltipColorShade.map(v => v.toFixed(2)).join(', ')}};`);
  }

  // Behavior
  if (ctrl.moving) {
    lines.push(`${indent}moving = 1;`);
  }
  if (ctrl.url) {
    lines.push(`${indent}url = "${escapeString(ctrl.url)}";`);
  }
  if (ctrl.overlayMode !== undefined) {
    lines.push(`${indent}overlayMode = ${ctrl.overlayMode};`);
  }
  if (ctrl.canDrag !== undefined) {
    lines.push(`${indent}canDrag = ${ctrl.canDrag ? 1 : 0};`);
  }
  if (ctrl.deletable !== undefined) {
    lines.push(`${indent}deletable = ${ctrl.deletable};`);
  }
  if (ctrl.fade !== undefined) {
    lines.push(`${indent}fade = ${ctrl.fade};`);
  }
  if (ctrl.access !== undefined) {
    lines.push(`${indent}access = ${ctrl.access};`);
  }
  if (ctrl.onLoad) {
    lines.push(`${indent}onLoad = "${escapeString(ctrl.onLoad)}";`);
  }

  // ST_MULTI lineSpacing
  if (hasStyleFlag(ctrl.style, 0x10) && ctrl.lineSpacing !== undefined) {
    lines.push(`${indent}lineSpacing = ${ctrl.lineSpacing};`);
  }

  // ST_TILE_PICTURE tileH/tileW
  if (hasStyleFlag(ctrl.style, 0x90)) {
    if (ctrl.tileH !== undefined) {
      lines.push(`${indent}tileH = ${ctrl.tileH};`);
    }
    if (ctrl.tileW !== undefined) {
      lines.push(`${indent}tileW = ${ctrl.tileW};`);
    }
  }

  // Event handlers
  for (const eh of ctrl.eventHandlers) {
    lines.push(`${indent}${eh.event} = "${escapeString(eh.code)}";`);
  }

  // Children (CT_CONTROLS_GROUP)
  if (ctrl.type === 15 && ctrl.children && ctrl.children.length > 0) {
    lines.push(`${indent}class Controls`);
    lines.push(`${indent}{`);
    for (const child of ctrl.children) {
      lines.push(...generateControlClass(child, opts, depth + 2));
    }
    lines.push(`${indent}};`);
  }

  lines.push(`${tab}};`);
  return lines;
}

// =============================================================================
// Helpers
// =============================================================================
function generateIncludes(opts: GeneratorOptions): string {
  const includes: string[] = [];
  if (opts.gridSystem === 'gui_grid') {
    includes.push('#include "\\a3\\ui_f\\hpp\\definecommongrids.inc"');
  }
  if (opts.gridSystem === 'pixel_grid') {
    includes.push('#include "\\a3\\3DEN\\UI\\macros.inc"');
    includes.push('#include "\\a3\\3DEN\\UI\\macroexecs.inc"');
  }
  includes.push('#include "\\a3\\ui_f\\hpp\\defineresincl.inc"');
  includes.push('#include "\\a3\\ui_f\\hpp\\definedikcodes.inc"');
  return includes.join('\n');
}

function generateColorDefines(): string {
  return [
    '#define COLOR_BLACK {0, 0, 0, 1}',
    '#define COLOR_WHITE {1, 1, 1, 1}',
    '#define COLOR_HALF_BLACK {0, 0, 0, 0.5}',
    '#define COLOR_TRANSPARENT {0, 0, 0, 0}',
    '#define COLOR_MAIN_BG {0.05, 0.05, 0.05, 1}',
    '#define COLOR_ACTIVE {0.93, 0.36, 0.27, 1}',
    '#define COLOR_TEXT {1, 0.98, 0.94, 1}',
  ].join('\n');
}

export function formatCoordExpr(expr: string | number): string {
  if (typeof expr === 'number') {
    return expr.toString();
  }
  // If expression contains operators, wrap in quotes
  if (/[*+\-/]/.test(expr) || expr.includes(' ')) {
    return `"${expr}"`;
  }
  // Try parse as number
  const num = parseFloat(expr);
  if (!isNaN(num) && String(num) === expr.trim()) {
    return String(num);
  }
  return `"${expr}"`;
}

export function styleFlagsToHex(style: number): string {
  return `0x${style.toString(16).toUpperCase().padStart(2, '0')}`;
}

function getTypeConstant(type: number): string {
  const map: Record<number, string> = {
    0: 'CT_STATIC', 1: 'CT_BUTTON', 2: 'CT_EDIT', 3: 'CT_SLIDER',
    4: 'CT_COMBO', 5: 'CT_LISTBOX', 6: 'CT_TOOLBOX', 7: 'CT_CHECKBOXES',
    8: 'CT_PROGRESS', 9: 'CT_HTML', 11: 'CT_ACTIVETEXT', 12: 'CT_TREE',
    13: 'CT_STRUCTURED_TEXT', 14: 'CT_CONTEXT_MENU', 15: 'CT_CONTROLS_GROUP',
    16: 'CT_SHORTCUTBUTTON', 41: 'CT_XBUTTON', 43: 'CT_XSLIDER',
    44: 'CT_XCOMBO', 45: 'CT_XLISTBOX', 77: 'CT_CHECKBOX',
    80: 'CT_OBJECT', 81: 'CT_OBJECT_ZOOM', 82: 'CT_OBJECT_CONTAINER',
    83: 'CT_OBJECT_CONT_ANIM', 100: 'CT_MAP', 101: 'CT_MAP_MAIN',
    102: 'CT_LISTNBOX', 104: 'CT_MAP_ALT',
  };
  return map[type] ?? String(type);
}

function escapeString(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < 0.001);
}

function getExportControls(dialog: DialogConfig, opts: GeneratorOptions): ControlConfig[] {
  switch (opts.exportZone) {
    case 'background':
      return dialog.controlsBackground;
    case 'controls':
      return dialog.controls;
    case 'objects':
      return dialog.objects;
    case 'all':
    default:
      return [...dialog.controlsBackground, ...dialog.controls, ...dialog.objects];
  }
}
