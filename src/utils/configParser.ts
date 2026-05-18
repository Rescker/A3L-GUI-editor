// =============================================================================
// Config Parser — Parses Arma 3 config.cpp / description.ext input
// Handles: Editor format ($[...]), class format, preprocessor defines.
// =============================================================================

import type { ControlConfig, DialogConfig, EventHandlerConfig, UIContainerType } from '../types/controls';

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

  return controls.map(child => {
    // If parent class is one of the controls in the same dialog, merge
    const parent = byName.get(child.parentClass);
    if (!parent) return child;

    // Merge: child properties override parent, but only for fields that
    // still have their default values (meaning they weren't explicitly set)
    return {
      ...parent,
      ...child,
      // Always use child's identity fields
      id: child.id,
      className: child.className,
      idc: child.idc,
      eventHandlers: child.eventHandlers,
      // For inheriting controls, use child's explicit values or fall back to parent
      x: isDefaultValue(child.x, '0') ? parent.x : child.x,
      y: isDefaultValue(child.y, '0') ? parent.y : child.y,
      w: isDefaultValue(child.w, '10') ? parent.w : child.w,
      h: isDefaultValue(child.h, '2') ? parent.h : child.h,
      sizeEx: child.sizeEx === 4 ? parent.sizeEx : child.sizeEx,
      font: child.font === 'RobotoCondensed' ? parent.font : child.font,
      colorText: arraysEqual(child.colorText, [1, 1, 1, 1]) ? parent.colorText : child.colorText,
      colorBackground: arraysEqual(child.colorBackground, [0, 0, 0, 0]) ? parent.colorBackground : child.colorBackground,
      text: child.text === '' ? parent.text : child.text,
      style: child.style === 0 ? parent.style : child.style,
      type: child.type === 0 ? parent.type : child.type,
    };
  });
}

function isDefaultValue(val: string | number, defaultStr: string): boolean {
  if (typeof val === 'number') return val === parseFloat(defaultStr);
  return val === defaultStr;
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => Math.abs(v - b[i]) < 0.0001);
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

    return {
      id: generateId(),
      className,
      parentClass: parentClass ?? 'RscText',
      type: ctrlType as ControlConfig['type'],
      style: parseInt(extractProperty(body, 'style')?.replace('0x', '') ?? '0', 16) || 0,
      x: parseCoordValue(extractProperty(body, 'x') ?? '0'),
      y: parseCoordValue(extractProperty(body, 'y') ?? '0'),
      w: parseCoordValue(extractProperty(body, 'w') ?? '10'),
      h: parseCoordValue(extractProperty(body, 'h') ?? '2'),
      sizeEx: parseFloat(extractProperty(body, 'sizeEx') ?? '4'),
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
    };
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
