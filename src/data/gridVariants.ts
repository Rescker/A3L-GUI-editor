// =============================================================================
// GUI_GRID Variants — All predefined grid variant formulas
// Based on \a3\ui_f\hpp\definecommongrids.inc
// =============================================================================

import type { GridVariant } from '../types/controls';

// GUI_GRID_W and GUI_GRID_H are calculated at runtime:
//   GUI_GRID_WAbs = ((safezoneW / safezoneH) min 1.2)
//   GUI_GRID_HAbs = (GUI_GRID_WAbs / 1.2)
//   GUI_GRID_W    = (GUI_GRID_WAbs / 40)
//   GUI_GRID_H    = (GUI_GRID_HAbs / 25)
//   GUI_GRID_X    = safezoneX
//   GUI_GRID_Y    = (safezoneY + safezoneH - GUI_GRID_HAbs)

export const GUI_GRID_VARIANTS: GridVariant[] = [
  {
    name: 'GUI_GRID_CENTER',
    label: 'Center',
    xExpr: 'GUI_GRID_CENTER_X',
    yExpr: 'GUI_GRID_CENTER_Y',
    wExpr: 'GUI_GRID_CENTER_W',
    hExpr: 'GUI_GRID_CENTER_H',
  },
  {
    name: 'GUI_GRID_TOPLEFT',
    label: 'Top Left',
    xExpr: 'GUI_GRID_TOPLEFT_X',
    yExpr: 'GUI_GRID_TOPLEFT_Y',
    wExpr: 'GUI_GRID_TOPLEFT_W',
    hExpr: 'GUI_GRID_TOPLEFT_H',
  },
  {
    name: 'GUI_GRID_TOPCENTER',
    label: 'Top Center',
    xExpr: 'GUI_GRID_TOPCENTER_X',
    yExpr: 'GUI_GRID_TOPCENTER_Y',
    wExpr: 'GUI_GRID_TOPCENTER_W',
    hExpr: 'GUI_GRID_TOPCENTER_H',
  },
  {
    name: 'GUI_GRID_TOPRIGHT',
    label: 'Top Right',
    xExpr: 'GUI_GRID_TOPRIGHT_X',
    yExpr: 'GUI_GRID_TOPRIGHT_Y',
    wExpr: 'GUI_GRID_TOPRIGHT_W',
    hExpr: 'GUI_GRID_TOPRIGHT_H',
  },
  {
    name: 'GUI_GRID_CENTERRIGHT',
    label: 'Center Right',
    xExpr: 'GUI_GRID_CENTERRIGHT_X',
    yExpr: 'GUI_GRID_CENTERRIGHT_Y',
    wExpr: 'GUI_GRID_CENTERRIGHT_W',
    hExpr: 'GUI_GRID_CENTERRIGHT_H',
  },
  {
    name: 'GUI_GRID_BOTTOMRIGHT',
    label: 'Bottom Right',
    xExpr: 'GUI_GRID_BOTTOMRIGHT_X',
    yExpr: 'GUI_GRID_BOTTOMRIGHT_Y',
    wExpr: 'GUI_GRID_BOTTOMRIGHT_W',
    hExpr: 'GUI_GRID_BOTTOMRIGHT_H',
  },
  {
    name: 'GUI_GRID_BOTTOMCENTER',
    label: 'Bottom Center',
    xExpr: 'GUI_GRID_BOTTOMCENTER_X',
    yExpr: 'GUI_GRID_BOTTOMCENTER_Y',
    wExpr: 'GUI_GRID_BOTTOMCENTER_W',
    hExpr: 'GUI_GRID_BOTTOMCENTER_H',
  },
  {
    name: 'GUI_GRID_BOTTOMLEFT',
    label: 'Bottom Left',
    xExpr: 'GUI_GRID_BOTTOMLEFT_X',
    yExpr: 'GUI_GRID_BOTTOMLEFT_Y',
    wExpr: 'GUI_GRID_BOTTOMLEFT_W',
    hExpr: 'GUI_GRID_BOTTOMLEFT_H',
  },
];

export const RESOLUTION_PRESETS = [
  { label: '1920×1080 (Full HD)', w: 1920, h: 1080 },
  { label: '2560×1440 (QHD)', w: 2560, h: 1440 },
  { label: '3840×2160 (4K UHD)', w: 3840, h: 2160 },
  { label: '1280×720 (HD)', w: 1280, h: 720 },
  { label: '1680×1050 (WSXGA+)', w: 1680, h: 1050 },
  { label: '2560×1080 (UltraWide)', w: 2560, h: 1080 },
  { label: '3440×1440 (UltraWide QHD)', w: 3440, h: 1440 },
];

export const UI_SCALE_FACTORS: Record<string, number> = {
  very_small: 0.75,
  small: 0.875,
  normal: 1.0,
  large: 1.125,
  very_large: 1.25,
};

export const UI_SCALE_LABELS: Record<string, string> = {
  very_small: 'Very Small (75%)',
  small: 'Small (87.5%)',
  normal: 'Normal (100%)',
  large: 'Large (112.5%)',
  very_large: 'Very Large (125%)',
};

export const GRID_SYSTEM_LABELS: Record<string, string> = {
  absolute: 'Absolute (Legacy)',
  safezone: 'SafeZone',
  gui_grid: 'GUI_GRID',
};
