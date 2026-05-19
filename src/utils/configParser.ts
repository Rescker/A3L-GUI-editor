// =============================================================================
// Config Parser — Parses Arma 3 config.cpp / description.ext input
// Handles: Editor format ($[...]), class format, preprocessor defines.
// =============================================================================

import type { ControlConfig, DialogConfig, EventHandlerConfig, UIContainerType, SoundEntry, ScrollBarConfig, RectPos, StructuredAttributes, ImageAttributes, ColorArray } from '../types/controls';
import { getPresetByParentClass } from '../data/componentLibrary';

// =============================================================================
// Editor Format Parser: $[version, [gridDef], [control1], [control2], ...]
// =============================================================================
export function parseEditorFormat(raw: string): Partial<DialogConfig> | null {
  try {
    // Strip comments
    const cleaned = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

    // Find $[...] structure
    const match = cleaned.match(/\$\[([\s\S]*)\]/);
    if (!match) return null;

    // The content is a JS-like array; extract and evaluate safely
    const content = match[1].trim();
    // Parse JSON-like structure (Arma editor format uses JS array syntax)
    const jsonStr = `[${content}]`;
    // Replace Arma string quotes with JSON quotes where needed
    let sanitized = jsonStr
      .replace(/'/g, '"') // single to double quotes
      .replace(/"\s*\+\s*"/g, '') // string concatenation
      .replace(/\\/g, '\\\\');

    const parsed = JSON.parse(sanitized);
    const data: unknown[] = Array.isArray(parsed) ? parsed : [];

    if (data.length < 2) return null;

    const version = data[0] as number;
    const gridDef = data[1] as unknown[];
    const controls = data.slice(2) as unknown[][];

    const result: Partial<DialogConfig> = {
      id: generateId(),
      className: 'ImportedDialog',
      containerType: 'dialog',
      idd: -1,
      movingEnable: true,
      enableSimulation: false,
      onLoad: '',
      onUnload: '',
      controlsBackground: [],
      controls: [],
      objects: [],
      eventHandlers: [],
    };

    for (let i = 0; i < controls.length; i++) {
      const c = controls[i];
      if (!Array.isArray(c) || c.length < 9) continue;

      const control: ControlConfig = {
        id: generateId(),
        className: String(c[0] ?? `Control_${1600 + i}`),
        parentClass: String(c[1] ?? 'RscText'),
        type: Number(c[2]) as ControlConfig['type'],
        style: Number(c[3] ?? 0),
        x: parseCoordValue(c[4] as string | number | undefined),
        y: parseCoordValue(c[5] as string | number | undefined),
        w: parseCoordValue(c[6] as string | number | undefined),
        h: parseCoordValue(c[7] as string | number | undefined),
        sizeEx: Number(c[8] ?? 4),
        font: String(c[9] ?? 'RobotoCondensed'),
        colorText: [1, 1, 1, 1],
        colorBackground: [0, 0, 0, 0],
        text: String(c[10] ?? ''),
        shadow: 0,
        tooltip: '',
        moving: false,
        idc: 1600 + i,
        eventHandlers: [],
      };

      if (result.controls) {
        result.controls.push(control);
      }
    }

    return result;
  } catch {
    return null;
  }
}

// =============================================================================
// Config Class Format Parser: class Foo : Bar { ... }
// =============================================================================
export function parseConfigClass(raw: string): Partial<DialogConfig> | null {
  try {
    const cleaned = raw.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const tokens = tokenize(cleaned);

    // Parse defines first
    const defines = new Map<string, string>();
    const contentWithoutDefines: string[] = [];
    for (const line of cleaned.split('\n')) {
      const defMatch = line.match(/^\s*#define\s+(\w+)\s+(.+)/);
      if (defMatch) {
        defines.set(defMatch[1], defMatch[2].trim());
      } else {
        contentWithoutDefines.push(line);
      }
    }

    const strippedCleaned = contentWithoutDefines.join('\n');

    // Find the root class
    const rootMatch = strippedCleaned.match(/class\s+(\w+)\s*(?::\s*(\w+))?\s*\{([\s\S]*)\}/);
    if (!rootMatch) return null;

    const className = rootMatch[1];
    const parentClass = rootMatch[2] ?? '';
    const body = rootMatch[3];

    const dialog: Partial<DialogConfig> = {
      id: generateId(),
      className,
      containerType: className.startsWith('RscTitle') ? 'hud' : 'dialog',
      idd: parseInt(extractProperty(body, 'idd') ?? '-1') || -1,
      movingEnable: extractProperty(body, 'movingEnable') === '1',
      enableSimulation: extractProperty(body, 'enableSimulation') === '1',
      onLoad: extractProperty(body, 'onLoad') ?? '',
      onUnload: extractProperty(body, 'onUnload') ?? '',
      controlsBackground: [],
      controls: [],
      objects: [],
      eventHandlers: [],
    };

    // Parse HUD properties
    const fadeIn = extractProperty(body, 'fadeIn');
    const fadeOut = extractProperty(body, 'fadeOut');
    const duration = extractProperty(body, 'duration');
    if (fadeIn) dialog.fadeIn = parseInt(fadeIn);
    if (fadeOut) dialog.fadeOut = parseInt(fadeOut);
    if (duration) dialog.duration = parseFloat(duration);

    // Parse sub-classes (ControlsBackground, Controls, Objects)
    dialog.controlsBackground = parseControlList(body, 'controlsBackground', defines);
    dialog.controls = parseControlList(body, 'controls', defines);
    dialog.objects = parseControlList(body, 'objects', defines);

    return dialog;
  } catch {
    return null;
  }
}

// =============================================================================
// Auto-detect import format
// =============================================================================
export function importConfig(raw: string): Partial<DialogConfig> | null {
  if (!raw.trim()) return null;

  const trimmed = raw.trim();
  if (trimmed.startsWith('$[')) {
    return parseEditorFormat(trimmed);
  }
  return parseConfigClass(trimmed);
}

// =============================================================================
// Internal helpers
// =============================================================================

function tokenize(_input: string): string[] {
  // Simple tokenizer — not fully used in current parser
  return [];
}

function extractProperty(body: string, propName: string): string | null {
  // Match array properties: propName[] = { ... };
  // Uses brace-counting to handle nested {} and SQF expressions inside the array
  // \b ensures propName is a whole word (prevents "x" matching inside "sizeEx")
  const arrayStartRegex = new RegExp(`\\b${escapeRegex(propName)}\\s*\\[\\]\\s*=\\s*\\{`);
  const arrMatch = body.match(arrayStartRegex);
  if (arrMatch && arrMatch.index !== undefined) {
    const startIdx = arrMatch.index! + arrMatch[0].length - 1;
    const braceContent = matchBraces(body, startIdx);
    if (braceContent !== null) return braceContent;
  }

  // Match scalar properties: propName = value;
  const scalarRegex = new RegExp(`\\b${escapeRegex(propName)}\\s*=\\s*([^;]+)\\s*;`);
  const scalarMatch = body.match(scalarRegex);
  if (scalarMatch) {
    let val = scalarMatch[1].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return null;
}

// Brace-counter: extracts content between matching { } starting at openBraceIdx
function matchBraces(str: string, openBraceIdx: number): string | null {
  let depth = 0;
  let start = openBraceIdx;
  for (let i = openBraceIdx; i < str.length; i++) {
    const ch = str[i];
    // Skip quoted strings (both " and ')
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < str.length && str[i] !== quote) {
        if (str[i] === '\\') i++; // skip escape
        i++;
      }
      continue;
    }
    if (ch === '{') {
      depth++;
      if (depth === 1) start = i;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return str.substring(start + 1, i).trim();
      }
    }
  }
  return null;
}

