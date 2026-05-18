// =============================================================================
// Style Flag Utilities — Bitwise operations for Arma 3 control styles
// =============================================================================

import type { ControlType, StyleFlagInfo } from '../types/controls';

// =============================================================================
// All style flags with metadata
// =============================================================================
export const STYLE_FLAGS: StyleFlagInfo[] = [
  { flag: 0x00, name: 'Left', constant: 'ST_LEFT', description: 'Left-align text (default).', applicableTo: 'all' },
  { flag: 0x01, name: 'Right', constant: 'ST_RIGHT', description: 'Right-align text.', applicableTo: 'all' },
  { flag: 0x02, name: 'Center', constant: 'ST_CENTER', description: 'Center-align text.', applicableTo: 'all' },
  { flag: 0x10, name: 'Multi', constant: 'ST_MULTI', description: 'Multiline text. Requires lineSpacing property.', applicableTo: 'all' },
  { flag: 0x20, name: 'Title Bar', constant: 'ST_TITLE_BAR', description: 'Makes dialog draggable via this control.', applicableTo: 'all' },
  { flag: 0x30, name: 'Picture', constant: 'ST_PICTURE', description: 'Renders text as texture path.', applicableTo: 'all' },
  { flag: 0x40, name: 'Frame', constant: 'ST_FRAME', description: 'Decorative frame border. Text overlaps top edge.', applicableTo: 'all' },
  { flag: 0x50, name: 'Background', constant: 'ST_BACKGROUND', description: 'Solid background rectangle.', applicableTo: 'all' },
  { flag: 0x60, name: 'Group Box', constant: 'ST_GROUP_BOX', description: 'Group box style.', applicableTo: 'all' },
  { flag: 0x70, name: 'Group Box 2', constant: 'ST_GROUP_BOX2', description: 'Alternate group box style.', applicableTo: 'all' },
  { flag: 0x80, name: 'HUD Background', constant: 'ST_HUD_BACKGROUND', description: 'HUD-style background.', applicableTo: 'all' },
  { flag: 0x90, name: 'Tile Picture', constant: 'ST_TILE_PICTURE', description: 'Tiled picture. Requires tileH and tileW.', applicableTo: 'all' },
  { flag: 0xA0, name: 'With Rect', constant: 'ST_WITH_RECT', description: 'Draw with rectangle outline.', applicableTo: 'all' },
  { flag: 0xB0, name: 'Line', constant: 'ST_LINE', description: 'Draw a line.', applicableTo: 'all' },
  { flag: 0xC0, name: 'Uppercase', constant: 'ST_UPPERCASE', description: 'Force text to uppercase.', applicableTo: 'all' },
  { flag: 0xD0, name: 'Lowercase', constant: 'ST_LOWERCASE', description: 'Force text to lowercase.', applicableTo: 'all' },
  { flag: 0x0100, name: 'Shadow', constant: 'ST_SHADOW', description: 'Add text shadow.', applicableTo: 'all' },
  { flag: 0x0200, name: 'No Rect', constant: 'ST_NO_RECT', description: 'Remove border. Use with ST_MULTI.', applicableTo: 'all' },
  { flag: 0x0800, name: 'Keep Aspect Ratio', constant: 'ST_KEEP_ASPECT_RATIO', description: 'Maintain aspect ratio for ST_PICTURE / ST_TILE_PICTURE.', applicableTo: 'all' },
  // Listbox-specific
  { flag: 0x10, name: 'Textures', constant: 'LB_TEXTURES', description: 'Use textures in listbox entries.', applicableTo: [5, 102] },
  { flag: 0x20, name: 'Multi-Select', constant: 'LB_MULTI', description: 'Allow multiple selection in listbox.', applicableTo: [5, 102] },
  // Slider-specific
  { flag: 0x0000, name: 'Vertical', constant: 'SL_VERT', description: 'Vertical slider orientation.', applicableTo: [3, 43] },
  { flag: 0x0400, name: 'Horizontal', constant: 'SL_HORZ', description: 'Horizontal slider orientation.', applicableTo: [3, 43] },
  // Progress-specific
  { flag: 0x01, name: 'Progress Vertical', constant: 'ST_VERTICAL', description: 'Vertical progress bar.', applicableTo: [8] },
  { flag: 0x0000, name: 'Progress Horizontal', constant: 'ST_HORIZONTAL', description: 'Horizontal progress bar.', applicableTo: [8] },
];

// Obsolete styles that cause .rpt spam in A3
export const OBSOLETE_STYLES = new Set([0x03, 0x0C, 0x1000]);
export const OBSOLETE_STYLE_NAMES: Record<number, string> = {
  0x03: 'ST_UP',         // obsolete, causes .rpt spam
  0x0C: 'ST_DOWN',       // obsolete, causes .rpt spam
  0x1000: 'ST_VCENTER',  // obsolete, causes .rpt spam
};

// =============================================================================
// Bitwise helpers
// =============================================================================
export function hasStyleFlag(style: number, flag: number): boolean {
  return (style & flag) === flag;
}

export function toggleStyleFlag(style: number, flag: number): number {
  return hasStyleFlag(style, flag) ? style & ~flag : style | flag;
}

export function combineStyleFlags(flags: number[]): number {
  return flags.reduce((acc, flag) => acc | flag, 0);
}

export function parseStyleFlags(style: number): number[] {
  // Decompose a combined style integer into individual flags
  const result: number[] = [];
  for (const sf of STYLE_FLAGS) {
    if (hasStyleFlag(style, sf.flag)) {
      result.push(sf.flag);
    }
  }
  return result;
}

export function getApplicableStyles(controlType: ControlType): StyleFlagInfo[] {
  return STYLE_FLAGS.filter(sf => {
    if (sf.applicableTo === 'all') return true;
    return sf.applicableTo.includes(controlType);
  });
}

export function getStyleName(flag: number): string {
  return STYLE_FLAGS.find(sf => sf.flag === flag)?.name ?? `0x${flag.toString(16).toUpperCase()}`;
}

export function getStyleConstant(flag: number): string {
  return STYLE_FLAGS.find(sf => sf.flag === flag)?.constant ?? `0x${flag.toString(16).toUpperCase()}`;
}

export function styleFlagsToHex(style: number): string {
  return `0x${style.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function hasObsoleteStyle(style: number): { flag: number; name: string } | null {
  for (const [flagHex, name] of Object.entries(OBSOLETE_STYLE_NAMES)) {
    const flag = parseInt(flagHex);
    if (hasStyleFlag(style, flag)) {
      return { flag, name };
    }
  }
  // Also check standard flags map for deprecated ones
  for (const [flagHex, name] of Object.entries(OBSOLETE_STYLE_NAMES)) {
    if (hasStyleFlag(style, parseInt(flagHex))) {
      return { flag: parseInt(flagHex), name };
    }
  }
  return null;
}

// =============================================================================
// Resolve control type to applicable event categories
// =============================================================================
export function getEventCategories(type: ControlType): string[] {
  const cats: string[] = ['display', 'control']; // generic events always available
  if (type === 1 || type === 16 || type === 41) cats.push('button');
  if (type === 5 || type === 4 || type === 44 || type === 102) cats.push('listbox', 'combo');
  if (type === 12) cats.push('tree');
  if (type === 77 || type === 7) cats.push('checkbox');
  if (type === 3 || type === 43) cats.push('slider');
  if ([6, 9, 14, 11].includes(type)) cats.push('misc');
  return cats;
}
