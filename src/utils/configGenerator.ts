// =============================================================================
// Config Generator — Produces Arma 3 config.cpp / description.ext output
// Supports multiple output formats matching the official GUI editor.
// =============================================================================

import type { ControlConfig, DialogConfig, GeneratorOptions, ColorArray, SoundEntry } from '../types/controls';
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

  // Inheritance-aware: when using a parent class, only emit explicitly-set properties
  const explicit = ctrl.explicitProperties ?? [];
  const isInherited = opts.useInheritance && !!ctrl.parentClass;
  const shouldEmit = (propName: string): boolean => {
    if (!isInherited) return true;
    return explicit.includes(propName);
  };
  // Always emit position/size, idc, text, event handlers
  const alwaysEmit = isInherited
    ? new Set(explicit)
    : null;

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
  if (shouldEmit('font') && ctrl.font && ctrl.font !== 'RobotoCondensed') {
    lines.push(`${indent}font = "${escapeString(ctrl.font)}";`);
  }
  if (shouldEmit('sizeEx') && ctrl.sizeEx && ctrl.sizeEx !== 4 && ctrl.sizeEx !== '4') {
    lines.push(`${indent}sizeEx = ${ctrl.sizeEx};`);
  }

  // Colors
  if (shouldEmit('colorText') && !arraysEqual(ctrl.colorText, [1, 1, 1, 1])) {
    lines.push(`${indent}colorText[] = {${ctrl.colorText.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (shouldEmit('colorBackground') && !colorArraysEqual(ctrl.colorBackground, [0, 0, 0, 0])) {
    lines.push(`${indent}colorBackground[] = {${formatColorElementArray(ctrl.colorBackground)}};`);
  }
  if (shouldEmit('colorDisabled') && ctrl.colorDisabled && !arraysEqual(ctrl.colorDisabled, [1, 1, 1, 0.25])) {
    lines.push(`${indent}colorDisabled[] = {${ctrl.colorDisabled.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (shouldEmit('colorBackgroundActive') && ctrl.colorBackgroundActive && !colorArraysEqual(ctrl.colorBackgroundActive, [0, 0, 0, 0])) {
    lines.push(`${indent}colorBackgroundActive[] = {${formatColorElementArray(ctrl.colorBackgroundActive)}};`);
  }

  // Text
  if (shouldEmit('text') && ctrl.text) {
    lines.push(`${indent}text = "${escapeString(ctrl.text)}";`);
  }

  // Shadow
  if (shouldEmit('shadow') && ctrl.shadow !== 0) {
    lines.push(`${indent}shadow = ${ctrl.shadow};`);
  }

  // Tooltip
  if (shouldEmit('tooltip') && ctrl.tooltip) {
    lines.push(`${indent}tooltip = "${escapeString(ctrl.tooltip)}";`);
  }
  if (shouldEmit('tooltipColorText') && ctrl.tooltipColorText) {
    lines.push(`${indent}tooltipColorText[] = {${ctrl.tooltipColorText.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (shouldEmit('tooltipColorBox') && ctrl.tooltipColorBox) {
    lines.push(`${indent}tooltipColorBox[] = {${ctrl.tooltipColorBox.map(v => v.toFixed(2)).join(', ')}};`);
  }
  if (shouldEmit('tooltipColorShade') && ctrl.tooltipColorShade) {
    lines.push(`${indent}tooltipColorShade[] = {${ctrl.tooltipColorShade.map(v => v.toFixed(2)).join(', ')}};`);
  }

  // Behavior
  if (shouldEmit('moving') && ctrl.moving) {
    lines.push(`${indent}moving = 1;`);
  }
  if (shouldEmit('url') && ctrl.url) {
    lines.push(`${indent}url = "${escapeString(ctrl.url)}";`);
  }
  if (shouldEmit('overlayMode') && ctrl.overlayMode !== undefined && ctrl.overlayMode !== 0) {
    lines.push(`${indent}overlayMode = ${ctrl.overlayMode};`);
  }
  if (shouldEmit('canDrag') && ctrl.canDrag !== undefined && ctrl.canDrag !== false) {
    lines.push(`${indent}canDrag = ${ctrl.canDrag ? 1 : 0};`);
  }
  if (shouldEmit('deletable') && ctrl.deletable !== undefined) {
    lines.push(`${indent}deletable = ${ctrl.deletable};`);
  }
  if (shouldEmit('fade') && ctrl.fade !== undefined && ctrl.fade !== 0) {
    lines.push(`${indent}fade = ${ctrl.fade};`);
  }
  if (shouldEmit('access') && ctrl.access !== undefined && ctrl.access !== 0) {
    lines.push(`${indent}access = ${ctrl.access};`);
  }
  if (shouldEmit('onLoad') && ctrl.onLoad) {
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

  // === Default / BlinkingPeriod ===
  if (shouldEmit('default') && ctrl.default !== undefined && ctrl.default !== 0) {
    lines.push(`${indent}default = ${ctrl.default};`);
  }
  if (shouldEmit('blinkingPeriod') && ctrl.blinkingPeriod !== undefined && ctrl.blinkingPeriod !== 0) {
    lines.push(`${indent}blinkingPeriod = ${ctrl.blinkingPeriod};`);
  }

  // === Checkbox textures (type 77) ===
  if (shouldEmit('textureChecked') && ctrl.textureChecked) lines.push(`${indent}textureChecked = "${escapeString(ctrl.textureChecked)}";`);
  if (shouldEmit('textureUnchecked') && ctrl.textureUnchecked) lines.push(`${indent}textureUnchecked = "${escapeString(ctrl.textureUnchecked)}";`);
  if (ctrl.textureFocusedChecked) lines.push(`${indent}textureFocusedChecked = "${escapeString(ctrl.textureFocusedChecked)}";`);
  if (ctrl.textureFocusedUnchecked) lines.push(`${indent}textureFocusedUnchecked = "${escapeString(ctrl.textureFocusedUnchecked)}";`);
  if (ctrl.textureHoverChecked) lines.push(`${indent}textureHoverChecked = "${escapeString(ctrl.textureHoverChecked)}";`);
  if (ctrl.textureHoverUnchecked) lines.push(`${indent}textureHoverUnchecked = "${escapeString(ctrl.textureHoverUnchecked)}";`);
  if (ctrl.texturePressedChecked) lines.push(`${indent}texturePressedChecked = "${escapeString(ctrl.texturePressedChecked)}";`);
  if (ctrl.texturePressedUnchecked) lines.push(`${indent}texturePressedUnchecked = "${escapeString(ctrl.texturePressedUnchecked)}";`);
  if (ctrl.textureDisabledChecked) lines.push(`${indent}textureDisabledChecked = "${escapeString(ctrl.textureDisabledChecked)}";`);
  if (ctrl.textureDisabledUnchecked) lines.push(`${indent}textureDisabledUnchecked = "${escapeString(ctrl.textureDisabledUnchecked)}";`);

  // === Checkboxes (type 7) specific ===
  if (ctrl.columns !== undefined) lines.push(`${indent}columns = ${ctrl.columns};`);
  if (ctrl.rows !== undefined) lines.push(`${indent}rows = ${ctrl.rows};`);
  if (ctrl.strings) lines.push(`${indent}strings[] = {${ctrl.strings.map(s => `"${s}"`).join(', ')}};`);
  if (ctrl.checkedStrings) lines.push(`${indent}checked_strings[] = {${ctrl.checkedStrings.map(s => `"${s}"`).join(', ')}};`);
  if (ctrl.colorTextSelect) lines.push(`${indent}colorTextSelect[] = {${ctrl.colorTextSelect.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorSelectedBg) lines.push(`${indent}colorSelectedBg[] = {${formatColorElementArray(ctrl.colorSelectedBg)}};`);
  if (ctrl.colorSelect) lines.push(`${indent}colorSelect[] = {${ctrl.colorSelect.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorTextDisable) lines.push(`${indent}colorTextDisable[] = {${ctrl.colorTextDisable.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorDisable) lines.push(`${indent}colorDisable[] = {${ctrl.colorDisable.map(v => v.toFixed(2)).join(', ')}};`);

  // === Hover / Focused / Pressed color states ===
  if (ctrl.colorHover) lines.push(`${indent}colorHover[] = {${ctrl.colorHover.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorFocused) lines.push(`${indent}colorFocused[] = {${formatColorElementArray(ctrl.colorFocused)}};`);
  if (ctrl.colorPressed) lines.push(`${indent}colorPressed[] = {${ctrl.colorPressed.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBackgroundHover) lines.push(`${indent}colorBackgroundHover[] = {${ctrl.colorBackgroundHover.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBackgroundFocused) lines.push(`${indent}colorBackgroundFocused[] = {${formatColorElementArray(ctrl.colorBackgroundFocused)}};`);
  if (ctrl.colorBackgroundPressed) lines.push(`${indent}colorBackgroundPressed[] = {${ctrl.colorBackgroundPressed.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBackgroundDisabled) lines.push(`${indent}colorBackgroundDisabled[] = {${ctrl.colorBackgroundDisabled.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorShadow) lines.push(`${indent}colorShadow[] = {${ctrl.colorShadow.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBorder) lines.push(`${indent}colorBorder[] = {${ctrl.colorBorder.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.borderSize !== undefined) lines.push(`${indent}borderSize = ${ctrl.borderSize};`);
  if (ctrl.colorActive) lines.push(`${indent}colorActive[] = {${ctrl.colorActive.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.color2) lines.push(`${indent}color2[] = {${ctrl.color2.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBackground2) lines.push(`${indent}colorBackground2[] = {${ctrl.colorBackground2.map(v => v.toFixed(2)).join(', ')}};`);

  // === Sound arrays ===
  if (shouldEmit('soundEnter') && ctrl.soundEnter) lines.push(`${indent}soundEnter[] = ${formatSound(ctrl.soundEnter)};`);
  if (shouldEmit('soundPush') && ctrl.soundPush) lines.push(`${indent}soundPush[] = ${formatSound(ctrl.soundPush)};`);
  if (shouldEmit('soundClick') && ctrl.soundClick) lines.push(`${indent}soundClick[] = ${formatSound(ctrl.soundClick)};`);
  if (shouldEmit('soundEscape') && ctrl.soundEscape) lines.push(`${indent}soundEscape[] = ${formatSound(ctrl.soundEscape)};`);
  if (ctrl.soundSelect) lines.push(`${indent}soundSelect[] = ${formatSound(ctrl.soundSelect)};`);
  if (ctrl.soundExpand) lines.push(`${indent}soundExpand[] = ${formatSound(ctrl.soundExpand)};`);
  if (ctrl.soundCollapse) lines.push(`${indent}soundCollapse[] = ${formatSound(ctrl.soundCollapse)};`);

  // === Button-specific (type 1) ===
  if (shouldEmit('offsetX') && ctrl.offsetX !== undefined) lines.push(`${indent}offsetX = ${ctrl.offsetX};`);
  if (shouldEmit('offsetY') && ctrl.offsetY !== undefined) lines.push(`${indent}offsetY = ${ctrl.offsetY};`);
  if (shouldEmit('offsetPressedX') && ctrl.offsetPressedX !== undefined) lines.push(`${indent}offsetPressedX = ${ctrl.offsetPressedX};`);
  if (shouldEmit('offsetPressedY') && ctrl.offsetPressedY !== undefined) lines.push(`${indent}offsetPressedY = ${ctrl.offsetPressedY};`);

  // === ShortcutButton-specific (type 16) ===
  if (shouldEmit('animTextureNormal') && ctrl.animTextureNormal) lines.push(`${indent}animTextureNormal = "${escapeString(ctrl.animTextureNormal)}";`);
  if (shouldEmit('animTextureDisabled') && ctrl.animTextureDisabled) lines.push(`${indent}animTextureDisabled = "${escapeString(ctrl.animTextureDisabled)}";`);
  if (shouldEmit('animTextureOver') && ctrl.animTextureOver) lines.push(`${indent}animTextureOver = "${escapeString(ctrl.animTextureOver)}";`);
  if (shouldEmit('animTextureFocused') && ctrl.animTextureFocused) lines.push(`${indent}animTextureFocused = "${escapeString(ctrl.animTextureFocused)}";`);
  if (shouldEmit('animTexturePressed') && ctrl.animTexturePressed) lines.push(`${indent}animTexturePressed = "${escapeString(ctrl.animTexturePressed)}";`);
  if (shouldEmit('animTextureDefault') && ctrl.animTextureDefault) lines.push(`${indent}animTextureDefault = "${escapeString(ctrl.animTextureDefault)}";`);
  if (shouldEmit('period') && ctrl.period !== undefined && ctrl.period !== 0) lines.push(`${indent}period = ${ctrl.period};`);
  if (shouldEmit('periodFocus') && ctrl.periodFocus !== undefined && ctrl.periodFocus !== 0) lines.push(`${indent}periodFocus = ${ctrl.periodFocus};`);
  if (shouldEmit('periodOver') && ctrl.periodOver !== undefined && ctrl.periodOver !== 0) lines.push(`${indent}periodOver = ${ctrl.periodOver};`);
  if (ctrl.action) lines.push(`${indent}action = "${escapeString(ctrl.action)}";`);
  if (ctrl.textureNoShortcut !== undefined) lines.push(`${indent}textureNoShortcut = "${escapeString(ctrl.textureNoShortcut)}";`);
  if (ctrl.hitZone) {
    lines.push(`${indent}class HitZone`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}left = ${formatCoordExpr(ctrl.hitZone.left)};`);
    lines.push(`${indent}${indentRef(1)}top = ${formatCoordExpr(ctrl.hitZone.top)};`);
    lines.push(`${indent}${indentRef(1)}right = ${formatCoordExpr(ctrl.hitZone.right)};`);
    lines.push(`${indent}${indentRef(1)}bottom = ${formatCoordExpr(ctrl.hitZone.bottom)};`);
    lines.push(`${indent}};`);
  }
  if (ctrl.shortcutPos) {
    lines.push(`${indent}class ShortcutPos`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}left = ${formatCoordExpr(ctrl.shortcutPos.left)};`);
    lines.push(`${indent}${indentRef(1)}top = ${formatCoordExpr(ctrl.shortcutPos.top)};`);
    if (ctrl.shortcutPos.w !== undefined) lines.push(`${indent}${indentRef(1)}w = ${formatCoordExpr(ctrl.shortcutPos.w)};`);
    if (ctrl.shortcutPos.h !== undefined) lines.push(`${indent}${indentRef(1)}h = ${formatCoordExpr(ctrl.shortcutPos.h)};`);
    lines.push(`${indent}};`);
  }
  if (ctrl.textPos) {
    lines.push(`${indent}class TextPos`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}left = ${formatCoordExpr(ctrl.textPos.left)};`);
    lines.push(`${indent}${indentRef(1)}top = ${formatCoordExpr(ctrl.textPos.top)};`);
    lines.push(`${indent}${indentRef(1)}right = ${formatCoordExpr(ctrl.textPos.right)};`);
    lines.push(`${indent}${indentRef(1)}bottom = ${formatCoordExpr(ctrl.textPos.bottom)};`);
    lines.push(`${indent}};`);
  }
  if (ctrl.attributes) {
    lines.push(`${indent}class Attributes`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}font = "${escapeString(ctrl.attributes.font)}";`);
    lines.push(`${indent}${indentRef(1)}color = "${escapeString(ctrl.attributes.color)}";`);
    lines.push(`${indent}${indentRef(1)}align = "${escapeString(ctrl.attributes.align)}";`);
    lines.push(`${indent}${indentRef(1)}shadow = "${ctrl.attributes.shadow}";`);
    lines.push(`${indent}};`);
  }
  if (ctrl.attributesImage) {
    lines.push(`${indent}class AttributesImage`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}font = "${escapeString(ctrl.attributesImage.font)}";`);
    lines.push(`${indent}${indentRef(1)}color = "${escapeString(ctrl.attributesImage.color)}";`);
    lines.push(`${indent}${indentRef(1)}align = "${escapeString(ctrl.attributesImage.align)}";`);
    lines.push(`${indent}};`);
  }

  // === Scrollbar sub-classes ===
  if (ctrl.vScrollBar) {
    lines.push(`${indent}class VScrollBar : Life_RscScrollBar`);
    lines.push(`${indent}{`);
    emitScrollBarProps(ctrl.vScrollBar, indent, lines);
    lines.push(`${indent}};`);
  }
  if (ctrl.hScrollBar) {
    lines.push(`${indent}class HScrollBar : Life_RscScrollBar`);
    lines.push(`${indent}{`);
    emitScrollBarProps(ctrl.hScrollBar, indent, lines);
    lines.push(`${indent}};`);
  }

  // === ListBox / ListNBox / Combo specific ===
  if (ctrl.colorSelect2) lines.push(`${indent}colorSelect2[] = {${ctrl.colorSelect2.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorSelectBackground) lines.push(`${indent}colorSelectBackground[] = {${ctrl.colorSelectBackground.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorSelectBackground2) lines.push(`${indent}colorSelectBackground2[] = {${ctrl.colorSelectBackground2.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorScrollbar) lines.push(`${indent}colorScrollbar[] = {${ctrl.colorScrollbar.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorPicture) lines.push(`${indent}colorPicture[] = {${ctrl.colorPicture.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorPictureSelected) lines.push(`${indent}colorPictureSelected[] = {${ctrl.colorPictureSelected.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorPictureDisabled) lines.push(`${indent}colorPictureDisabled[] = {${ctrl.colorPictureDisabled.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.wholeHeight !== undefined) lines.push(`${indent}wholeHeight = ${ctrl.wholeHeight};`);
  if (ctrl.rowHeight !== undefined) lines.push(`${indent}rowHeight = ${ctrl.rowHeight};`);
  if (ctrl.maxHistoryDelay !== undefined) lines.push(`${indent}maxHistoryDelay = ${ctrl.maxHistoryDelay};`);
  if (ctrl.autoScrollSpeed !== undefined) lines.push(`${indent}autoScrollSpeed = ${ctrl.autoScrollSpeed};`);
  if (ctrl.autoScrollDelay !== undefined) lines.push(`${indent}autoScrollDelay = ${ctrl.autoScrollDelay};`);
  if (ctrl.autoScrollRewind !== undefined) lines.push(`${indent}autoScrollRewind = ${ctrl.autoScrollRewind};`);

  // === Slider / Progress / Picture textures ===
  if (ctrl.arrowEmpty) lines.push(`${indent}arrowEmpty = "${escapeString(ctrl.arrowEmpty)}";`);
  if (ctrl.arrowFull) lines.push(`${indent}arrowFull = "${escapeString(ctrl.arrowFull)}";`);
  if (ctrl.border) lines.push(`${indent}border = "${escapeString(ctrl.border)}";`);
  if (ctrl.thumb) lines.push(`${indent}thumb = "${escapeString(ctrl.thumb)}";`);

  // === Progress specific (type 8) ===
  if (ctrl.texture) lines.push(`${indent}texture = "${escapeString(ctrl.texture)}";`);
  if (ctrl.colorFrame) lines.push(`${indent}colorFrame[] = {${ctrl.colorFrame.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorBar) lines.push(`${indent}colorBar[] = {${formatColorElementArray(ctrl.colorBar)}};`);

  // === Edit specific (type 2) ===
  if (ctrl.autocomplete !== undefined) lines.push(`${indent}autocomplete = ${ctrl.autocomplete ? 'true' : 'false'};`);
  if (ctrl.colorSelection) lines.push(`${indent}colorSelection[] = {${formatColorElementArray(ctrl.colorSelection)}};`);
  if (ctrl.canModify !== undefined) lines.push(`${indent}canModify = ${ctrl.canModify};`);

  // === Tree specific (type 12) ===
  if (ctrl.expandedTexture) lines.push(`${indent}expandedTexture = "${escapeString(ctrl.expandedTexture)}";`);
  if (ctrl.hiddenTexture) lines.push(`${indent}hiddenTexture = "${escapeString(ctrl.hiddenTexture)}";`);

  // === StructuredText specific (type 13) ===
  if (shouldEmit('size') && ctrl.size !== undefined && ctrl.size !== 0 && ctrl.size !== '0') {
    lines.push(`${indent}size = ${typeof ctrl.size === 'number' ? ctrl.size : `"${ctrl.size}"`};`);
  }
  if (shouldEmit('structuredAttributes') && ctrl.structuredAttributes) {
    lines.push(`${indent}class Attributes`);
    lines.push(`${indent}{`);
    lines.push(`${indent}${indentRef(1)}font = "${escapeString(ctrl.structuredAttributes.font)}";`);
    lines.push(`${indent}${indentRef(1)}color = "${escapeString(ctrl.structuredAttributes.color)}";`);
    lines.push(`${indent}${indentRef(1)}align = "${escapeString(ctrl.structuredAttributes.align)}";`);
    lines.push(`${indent}${indentRef(1)}shadow = ${ctrl.structuredAttributes.shadow};`);
    lines.push(`${indent}};`);
  }

  // === ActiveText specific (type 11) ===

  // === HTML specific (type 9) ===
  if (ctrl.colorBold) lines.push(`${indent}colorBold[] = {${ctrl.colorBold.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorLink) lines.push(`${indent}colorLink[] = {${ctrl.colorLink.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.colorLinkActive) lines.push(`${indent}colorLinkActive[] = {${ctrl.colorLinkActive.map(v => v.toFixed(2)).join(', ')}};`);
  if (ctrl.prevPage) lines.push(`${indent}prevPage = "${escapeString(ctrl.prevPage)}";`);
  if (ctrl.nextPage) lines.push(`${indent}nextPage = "${escapeString(ctrl.nextPage)}";`);

  // === HitZones specific ===
  if (ctrl.xCount !== undefined) lines.push(`${indent}xCount = ${ctrl.xCount};`);
  if (ctrl.yCount !== undefined) lines.push(`${indent}yCount = ${ctrl.yCount};`);
  if (ctrl.xSpace !== undefined) lines.push(`${indent}xSpace = ${ctrl.xSpace};`);
  if (ctrl.ySpace !== undefined) lines.push(`${indent}ySpace = ${ctrl.ySpace};`);

  // === MapControl specific (type 101) ===
  const mapProps: [string, unknown][] = [
    ['colorOutside', ctrl.colorOutside], ['colorSea', ctrl.colorSea],
    ['colorForest', ctrl.colorForest], ['colorRocks', ctrl.colorRocks],
    ['colorCountlines', ctrl.colorCountlines], ['colorMainCountlines', ctrl.colorMainCountlines],
    ['colorCountlinesWater', ctrl.colorCountlinesWater], ['colorMainCountlinesWater', ctrl.colorMainCountlinesWater],
    ['colorForestBorder', ctrl.colorForestBorder], ['colorRocksBorder', ctrl.colorRocksBorder],
    ['colorPowerLines', ctrl.colorPowerLines], ['colorRailWay', ctrl.colorRailWay],
    ['colorNames', ctrl.colorNames], ['colorInactive', ctrl.colorInactive],
    ['colorLevels', ctrl.colorLevels], ['colorTracks', ctrl.colorTracks],
    ['colorRoads', ctrl.colorRoads], ['colorMainRoads', ctrl.colorMainRoads],
    ['colorTracksFill', ctrl.colorTracksFill], ['colorRoadsFill', ctrl.colorRoadsFill],
    ['colorMainRoadsFill', ctrl.colorMainRoadsFill], ['colorGrid', ctrl.colorGrid],
    ['colorGridMap', ctrl.colorGridMap],
  ];
  for (const [name, val] of mapProps) {
    if (val && Array.isArray(val) && val.length === 4) {
      lines.push(`${indent}${name}[] = {${(val as number[]).map(v => v.toFixed(2)).join(', ')}};`);
    }
  }
  if (ctrl.scaleMin !== undefined) lines.push(`${indent}scaleMin = ${ctrl.scaleMin};`);
  if (ctrl.scaleMax !== undefined) lines.push(`${indent}scaleMax = ${ctrl.scaleMax};`);
  if (ctrl.scaleDefault !== undefined) lines.push(`${indent}scaleDefault = ${ctrl.scaleDefault};`);
  if (ctrl.maxSatelliteAlpha !== undefined) lines.push(`${indent}maxSatelliteAlpha = ${ctrl.maxSatelliteAlpha};`);
  if (ctrl.alphaFadeStartScale !== undefined) lines.push(`${indent}alphaFadeStartScale = ${ctrl.alphaFadeStartScale};`);
  if (ctrl.alphaFadeEndScale !== undefined) lines.push(`${indent}alphaFadeEndScale = ${ctrl.alphaFadeEndScale};`);
  if (shouldEmit('fontLabel') && ctrl.fontLabel) lines.push(`${indent}fontLabel = "${escapeString(ctrl.fontLabel)}";`);
  if (shouldEmit('sizeExLabel') && ctrl.sizeExLabel !== undefined && ctrl.sizeExLabel !== 0) lines.push(`${indent}sizeExLabel = ${formatCoordExpr(ctrl.sizeExLabel)};`);
  if (shouldEmit('fontGrid') && ctrl.fontGrid) lines.push(`${indent}fontGrid = "${escapeString(ctrl.fontGrid)}";`);
  if (shouldEmit('sizeExGrid') && ctrl.sizeExGrid !== undefined && ctrl.sizeExGrid !== 0) lines.push(`${indent}sizeExGrid = ${ctrl.sizeExGrid};`);
  if (shouldEmit('fontUnits') && ctrl.fontUnits) lines.push(`${indent}fontUnits = "${escapeString(ctrl.fontUnits)}";`);
  if (shouldEmit('sizeExUnits') && ctrl.sizeExUnits !== undefined && ctrl.sizeExUnits !== 0) lines.push(`${indent}sizeExUnits = ${formatCoordExpr(ctrl.sizeExUnits)};`);
  if (shouldEmit('fontNames') && ctrl.fontNames) lines.push(`${indent}fontNames = "${escapeString(ctrl.fontNames)}";`);
  if (shouldEmit('sizeExNames') && ctrl.sizeExNames !== undefined && ctrl.sizeExNames !== 0) lines.push(`${indent}sizeExNames = ${formatCoordExpr(ctrl.sizeExNames)};`);
  if (shouldEmit('fontInfo') && ctrl.fontInfo) lines.push(`${indent}fontInfo = "${escapeString(ctrl.fontInfo)}";`);
  if (shouldEmit('sizeExInfo') && ctrl.sizeExInfo !== undefined && ctrl.sizeExInfo !== 0) lines.push(`${indent}sizeExInfo = ${formatCoordExpr(ctrl.sizeExInfo)};`);
  if (shouldEmit('fontLevel') && ctrl.fontLevel) lines.push(`${indent}fontLevel = "${escapeString(ctrl.fontLevel)}";`);
  if (shouldEmit('sizeExLevel') && ctrl.sizeExLevel !== undefined && ctrl.sizeExLevel !== 0) lines.push(`${indent}sizeExLevel = ${ctrl.sizeExLevel};`);
  if (ctrl.moveOnEdges !== undefined) lines.push(`${indent}moveOnEdges = ${ctrl.moveOnEdges};`);
  if (ctrl.widthRailWay !== undefined) lines.push(`${indent}widthRailWay = ${ctrl.widthRailWay};`);
  if (ctrl.ptsPerSquareSea !== undefined) lines.push(`${indent}ptsPerSquareSea = ${ctrl.ptsPerSquareSea};`);
  if (ctrl.ptsPerSquareTxt !== undefined) lines.push(`${indent}ptsPerSquareTxt = ${ctrl.ptsPerSquareTxt};`);
  if (ctrl.ptsPerSquareCLn !== undefined) lines.push(`${indent}ptsPerSquareCLn = ${ctrl.ptsPerSquareCLn};`);
  if (ctrl.ptsPerSquareExp !== undefined) lines.push(`${indent}ptsPerSquareExp = ${ctrl.ptsPerSquareExp};`);
  if (ctrl.ptsPerSquareCost !== undefined) lines.push(`${indent}ptsPerSquareCost = ${ctrl.ptsPerSquareCost};`);
  if (ctrl.ptsPerSquareFor !== undefined) lines.push(`${indent}ptsPerSquareFor = ${ctrl.ptsPerSquareFor};`);
  if (ctrl.ptsPerSquareForEdge !== undefined) lines.push(`${indent}ptsPerSquareForEdge = ${ctrl.ptsPerSquareForEdge};`);
  if (ctrl.ptsPerSquareRoad !== undefined) lines.push(`${indent}ptsPerSquareRoad = ${ctrl.ptsPerSquareRoad};`);
  if (ctrl.ptsPerSquareObj !== undefined) lines.push(`${indent}ptsPerSquareObj = ${ctrl.ptsPerSquareObj};`);
  if (ctrl.showCountourInterval !== undefined) lines.push(`${indent}showCountourInterval = ${ctrl.showCountourInterval};`);

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
  return a.every((v, i) => Math.abs(v - b[i]) < 0.0001);
}

function colorArraysEqual(a: import('../types/controls').ColorArray, b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => typeof v === 'number' && Math.abs(v - b[i]) < 0.0001);
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

function indentRef(depth: number): string {
  return ' '.repeat(4);
}

function formatSound(sound: SoundEntry): string {
  const [file, volume, pitch] = sound;
  return `{"${escapeString(file)}", ${volume}, ${pitch}}`;
}

function formatColorElementArray(arr: ColorArray): string {
  return arr.map(v => typeof v === 'number' ? v.toFixed(2) : `"${String(v)}"`).join(', ');
}

function emitScrollBarProps(sb: import('../types/controls').ScrollBarConfig, indent: string, lines: string[]): void {
  const pIndent = indent + ' '.repeat(4);
  if (sb.width !== undefined) lines.push(`${pIndent}width = ${sb.width};`);
  if (sb.height !== undefined) lines.push(`${pIndent}height = ${sb.height};`);
  if (sb.autoScrollEnabled !== undefined) lines.push(`${pIndent}autoScrollEnabled = ${sb.autoScrollEnabled};`);
  if (sb.autoScrollSpeed !== undefined) lines.push(`${pIndent}autoScrollSpeed = ${sb.autoScrollSpeed};`);
  if (sb.autoScrollDelay !== undefined) lines.push(`${pIndent}autoScrollDelay = ${sb.autoScrollDelay};`);
  if (sb.autoScrollRewind !== undefined) lines.push(`${pIndent}autoScrollRewind = ${sb.autoScrollRewind};`);
  if (sb.scrollSpeed !== undefined) lines.push(`${pIndent}scrollSpeed = ${sb.scrollSpeed};`);
  if (sb.color) lines.push(`${pIndent}color[] = {${sb.color.map(v => v.toFixed(2)).join(', ')}};`);
  if (sb.colorActive) lines.push(`${pIndent}colorActive[] = {${sb.colorActive.map(v => v.toFixed(2)).join(', ')}};`);
  if (sb.colorDisabled) lines.push(`${pIndent}colorDisabled[] = {${sb.colorDisabled.map(v => v.toFixed(2)).join(', ')}};`);
  if (sb.thumb) lines.push(`${pIndent}thumb = "${escapeString(sb.thumb)}";`);
  if (sb.arrowEmpty) lines.push(`${pIndent}arrowEmpty = "${escapeString(sb.arrowEmpty)}";`);
  if (sb.arrowFull) lines.push(`${pIndent}arrowFull = "${escapeString(sb.arrowFull)}";`);
  if (sb.border) lines.push(`${pIndent}border = "${escapeString(sb.border)}";`);
  if (sb.shadow !== undefined) lines.push(`${pIndent}shadow = ${sb.shadow};`);
}