// =============================================================================
// Resolve within-dialog inheritance — merge parent control properties
// into children (child's explicit properties take precedence)
// =============================================================================
function resolveControlInheritance(controls: ControlConfig[]): ControlConfig[] {
  const byName = new Map<string, ControlConfig>();
  for (const c of controls) byName.set(c.className, c);

  // Iteratively resolve until stable (handles transitive chains like Key5→Key4→Key1)
  const result = [...controls];
  let changed = true;
  let maxIterations = controls.length + 1;
  while (changed && maxIterations-- > 0) {
    changed = false;
    for (let i = 0; i < result.length; i++) {
      const child = result[i];
      const parent = byName.get(child.parentClass);
      if (!parent) continue;

      const merged = mergeWithParent(parent, child);
      if (!shallowEqualControls(result[i], merged)) {
        result[i] = merged;
        byName.set(merged.className, merged);
        changed = true;
      }
    }
  }
  return result;
}

function mergeWithParent(parent: ControlConfig, child: ControlConfig): ControlConfig {
  const merged: ControlConfig = { ...parent };

  for (const key of Object.keys(child) as (keyof ControlConfig)[]) {
    if (key === 'id' || key === 'className' || key === 'idc' || key === 'eventHandlers' || key === 'children') {
      (merged as unknown as Record<string, unknown>)[key] = child[key];
      continue;
    }
    if (!isGenericDefault(key, child[key])) {
      (merged as unknown as Record<string, unknown>)[key] = child[key];
    }
  }

  merged.id = child.id;
  merged.className = child.className;
  merged.idc = child.idc;
  merged.eventHandlers = child.eventHandlers;
  merged.children = child.children;
  return merged;
}

function shallowEqualControls(a: ControlConfig, b: ControlConfig): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (k === 'children') continue;
    const va = JSON.stringify((a as unknown as Record<string, unknown>)[k]);
    const vb = JSON.stringify((b as unknown as Record<string, unknown>)[k]);
    if (va !== vb) return false;
  }
  return true;
}

function isGenericDefault(key: string, val: unknown): boolean {
  if (val === undefined) return true;
  switch (key) {
    case 'type': return val === 0;
    case 'style': return val === 0;
    case 'sizeEx': return val === 4 || val === '4';
    case 'font': return val === 'RobotoCondensed';
    case 'text': return val === '';
    case 'tooltip': return val === '';
    case 'shadow': return val === 0;
    case 'x': return val === 0 || val === '0';
    case 'y': return val === 0 || val === '0';
    case 'w': return val === 10 || val === '10';
    case 'h': return val === 2 || val === '2';
    case 'colorText': return Array.isArray(val) && val.length === 4 && val[0] === 1 && val[1] === 1 && val[2] === 1 && val[3] === 1;
    case 'colorBackground': return Array.isArray(val) && val.length === 4 && val[0] === 0 && val[1] === 0 && val[2] === 0 && val[3] === 0;
    default:
      if (val === false || val === 0 || val === '') return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
  }
}

function parseControlList(body: string, zoneName: string, _defines: Map<string, string>): ControlConfig[] {
  const controls: ControlConfig[] = [];

  // Try nested class format: class ControlsBackground { class Foo : Bar { ... }; };
  // Use brace counting to find the full block
  const zoneClassRegex = new RegExp(`class\\s+${toTitleCase(zoneName)}\\s*\\{`, 'i');
  const zoneMatch = body.match(zoneClassRegex);
  
  if (zoneMatch && zoneMatch.index !== undefined) {
    const openIdx = zoneMatch.index! + zoneMatch[0].length - 1;
    const zoneBody = matchBraces(body, openIdx);
    if (zoneBody) {
      // Parse individual control classes within the zone using brace counting
      let idx = 0;
      while (idx < zoneBody.length) {
        // Find next "class ClassName"
        const classMatch = zoneBody.slice(idx).match(/class\s+(\w+)\s*(?::\s*(\w+))?\s*\{/);
        if (!classMatch || classMatch.index === undefined) break;
        
        const classStart = idx + classMatch.index!;
        const braceOpenIdx = classStart + classMatch[0].length - 1;
        const classBody = matchBraces(zoneBody, braceOpenIdx);
        
        if (classBody !== null) {
          const ctrl = parseControlBlock(classMatch[1], classMatch[2], classBody);
          if (ctrl) controls.push(ctrl);
          // Move past this class by finding the semicolon after the closing brace
          const afterBody = braceOpenIdx + classBody.length + 1; // skip }
          const rest = zoneBody.slice(afterBody);
          const semiIdx = rest.indexOf(';');
          idx = afterBody + (semiIdx >= 0 ? semiIdx + 1 : 1);
        } else {
          idx++;
        }
      }
      return resolveControlInheritance(controls);
    }
  }

  // Try array-of-names format: controlsBackground[] = { ClassName1, ClassName2 };
  const arrayRegex = new RegExp(`${zoneName}\\s*\\[\\]\\s*=\\s*\\{([^}]*)\\}`, 'i');
  const arrayMatch = body.match(arrayRegex);
  if (arrayMatch) {
    const names = arrayMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < names.length; i++) {
      const name = names[i].replace(/["']/g, '');
      controls.push({
        id: generateId(),
        className: name,
        parentClass: name,
        type: 0 as ControlConfig['type'],
        style: 0,
        x: 0, y: 0, w: 10, h: 2,
        sizeEx: 4,
        font: 'RobotoCondensed',
        colorText: [1, 1, 1, 1],
        colorBackground: [0, 0, 0, 0],
        text: '',
        shadow: 0,
        tooltip: '',
        moving: false,
        idc: -1,
        eventHandlers: [],
      });
    }
    return resolveControlInheritance(controls);
  }

  return controls;
}

// Heuristic type inference from parent class names when no explicit type= is defined
function inferTypeFromClassName(name: string): number {
  const lower = name.toLowerCase();
  if (/\bbutton\b/.test(lower)) return 1;
  if (/\bshortcutbutton\b/.test(lower)) return 16;
  if (/\bxbutton\b/.test(lower)) return 41;
  if (/\bedit\b/.test(lower) || /\bxedit\b/.test(lower)) return 2;
  if (/\bslider\b/.test(lower) || /\bxslider\b/.test(lower)) return 3;
  if (/\bcombo\b/.test(lower) || /\bxcombo\b/.test(lower)) return 4;
  if (/\blistnbox\b/.test(lower) || /\bxlistnbox\b/.test(lower)) return 102;
  if (/\blistbox\b/.test(lower) || /\bxlistbox\b/.test(lower)) return 5;
  if (/\btoolbox\b/.test(lower)) return 6;
  if (/\bcheckboxes\b/.test(lower)) return 7;
  if (/\bcheckbox\b/.test(lower)) return 77;
  if (/\bprogress\b/.test(lower)) return 8;
  if (/\bhtml\b/.test(lower)) return 9;
  if (/\bactivetext\b/.test(lower)) return 11;
  if (/\btree\b/.test(lower)) return 12;
  if (/\bstructuredtext\b/.test(lower)) return 13;
  if (/\bcontextmenu\b/.test(lower)) return 14;
  if (/\bcontrolsgroup\b/.test(lower)) return 15;
  if (/\bmap(control|main)?\b/.test(lower)) return 100;
  if (/\bpicture\b/.test(lower)) return 0;
  if (/\bframe\b/.test(lower)) return 0;
  if (/\btitle\b/.test(lower)) return 0;
  if (/\bbackground\b/.test(lower)) return 0;
  return 0; // default to CT_STATIC
}

function parseControlBlock(className: string, parentClass: string | undefined, body: string): ControlConfig | null {
  try {
    const explicitType = extractProperty(body, 'type');
    // If no explicit type, infer from parent class name heuristics
    let ctrlType: number;
    if (explicitType) {
      ctrlType = parseType(explicitType);
    } else {
      ctrlType = inferTypeFromClassName(parentClass ?? className);
    }

    const result: ControlConfig = {
      id: generateId(),
      className,
      parentClass: parentClass ?? 'RscText',
      type: ctrlType as ControlConfig['type'],
      style: parseInt(extractProperty(body, 'style')?.replace('0x', '') ?? '0', 16) || 0,
      x: parseCoordValue(extractProperty(body, 'x') ?? '0'),
      y: parseCoordValue(extractProperty(body, 'y') ?? '0'),
      w: parseCoordValue(extractProperty(body, 'w') ?? '10'),
      h: parseCoordValue(extractProperty(body, 'h') ?? '2'),
      sizeEx: parseCoordValue(extractProperty(body, 'sizeEx') ?? '4'),
      font: extractProperty(body, 'font') ?? 'RobotoCondensed',
      colorText: parseColorArray(extractProperty(body, 'colorText')) ?? [1, 1, 1, 1],
      colorBackground: parseColorArray(extractProperty(body, 'colorBackground')) ?? [0, 0, 0, 0],
      colorDisabled: parseColorArray(extractProperty(body, 'colorDisabled')),
      colorBackgroundActive: parseColorArray(extractProperty(body, 'colorBackgroundActive')),
      text: extractProperty(body, 'text') ?? '',
      shadow: (parseInt(extractProperty(body, 'shadow') ?? '0')) as 0 | 1 | 2,
      tooltip: extractProperty(body, 'tooltip') ?? '',
      tooltipColorText: parseColorArray(extractProperty(body, 'tooltipColorText')),
      tooltipColorBox: parseColorArray(extractProperty(body, 'tooltipColorBox')),
      tooltipColorShade: parseColorArray(extractProperty(body, 'tooltipColorShade')),
      moving: extractProperty(body, 'moving') === '1',
      url: extractProperty(body, 'url') ?? undefined,
      overlayMode: parseInt(extractProperty(body, 'overlayMode') ?? '0') as 0 | 1 | 2,
      idc: (parseInt(extractProperty(body, 'idc') ?? '-1')) || -1,
      eventHandlers: parseEventHandlers(body),
      lineSpacing: parseFloat(extractProperty(body, 'lineSpacing') ?? '0') || undefined,
      tileH: parseFloat(extractProperty(body, 'tileH') ?? '0') || undefined,
      tileW: parseFloat(extractProperty(body, 'tileW') ?? '0') || undefined,
      canDrag: extractProperty(body, 'canDrag') === '1',
      deletable: extractProperty(body, 'deletable') ? (parseInt(extractProperty(body, 'deletable')!) as 0 | 1) : undefined,
      fade: parseFloat(extractProperty(body, 'fade') ?? '0') || undefined,
      access: extractProperty(body, 'access') ? (parseInt(extractProperty(body, 'access')!) as 0 | 1 | 2 | 3) : undefined,
      onLoad: extractProperty(body, 'onLoad') ?? undefined,
      // === New properties ===
      default: parseOptionalFloat(extractProperty(body, 'default')),
      blinkingPeriod: parseOptionalFloat(extractProperty(body, 'blinkingPeriod')),
      // Hover/Focused/Pressed colors
      colorHover: parseColorArray(extractProperty(body, 'colorHover')),
      colorFocused: parseColorOrSqf(extractProperty(body, 'colorFocused')),
      colorPressed: parseColorArray(extractProperty(body, 'colorPressed')),
      colorBackgroundHover: parseColorArray(extractProperty(body, 'colorBackgroundHover')),
      colorBackgroundFocused: parseColorOrSqf(extractProperty(body, 'colorBackgroundFocused')),
      colorBackgroundPressed: parseColorArray(extractProperty(body, 'colorBackgroundPressed')),
      colorBackgroundDisabled: parseColorArray(extractProperty(body, 'colorBackgroundDisabled')),
      colorShadow: parseColorArray(extractProperty(body, 'colorShadow')),
      colorBorder: parseColorArray(extractProperty(body, 'colorBorder')),
      borderSize: parseOptionalFloat(extractProperty(body, 'borderSize')),
      colorActive: parseColorArray(extractProperty(body, 'colorActive')),
      color2: parseColorArray(extractProperty(body, 'color2')),
      colorBackground2: parseColorArray(extractProperty(body, 'colorBackground2')),
      // Sounds
      soundEnter: parseSound(extractProperty(body, 'soundEnter')),
      soundPush: parseSound(extractProperty(body, 'soundPush')),
      soundClick: parseSound(extractProperty(body, 'soundClick')),
      soundEscape: parseSound(extractProperty(body, 'soundEscape')),
      soundSelect: parseSound(extractProperty(body, 'soundSelect')),
      soundExpand: parseSound(extractProperty(body, 'soundExpand')),
      soundCollapse: parseSound(extractProperty(body, 'soundCollapse')),
      // Button
      offsetX: parseOptionalFloat(extractProperty(body, 'offsetX')),
      offsetY: parseOptionalFloat(extractProperty(body, 'offsetY')),
      offsetPressedX: parseOptionalFloat(extractProperty(body, 'offsetPressedX')),
      offsetPressedY: parseOptionalFloat(extractProperty(body, 'offsetPressedY')),
      // ShortcutButton
      animTextureNormal: extractPropertyStr(body, 'animTextureNormal'),
      animTextureDisabled: extractPropertyStr(body, 'animTextureDisabled'),
      animTextureOver: extractPropertyStr(body, 'animTextureOver'),
      animTextureFocused: extractPropertyStr(body, 'animTextureFocused'),
      animTexturePressed: extractPropertyStr(body, 'animTexturePressed'),
      animTextureDefault: extractPropertyStr(body, 'animTextureDefault'),
      period: parseOptionalFloat(extractProperty(body, 'period')),
      periodFocus: parseOptionalFloat(extractProperty(body, 'periodFocus')),
      periodOver: parseOptionalFloat(extractProperty(body, 'periodOver')),
      action: extractPropertyStr(body, 'action'),
      textureNoShortcut: extractPropertyStr(body, 'textureNoShortcut'),
      hitZone: parseSubClassRect(parseSubClass(body, 'hitZone')),
      shortcutPos: parseSubClassRect(parseSubClass(body, 'shortcutPos')),
      textPos: parseSubClassRect(parseSubClass(body, 'textPos')),
      attributes: parseSubClassAttributes(parseSubClass(body, 'attributes')),
      attributesImage: parseSubClassImageAttributes(parseSubClass(body, 'attributesImage')),
      // Scrollbar sub-classes
      vScrollBar: parseScrollBarSubClass(parseSubClass(body, 'VScrollBar') || parseSubClass(body, 'VScrollbar') || parseSubClass(body, 'ListScrollBar')),
      hScrollBar: parseScrollBarSubClass(parseSubClass(body, 'HScrollBar') || parseSubClass(body, 'HScrollbar')),
      // Scrollbar standalone
      scrollSpeed: parseOptionalFloat(extractProperty(body, 'scrollSpeed')),
      autoScrollEnabled: parseOptionalInt(extractProperty(body, 'autoScrollEnabled')),
      // List controls
      colorSelect2: parseColorArray(extractProperty(body, 'colorSelect2')),
      colorSelectBackground: parseColorArray(extractProperty(body, 'colorSelectBackground')),
      colorSelectBackground2: parseColorArray(extractProperty(body, 'colorSelectBackground2')),
      colorScrollbar: parseColorArray(extractProperty(body, 'colorScrollbar')),
      colorPicture: parseColorArray(extractProperty(body, 'colorPicture')),
      colorPictureSelected: parseColorArray(extractProperty(body, 'colorPictureSelected')),
      colorPictureDisabled: parseColorArray(extractProperty(body, 'colorPictureDisabled')),
      wholeHeight: parseOptionalFloat(extractProperty(body, 'wholeHeight')),
      rowHeight: parseOptionalFloat(extractProperty(body, 'rowHeight')),
      maxHistoryDelay: parseOptionalFloat(extractProperty(body, 'maxHistoryDelay')),
      autoScrollSpeed: parseOptionalFloat(extractProperty(body, 'autoScrollSpeed')),
      autoScrollDelay: parseOptionalFloat(extractProperty(body, 'autoScrollDelay')),
      autoScrollRewind: parseOptionalFloat(extractProperty(body, 'autoScrollRewind')),
      // Textures
      arrowEmpty: extractPropertyStr(body, 'arrowEmpty'),
      arrowFull: extractPropertyStr(body, 'arrowFull'),
      border: extractPropertyStr(body, 'border'),
      thumb: extractPropertyStr(body, 'thumb'),
      texture: extractPropertyStr(body, 'texture'),
      // Progress
      colorFrame: parseColorArray(extractProperty(body, 'colorFrame')),
      colorBar: parseColorOrSqf(extractProperty(body, 'colorBar')),
      // Edit
      autocomplete: extractProperty(body, 'autocomplete') === 'true' ? true : undefined,
      colorSelection: parseColorOrSqf(extractProperty(body, 'colorSelection')),
      canModify: parseOptionalInt(extractProperty(body, 'canModify')),
      // Tree
      expandedTexture: extractPropertyStr(body, 'expandedTexture'),
      hiddenTexture: extractPropertyStr(body, 'hiddenTexture'),
      // StructuredText
      size: parseCoordValue(extractProperty(body, 'size') ?? undefined),
      structuredAttributes: parseSubClassAttributes(parseSubClass(body, 'attributes')),
      // ActiveText
      // (colorActive already parsed above)
      // HTML
      colorBold: parseColorArray(extractProperty(body, 'colorBold')),
      colorLink: parseColorArray(extractProperty(body, 'colorLink')),
      colorLinkActive: parseColorArray(extractProperty(body, 'colorLinkActive')),
      prevPage: extractPropertyStr(body, 'prevPage'),
      nextPage: extractPropertyStr(body, 'nextPage'),
      // HitZones
      xCount: parseOptionalInt(extractProperty(body, 'xCount')),
      yCount: parseOptionalInt(extractProperty(body, 'yCount')),
      xSpace: parseOptionalFloat(extractProperty(body, 'xSpace')),
      ySpace: parseOptionalFloat(extractProperty(body, 'ySpace')),
      // Checkboxes (type 7)
      columns: parseOptionalInt(extractProperty(body, 'columns')),
      rows: parseOptionalInt(extractProperty(body, 'rows')),
      strings: parseStringArray(extractProperty(body, 'strings')),
      checkedStrings: parseStringArray(extractProperty(body, 'checked_strings')),
      colorTextSelect: parseColorArray(extractProperty(body, 'colorTextSelect')),
      colorSelectedBg: parseColorOrSqf(extractProperty(body, 'colorSelectedBg')),
      colorSelect: parseColorArray(extractProperty(body, 'colorSelect')),
      colorTextDisable: parseColorArray(extractProperty(body, 'colorTextDisable')),
      colorDisable: parseColorArray(extractProperty(body, 'colorDisable')),
      // Checkbox textures (type 77)
      textureChecked: extractPropertyStr(body, 'textureChecked'),
      textureUnchecked: extractPropertyStr(body, 'textureUnchecked'),
      textureFocusedChecked: extractPropertyStr(body, 'textureFocusedChecked'),
      textureFocusedUnchecked: extractPropertyStr(body, 'textureFocusedUnchecked'),
      textureHoverChecked: extractPropertyStr(body, 'textureHoverChecked'),
      textureHoverUnchecked: extractPropertyStr(body, 'textureHoverUnchecked'),
      texturePressedChecked: extractPropertyStr(body, 'texturePressedChecked'),
      texturePressedUnchecked: extractPropertyStr(body, 'texturePressedUnchecked'),
      textureDisabledChecked: extractPropertyStr(body, 'textureDisabledChecked'),
      textureDisabledUnchecked: extractPropertyStr(body, 'textureDisabledUnchecked'),
      // MapControl
      colorOutside: parseColorArray(extractProperty(body, 'colorOutside')),
      colorSea: parseColorArray(extractProperty(body, 'colorSea')),
      colorForest: parseColorArray(extractProperty(body, 'colorForest')),
      colorRocks: parseColorArray(extractProperty(body, 'colorRocks')),
      colorCountlines: parseColorArray(extractProperty(body, 'colorCountlines')),
      colorMainCountlines: parseColorArray(extractProperty(body, 'colorMainCountlines')),
      colorCountlinesWater: parseColorArray(extractProperty(body, 'colorCountlinesWater')),
      colorMainCountlinesWater: parseColorArray(extractProperty(body, 'colorMainCountlinesWater')),
      colorForestBorder: parseColorArray(extractProperty(body, 'colorForestBorder')),
      colorRocksBorder: parseColorArray(extractProperty(body, 'colorRocksBorder')),
      colorPowerLines: parseColorArray(extractProperty(body, 'colorPowerLines')),
      colorRailWay: parseColorArray(extractProperty(body, 'colorRailWay')),
      colorNames: parseColorArray(extractProperty(body, 'colorNames')),
      colorInactive: parseColorArray(extractProperty(body, 'colorInactive')),
      colorLevels: parseColorArray(extractProperty(body, 'colorLevels')),
      colorTracks: parseColorArray(extractProperty(body, 'colorTracks')),
      colorRoads: parseColorArray(extractProperty(body, 'colorRoads')),
      colorMainRoads: parseColorArray(extractProperty(body, 'colorMainRoads')),
      colorTracksFill: parseColorArray(extractProperty(body, 'colorTracksFill')),
      colorRoadsFill: parseColorArray(extractProperty(body, 'colorRoadsFill')),
      colorMainRoadsFill: parseColorArray(extractProperty(body, 'colorMainRoadsFill')),
      colorGrid: parseColorArray(extractProperty(body, 'colorGrid')),
      colorGridMap: parseColorArray(extractProperty(body, 'colorGridMap')),
      scaleMin: parseOptionalFloat(extractProperty(body, 'scaleMin')),
      scaleMax: parseOptionalFloat(extractProperty(body, 'scaleMax')),
      scaleDefault: parseOptionalFloat(extractProperty(body, 'scaleDefault')),
      maxSatelliteAlpha: parseOptionalFloat(extractProperty(body, 'maxSatelliteAlpha')),
      alphaFadeStartScale: parseOptionalFloat(extractProperty(body, 'alphaFadeStartScale')),
      alphaFadeEndScale: parseOptionalFloat(extractProperty(body, 'alphaFadeEndScale')),
      fontLabel: extractPropertyStr(body, 'fontLabel'),
      sizeExLabel: parseCoordValue(extractProperty(body, 'sizeExLabel') ?? undefined),
      fontGrid: extractPropertyStr(body, 'fontGrid'),
      sizeExGrid: parseOptionalFloat(extractProperty(body, 'sizeExGrid')),
      fontUnits: extractPropertyStr(body, 'fontUnits'),
      sizeExUnits: parseCoordValue(extractProperty(body, 'sizeExUnits') ?? undefined),
      fontNames: extractPropertyStr(body, 'fontNames'),
      sizeExNames: parseCoordValue(extractProperty(body, 'sizeExNames') ?? undefined),
      fontInfo: extractPropertyStr(body, 'fontInfo'),
      sizeExInfo: parseCoordValue(extractProperty(body, 'sizeExInfo') ?? undefined),
      fontLevel: extractPropertyStr(body, 'fontLevel'),
      sizeExLevel: parseOptionalFloat(extractProperty(body, 'sizeExLevel')),
      moveOnEdges: parseOptionalInt(extractProperty(body, 'moveOnEdges')),
      widthRailWay: parseOptionalFloat(extractProperty(body, 'widthRailWay')),
      ptsPerSquareSea: parseOptionalInt(extractProperty(body, 'ptsPerSquareSea')),
      ptsPerSquareTxt: parseOptionalInt(extractProperty(body, 'ptsPerSquareTxt')),
      ptsPerSquareCLn: parseOptionalInt(extractProperty(body, 'ptsPerSquareCLn')),
      ptsPerSquareExp: parseOptionalInt(extractProperty(body, 'ptsPerSquareExp')),
      ptsPerSquareCost: parseOptionalInt(extractProperty(body, 'ptsPerSquareCost')),
      ptsPerSquareFor: parseOptionalInt(extractProperty(body, 'ptsPerSquareFor')),
      ptsPerSquareForEdge: parseOptionalInt(extractProperty(body, 'ptsPerSquareForEdge')),
      ptsPerSquareRoad: parseOptionalInt(extractProperty(body, 'ptsPerSquareRoad')),
      ptsPerSquareObj: parseOptionalInt(extractProperty(body, 'ptsPerSquareObj')),
      showCountourInterval: parseOptionalInt(extractProperty(body, 'showCountourInterval')),
    };
    // Resolve framework class inheritance from COMPONENT_PRESETS
    if (parentClass) {
      const preset = getPresetByParentClass(parentClass);
      if (preset) {
        const base: Partial<ControlConfig> = { ...preset.defaultProperties };
        // Merge: use base values where parsed has generic defaults
        for (const key of Object.keys(base) as (keyof ControlConfig)[]) {
          const baseVal = base[key];
          if (baseVal === undefined) continue;
          if (key === 'id' || key === 'className' || key === 'idc' || key === 'eventHandlers' || key === 'children') continue;
          const parsedVal = (result as unknown as Record<string, unknown>)[key];
          if (isGenericDefault(key, parsedVal)) {
            (result as unknown as Record<string, unknown>)[key] = baseVal;
          }
        }
      }
    }
    return result;
  } catch {
    return null;
  }
}

function parseColorArray(raw: string | null): [number, number, number, number] | undefined {
  if (!raw) return undefined;
  // Handle color arrays that may contain quoted SQF expressions like:
  // {"(profileNamespace getvariable [...])", 0, 0, 0.5}
  // Split respecting quoted strings
  const parts = splitArrayValues(raw);
  if (parts.length >= 4) {
    const nums = parts.map(s => {
      // If it's a quoted SQF expression, treat as 0 (placeholder)
      const trimmed = s.trim();
      if ((trimmed.startsWith('"') || trimmed.startsWith("'")) && (trimmed.endsWith('"') || trimmed.endsWith("'"))) {
        return 0;
      }
      const n = parseFloat(trimmed);
      return isNaN(n) ? 0 : n;
    });
    return [nums[0], nums[1], nums[2], nums[3]];
  }
  return undefined;
}

// Split array values respecting quoted strings (handles commas inside quotes)
function splitArrayValues(raw: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (!inQuote && (ch === '"' || ch === "'")) {
      inQuote = true;
      quoteChar = ch;
      current += ch;
    } else if (inQuote && ch === quoteChar) {
      inQuote = false;
      quoteChar = '';
      current += ch;
    } else if (!inQuote && ch === ',') {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

// =============================================================================
// New parser helpers for type-specific properties
// =============================================================================

function parseOptionalFloat(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw);
  return isNaN(n) ? undefined : n;
}

function parseOptionalInt(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return isNaN(n) ? undefined : n;
}

function extractPropertyStr(body: string, propName: string): string | undefined {
  const val = extractProperty(body, propName);
  return val || undefined;
}

function parseSound(raw: string | null): SoundEntry | undefined {
  if (!raw) return undefined;
  // Format: {"file", volume, pitch}
  const match = raw.match(/\{\s*"([^"]+)"\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\}/);
  if (match) {
    return [match[1], parseFloat(match[2]), parseFloat(match[3])];
  }
  return undefined;
}

// Parse a color array that may have SQF expressions
function parseColorOrSqf(raw: string | null): ColorArray | undefined {
  if (!raw) return undefined;
  const parts = splitArrayValues(raw);
  if (parts.length >= 4) {
    const elements = parts.map(s => {
      const trimmed = s.trim();
      if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
        // Return the SQF expression as a string (keep it quoted context-aware)
        const inner = trimmed.slice(1, -1);
        const num = parseFloat(inner);
        return isNaN(num) ? inner : num;
      }
      const n = parseFloat(trimmed);
      return isNaN(n) ? 0 : n;
    });
    return [elements[0], elements[1], elements[2], elements[3]];
  }
  return undefined;
}

// Extract nested sub-class body (brace counting)
function parseSubClass(body: string, name: string): string | null {
  const regex = new RegExp(`class\\s+${escapeRegex(name)}\\s*(?::\\s*\\w+)?\\s*\\{`, 'i');
  const match = body.match(regex);
  if (match && match.index !== undefined) {
    const openIdx = match.index! + match[0].length - 1;
    return matchBraces(body, openIdx);
  }
  return null;
}

function parseSubClassRect(subBody: string | null): RectPos | undefined {
  if (!subBody) return undefined;
  const left = parseCoordValue(extractProperty(subBody, 'left') ?? '0');
  const top = parseCoordValue(extractProperty(subBody, 'top') ?? '0');
  const right = parseCoordValue(extractProperty(subBody, 'right') ?? '0');
  const bottom = parseCoordValue(extractProperty(subBody, 'bottom') ?? '0');
  const w = parseCoordValue(extractProperty(subBody, 'w') ?? undefined);
  const h = parseCoordValue(extractProperty(subBody, 'h') ?? undefined);
  const rect: RectPos = { left, top, right, bottom };
  if (w !== undefined) rect.w = w;
  if (h !== undefined) rect.h = h;
  return rect;
}

function parseSubClassAttributes(subBody: string | null): StructuredAttributes | undefined {
  if (!subBody) return undefined;
  return {
    font: extractProperty(subBody, 'font') ?? 'RobotoCondensed',
    color: extractProperty(subBody, 'color') ?? '#ffffff',
    align: extractProperty(subBody, 'align') ?? 'left',
    shadow: parseOptionalInt(extractProperty(subBody, 'shadow')) ?? 1,
  };
}

function parseSubClassImageAttributes(subBody: string | null): ImageAttributes | undefined {
  if (!subBody) return undefined;
  return {
    font: extractProperty(subBody, 'font') ?? 'RobotoCondensed',
    color: extractProperty(subBody, 'color') ?? '#E5E5E5',
    align: extractProperty(subBody, 'align') ?? 'left',
  };
}

function parseScrollBarSubClass(subBody: string | null): ScrollBarConfig | undefined {
  if (!subBody) return undefined;
  const config: ScrollBarConfig = {};
  const w = extractProperty(subBody, 'width');
  const h = extractProperty(subBody, 'height');
  if (w !== null) config.width = parseFloat(w);
  if (h !== null) config.height = parseFloat(h);
  const ase = extractProperty(subBody, 'autoScrollEnabled');
  if (ase !== null) config.autoScrollEnabled = parseInt(ase);
  const ass = extractProperty(subBody, 'autoScrollSpeed');
  if (ass !== null) config.autoScrollSpeed = parseFloat(ass);
  const asd = extractProperty(subBody, 'autoScrollDelay');
  if (asd !== null) config.autoScrollDelay = parseFloat(asd);
  const asr = extractProperty(subBody, 'autoScrollRewind');
  if (asr !== null) config.autoScrollRewind = parseFloat(asr);
  const ss = extractProperty(subBody, 'scrollSpeed');
  if (ss !== null) config.scrollSpeed = parseFloat(ss);
  const col = extractProperty(subBody, 'color');
  if (col !== null) config.color = parseColorArray(col);
  const ca = extractProperty(subBody, 'colorActive');
  if (ca !== null) config.colorActive = parseColorArray(ca);
  const cd = extractProperty(subBody, 'colorDisabled');
  if (cd !== null) config.colorDisabled = parseColorArray(cd);
  config.thumb = extractPropertyStr(subBody, 'thumb');
  config.arrowEmpty = extractPropertyStr(subBody, 'arrowEmpty');
  config.arrowFull = extractPropertyStr(subBody, 'arrowFull');
  config.border = extractPropertyStr(subBody, 'border');
  const sh = extractProperty(subBody, 'shadow');
  if (sh !== null) config.shadow = parseInt(sh);
  return Object.keys(config).length > 0 ? config : undefined;
}

function parseStringArray(raw: string | null): string[] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(',').map(s => {
    const trimmed = s.trim();
    if ((trimmed.startsWith('"') || trimmed.startsWith("'")) &&
        (trimmed.endsWith('"') || trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }).filter(Boolean);
  return parts.length > 0 ? parts : undefined;
}

function parseType(raw: string | null): number {
  if (!raw) return 0;
  const typeMap: Record<string, number> = {
    CT_STATIC: 0, CT_BUTTON: 1, CT_EDIT: 2, CT_SLIDER: 3,
    CT_COMBO: 4, CT_LISTBOX: 5, CT_TOOLBOX: 6, CT_CHECKBOXES: 7,
    CT_PROGRESS: 8, CT_HTML: 9, CT_ACTIVETEXT: 11, CT_TREE: 12,
    CT_STRUCTURED_TEXT: 13, CT_CONTEXT_MENU: 14, CT_CONTROLS_GROUP: 15,
    CT_SHORTCUTBUTTON: 16, CT_XBUTTON: 41, CT_XSLIDER: 43,
    CT_XCOMBO: 44, CT_XLISTBOX: 45, CT_CHECKBOX: 77,
    CT_OBJECT: 80, CT_OBJECT_ZOOM: 81, CT_OBJECT_CONTAINER: 82,
    CT_OBJECT_CONT_ANIM: 83, CT_MAP: 100, CT_MAP_MAIN: 101, CT_LISTNBOX: 102,
  };
  return typeMap[raw.trim()] ?? (parseInt(raw) || 0);
}

function parseEventHandlers(body: string): EventHandlerConfig[] {
  const handlers: EventHandlerConfig[] = [];
  const ehRegex = /(on\w+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/g;
  let match;
  while ((match = ehRegex.exec(body)) !== null) {
    if (match[1].startsWith('on')) {
      handlers.push({
        id: generateId(),
        event: match[1],
        code: match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
      });
    }
  }
  return handlers;
}

function parseCoordValue(raw: string | number | undefined): string | number {
  if (raw === undefined) return 0;
  if (typeof raw === 'number') return raw;
  const str = String(raw).trim();
  // Remove surrounding quotes
  const unquoted = (str.startsWith('"') && str.endsWith('"')) ? str.slice(1, -1) : str;
  // Check if it's a simple number
  const num = parseFloat(unquoted);
  if (!isNaN(num) && String(num) === unquoted) {
    return num;
  }
  // Return as expression
  return unquoted;
}

function generateId(): string {
  return `ctrl_${Math.random().toString(36).slice(2, 10)}`;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toTitleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
