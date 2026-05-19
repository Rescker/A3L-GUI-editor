// =============================================================================
// Arma 3 Life Framework Component Library
// Complete preset catalog of all Life_Rsc* UI components from the Life HPP.
// Each preset contains the exact default property values defined in the framework.
// =============================================================================

import type { ControlConfig, ControlType } from '../types/controls';

export type ComponentCategory =
  | 'Checkboxes'
  | 'Scrollbars'
  | 'Control Groups'
  | 'HUD / Text'
  | 'Lists & Selection'
  | 'Buttons'
  | 'Visuals & Inputs'
  | 'Advanced / Specialized';

export interface ComponentPreset {
  id: string;
  label: string;
  category: ComponentCategory;
  controlType: ControlType;
  parentClass: string;
  description: string;
  defaultProperties: Partial<ControlConfig>;
}

// =============================================================================
// Base coordinate expressions using GUI_GRID_CENTER
// =============================================================================

const GW = '1 * GUI_GRID_CENTER_W';
const GH = '1 * GUI_GRID_CENTER_H';
const GX = 'GUI_GRID_CENTER_X';
const GY = 'GUI_GRID_CENTER_Y';

const sizeExpr =
  '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1)';
const sizeExpr08 =
  '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 0.8)';

// =============================================================================
// ALL COMPONENT PRESETS
// =============================================================================

export const COMPONENT_PRESETS: ComponentPreset[] = [

  // ===========================================================================
  // CATEGORY: Checkboxes
  // ===========================================================================

  {
    id: 'life_checkbox',
    label: 'Life_Checkbox',
    category: 'Checkboxes',
    controlType: 77,
    parentClass: 'Life_Checkbox',
    description: 'Single checkbox with label text and texture states. Type 77 (CT_CHECKBOX).',
    defaultProperties: {
      type: 77,
      style: 0x00 + 0x10,       // ST_LEFT + ST_MULTI
      default: 0,
      blinkingPeriod: 0,
      x: '0',
      y: '0',
      w: GW,
      h: GH,
      colorText: [1, 1, 1, 0.7],
      colorBackground: [0, 0, 0, 0],
      colorHover: [1, 1, 1, 1],
      colorFocused: [1, 1, 1, 1],
      colorPressed: [1, 1, 1, 1],
      colorDisabled: [1, 1, 1, 0.2],
      colorBackgroundHover: [0, 0, 0, 0],
      colorBackgroundFocused: [0, 0, 0, 0],
      colorBackgroundPressed: [0, 0, 0, 0],
      colorBackgroundDisabled: [0, 0, 0, 0],
      textureChecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_checked_ca.paa',
      textureUnchecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_unchecked_ca.paa',
      textureFocusedChecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_checked_ca.paa',
      textureFocusedUnchecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_unchecked_ca.paa',
      textureHoverChecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_checked_ca.paa',
      textureHoverUnchecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_unchecked_ca.paa',
      texturePressedChecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_checked_ca.paa',
      texturePressedUnchecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_unchecked_ca.paa',
      textureDisabledChecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_checked_ca.paa',
      textureDisabledUnchecked: '\\A3\\Ui_f\\data\\GUI\\RscCommon\\RscCheckBox\\CheckBox_unchecked_ca.paa',
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
      access: 0,
      sizeEx: 4,
      font: 'RobotoCondensed',
      tooltipColorShade: [0, 0, 0, 1],
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
    },
  },

  {
    id: 'life_rsccheckbox',
    label: 'Life_RscCheckbox',
    category: 'Checkboxes',
    controlType: 7,
    parentClass: 'Life_RscCheckbox',
    description: 'Multiple checkboxes control (CT_CHECKBOXES). Array of bool states with configurable rows/columns.',
    defaultProperties: {
      type: 7,
      style: 0,
      rows: 1,
      columns: 1,
      strings: ['UNCHECKED'],
      checkedStrings: ['CHECKED'],
      colorText: [1, 0, 0, 1],
      colorBackground: [0, 0, 1, 1],
      colorTextSelect: [0, 0.8, 0, 1],
      colorSelectedBg: [0.3843, 0.7019, 0.8862, 1],
      colorSelect: [0, 0, 0, 1],
      colorTextDisable: [0.4, 0.4, 0.4, 1],
      colorDisable: [0.4, 0.4, 0.4, 1],
      font: 'RobotoCondensed',
      sizeEx: sizeExpr08,
    },
  },

  // ===========================================================================
  // CATEGORY: Scrollbars
  // ===========================================================================

  {
    id: 'life_rscscrollbar',
    label: 'Life_RscScrollBar',
    category: 'Scrollbars',
    controlType: 0,
    parentClass: 'Life_RscScrollBar',
    description: 'Scrollbar with configurable speed, textures, and auto-scroll behavior.',
    defaultProperties: {
      type: 0,
      style: 0,
      colorText: [1, 1, 1, 0.6],
      colorActive: [1, 1, 1, 1],
      colorDisabled: [1, 1, 1, 0.3],
      thumb: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\thumb_ca.paa',
      arrowEmpty: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowEmpty_ca.paa',
      arrowFull: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowFull_ca.paa',
      border: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\border_ca.paa',
      shadow: 0,
      autoScrollSpeed: -1,
      autoScrollDelay: 5,
      autoScrollRewind: 0,
      autoScrollEnabled: 1,
    },
  },

  // ===========================================================================
  // CATEGORY: Control Groups
  // ===========================================================================

  {
    id: 'life_rsccontrolsgroup',
    label: 'Life_RscControlsGroup',
    category: 'Control Groups',
    controlType: 15,
    parentClass: 'Life_RscControlsGroup',
    description: 'Container for other controls. Children use relative coordinates. In-game scrollbars appear on overflow.',
    defaultProperties: {
      type: 15,
      style: 16,
      shadow: 0,
      x: '0',
      y: '0',
      w: '20 * GUI_GRID_CENTER_W',
      h: '15 * GUI_GRID_CENTER_H',
      vScrollBar: {
        width: 0.021,
        autoScrollEnabled: 1,
      },
      hScrollBar: {
        height: 0.028,
      },
    },
  },

  {
    id: 'life_rsccontrolsgroupnoscrollbars',
    label: 'Life_RscControlsGroupNoScrollbars',
    category: 'Control Groups',
    controlType: 15,
    parentClass: 'Life_RscControlsGroupNoScrollbars',
    description: 'Controls group without scrollbars. Scrollbar width/height set to 0.',
    defaultProperties: {
      type: 15,
      style: 16,
      shadow: 0,
      x: '0',
      y: '0',
      w: '20 * GUI_GRID_CENTER_W',
      h: '15 * GUI_GRID_CENTER_H',
      vScrollBar: {
        width: 0,
      },
      hScrollBar: {
        height: 0,
      },
    },
  },

  // ===========================================================================
  // CATEGORY: HUD / Text Elements
  // ===========================================================================

  {
    id: 'life_rschud',
    label: 'Life_RscHud',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscHud',
    description: 'Basic HUD text element with bold font and large text area.',
    defaultProperties: {
      type: 0,
      style: 0x00,
      colorText: [1, 1, 1, 1],
      colorBackground: [1, 1, 1, 0],
      font: 'RobotoCondensedBold',
      sizeEx: 0.025,
      h: 0.25,
      text: '',
    },
  },

  {
    id: 'life_rsctext',
    label: 'Life_RscText',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscText',
    description: 'Standard static text element with shadow. Base class for most text controls.',
    defaultProperties: {
      type: 0,
      style: 0,
      shadow: 1,
      colorShadow: [0, 0, 0, 0.5],
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorBackground: [0, 0, 0, 0],
      lineSpacing: 1,
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
    },
  },

  {
    id: 'life_rscline',
    label: 'Life_RscLine',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscLine',
    description: 'Horizontal line (decorative separator) using ST_LINE style.',
    defaultProperties: {
      type: 0,
      style: 176,
      colorText: [1, 1, 1, 1],
      colorBackground: [0, 0, 0, 0],
      text: '',
    },
  },

  {
    id: 'life_rsctitle',
    label: 'Life_RscTitle',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscTitle',
    description: 'Section title text with slightly off-white color.',
    defaultProperties: {
      type: 0,
      style: 0,
      colorText: [0.95, 0.95, 0.95, 1],
      sizeEx: sizeExpr,
    },
  },

  {
    id: 'life_rsctextmulti',
    label: 'Life_RscTextMulti',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscTextMulti',
    description: 'Multi-line text with ST_MULTI + ST_NO_RECT styles.',
    defaultProperties: {
      type: 0,
      style: 0 + 16 + 0x200,
      lineSpacing: 1,
    },
  },

  {
    id: 'life_rscstructuredtext',
    label: 'Life_RscStructuredText',
    category: 'HUD / Text',
    controlType: 13,
    parentClass: 'Life_RscStructuredText',
    description: 'Rich text control supporting size/color/align tags via parseText.',
    defaultProperties: {
      type: 13,
      style: 0,
      size: sizeExpr,
      colorText: [1, 1, 1, 1],
      shadow: 1,
      structuredAttributes: {
        font: 'RobotoCondensed',
        color: '#ffffff',
        align: 'left',
        shadow: 1,
      },
    },
  },

  {
    id: 'life_rscactivetext',
    label: 'Life_RscActiveText',
    category: 'HUD / Text',
    controlType: 11,
    parentClass: 'Life_RscActiveText',
    description: 'Clickable text link with hover color change and action property.',
    defaultProperties: {
      type: 11,
      style: 0,
      font: 'RobotoCondensedLight',
      sizeEx: 0.04,
      colorText: [1, 1, 1, 1],
      colorActive: [1, 0.2, 0.2, 1],
      soundEnter: ['\\A3\\ui_f\\data\\sound\\onover', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\new1', 0, 0],
      soundClick: ['\\A3\\ui_f\\data\\sound\\onclick', 0.07, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\onescape', 0.09, 1],
      action: '',
      text: '',
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
    },
  },

  {
    id: 'life_rscframe',
    label: 'Life_RscFrame',
    category: 'HUD / Text',
    controlType: 0,
    parentClass: 'Life_RscFrame',
    description: 'Decorative frame border (ST_FRAME). Text overlaps the top edge.',
    defaultProperties: {
      type: 0,
      style: 64,
      shadow: 2,
      colorText: [1, 1, 1, 1],
      colorBackground: [0, 0, 0, 0],
      font: 'RobotoCondensed',
      sizeEx: 0.02,
    },
  },

  // ===========================================================================
  // CATEGORY: Lists & Selection
  // ===========================================================================

  {
    id: 'life_rsclistnbox',
    label: 'Life_RscListNBox',
    category: 'Lists & Selection',
    controlType: 102,
    parentClass: 'Life_RscListNBox',
    description: 'Multi-column listbox (CT_LISTNBOX) with sortable columns.',
    defaultProperties: {
      type: 102,
      style: 16,
      shadow: 0,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorDisabled: [1, 1, 1, 0.25],
      colorScrollbar: [0.95, 0.95, 0.95, 1],
      colorSelect: [0, 0, 0, 1],
      colorSelect2: [0, 0, 0, 1],
      colorSelectBackground: [0.8, 0.8, 0.8, 1],
      colorSelectBackground2: [1, 1, 1, 0.5],
      colorPicture: [1, 1, 1, 1],
      colorPictureSelected: [1, 1, 1, 1],
      colorPictureDisabled: [1, 1, 1, 1],
      soundSelect: ['', 0.1, 1],
      soundExpand: ['', 0.1, 1],
      soundCollapse: ['', 0.1, 1],
      period: 1.2,
      maxHistoryDelay: 0.5,
      autoScrollSpeed: -1,
      autoScrollDelay: 5,
      autoScrollRewind: 0,
    },
  },

  {
    id: 'life_rsclistbox',
    label: 'Life_RscListBox',
    category: 'Lists & Selection',
    controlType: 5,
    parentClass: 'Life_RscListBox',
    description: 'Standard listbox (CT_LISTBOX) with selectable items and scrollbar.',
    defaultProperties: {
      type: 5,
      style: 16,
      font: 'RobotoCondensed',
      sizeEx: 0.023,
      colorText: [1, 1, 1, 1],
      colorBackground: [0.28, 0.28, 0.28, 0.28],
      colorSelect: [1, 1, 1, 1],
      colorSelect2: [1, 1, 1, 1],
      colorSelectBackground: [0.95, 0.95, 0.95, 0.5],
      colorSelectBackground2: [1, 1, 1, 0.5],
      colorScrollbar: [0.2, 0.2, 0.2, 1],
      colorPicture: [1, 1, 1, 1],
      colorPictureSelected: [1, 1, 1, 1],
      colorPictureDisabled: [1, 1, 1, 1],
      colorActive: [0, 0, 0, 1],
      colorDisabled: [0, 0, 0, 0.3],
      arrowEmpty: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowEmpty_ca.paa',
      arrowFull: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowFull_ca.paa',
      wholeHeight: 0.45,
      rowHeight: 0.04,
      soundSelect: ['', 0.1, 1],
      soundExpand: ['', 0.1, 1],
      soundCollapse: ['', 0.1, 1],
      maxHistoryDelay: 1,
      autoScrollSpeed: -1,
      autoScrollDelay: 5,
      autoScrollRewind: 0,
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
    },
  },

  {
    id: 'life_rsccombo',
    label: 'Life_RscCombo',
    category: 'Lists & Selection',
    controlType: 4,
    parentClass: 'Life_RscCombo',
    description: 'Dropdown combo box (CT_COMBO) with scrollable list.',
    defaultProperties: {
      type: 4,
      style: 16,
      shadow: 0,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [0.95, 0.95, 0.95, 1],
      colorBackground: [0.4, 0.4, 0.4, 0.4],
      colorSelect: [0, 0, 0, 1],
      colorSelectBackground: [1, 1, 1, 0.7],
      colorScrollbar: [1, 0, 0, 1],
      colorActive: [1, 0, 0, 1],
      colorDisabled: [1, 1, 1, 0.25],
      soundSelect: ['', 0, 1],
      soundExpand: ['', 0.1, 1],
      soundCollapse: ['', 0.1, 1],
      arrowFull: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowFull_ca.paa',
      arrowEmpty: '\\A3\\ui_f\\data\\gui\\cfg\\scrollbar\\arrowEmpty_ca.paa',
      wholeHeight: 0.45,
      maxHistoryDelay: 1,
    },
  },

  // ===========================================================================
  // CATEGORY: Buttons
  // ===========================================================================

  {
    id: 'life_rscbutton',
    label: 'Life_RscButton',
    category: 'Buttons',
    controlType: 1,
    parentClass: 'Life_RscButton',
    description: 'Standard clickable button with colored background, offsets, and sounds.',
    defaultProperties: {
      type: 1,
      style: 2,
      shadow: 2,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorDisabled: [0.4, 0.4, 0.4, 1],
      colorBackground: [0.69, 0.75, 0.5, 0.7],
      colorBackgroundActive: [0.69, 0.75, 0.5, 1],
      colorBackgroundDisabled: [0.95, 0.95, 0.95, 1],
      colorFocused: [0.69, 0.75, 0.5, 1],
      colorShadow: [0, 0, 0, 1],
      colorBorder: [0, 0, 0, 1],
      borderSize: 0,
      offsetX: 0.003,
      offsetY: 0.003,
      offsetPressedX: 0.002,
      offsetPressedY: 0.002,
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
    },
  },

  {
    id: 'life_rscbuttontextonly',
    label: 'Life_RscButtonTextOnly',
    category: 'Buttons',
    controlType: 1,
    parentClass: 'Life_RscButtonTextOnly',
    description: 'Transparent button — shows text only, no background rectangle.',
    defaultProperties: {
      type: 1,
      style: 2,
      shadow: 2,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr08,
      colorText: [1, 1, 1, 1],
      colorDisabled: [0.4, 0.4, 0.4, 1],
      colorBackground: [1, 1, 1, 0],
      colorBackgroundActive: [1, 1, 1, 0],
      colorBackgroundDisabled: [1, 1, 1, 0],
      colorFocused: [1, 1, 1, 0],
      colorShadow: [1, 1, 1, 0],
      borderSize: 0,
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
    },
  },

  {
    id: 'life_rscshortcutbutton',
    label: 'Life_RscShortcutButton',
    category: 'Buttons',
    controlType: 16,
    parentClass: 'Life_RscShortcutButton',
    description: 'Button with associated keyboard shortcut key display (CT_SHORTCUTBUTTON).',
    defaultProperties: {
      type: 16,
      style: 0,
      default: 0,
      shadow: 1,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorFocused: [1, 1, 1, 1],
      color2: [0.95, 0.95, 0.95, 1],
      colorDisabled: [1, 1, 1, 0.25],
      colorBackground: [0.69, 0.75, 0.5, 1],
      colorBackgroundFocused: [0.69, 0.75, 0.5, 1],
      colorBackground2: [1, 1, 1, 1],
      animTextureDefault: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\normal_ca.paa',
      animTextureNormal: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\normal_ca.paa',
      animTextureDisabled: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\normal_ca.paa',
      animTextureOver: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\over_ca.paa',
      animTextureFocused: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\focus_ca.paa',
      animTexturePressed: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButton\\down_ca.paa',
      period: 0.4,
      periodFocus: 1.2,
      periodOver: 0.8,
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
      action: '',
      attributes: {
        font: 'RobotoCondensed',
        color: '#E5E5E5',
        align: 'left',
        shadow: 'true',
      },
      attributesImage: {
        font: 'RobotoCondensed',
        color: '#E5E5E5',
        align: 'left',
      },
      hitZone: { left: 0, top: 0, right: 0, bottom: 0 },
      shortcutPos: {
        left: 0,
        top: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 20) - (((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1)) / 2',
        w: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1) * (3/4)',
        h: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1)',
        right: 0,
        bottom: 0,
      },
      textPos: {
        left: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1) * (3/4)',
        top: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 20) - (((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1)) / 2',
        right: 0.005,
        bottom: 0,
      },
    },
  },

  {
    id: 'life_rscbuttonmenu',
    label: 'Life_RscButtonMenu',
    category: 'Buttons',
    controlType: 16,
    parentClass: 'Life_RscButtonMenu',
    description: 'Menu-style shortcut button with dark background and uppercase text.',
    defaultProperties: {
      type: 16,
      style: 0x02 + 0xC0,
      default: 0,
      shadow: 0,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorFocused: [0, 0, 0, 1],
      color2: [0, 0, 0, 1],
      colorDisabled: [1, 1, 1, 0.25],
      colorBackground: [0, 0, 0, 0.8],
      colorBackgroundFocused: [1, 1, 1, 1],
      colorBackground2: [0.75, 0.75, 0.75, 1],
      period: 1.2,
      periodFocus: 1.2,
      periodOver: 1.2,
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
      textureNoShortcut: '',
      attributes: {
        font: 'RobotoCondensedLight',
        color: '#E5E5E5',
        align: 'left',
        shadow: 'false',
      },
      shortcutPos: {
        left: '(6.25 * (((safezoneW / safezoneH) min 1.2) / 40)) - 0.0225 - 0.005',
        top: 0.005,
        w: 0.0225,
        h: 0.03,
        right: 0,
        bottom: 0,
      },
      textPos: {
        left: '0.25 * (((safezoneW / safezoneH) min 1.2) / 40)',
        top: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) - (((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1)) / 2',
        right: 0.005,
        bottom: 0,
      },
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButtonMenu\\soundEnter', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButtonMenu\\soundPush', 0.09, 1],
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButtonMenu\\soundClick', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButtonMenu\\soundEscape', 0.09, 1],
    },
  },

  {
    id: 'life_rscshortcutbuttonmain',
    label: 'Life_RscShortcutButtonMain',
    category: 'Buttons',
    controlType: 16,
    parentClass: 'Life_RscShortcutButtonMain',
    description: 'Large main menu shortcut button (wider, taller) with distinct textures.',
    defaultProperties: {
      type: 16,
      style: 0,
      default: 0,
      w: '12.54 * GUI_GRID_CENTER_W',
      h: '2.61 * GUI_GRID_CENTER_H',
      font: 'RobotoCondensed',
      colorText: [1, 1, 1, 1],
      colorDisabled: [1, 1, 1, 0.25],
      sizeEx: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1.2)',
      animTextureNormal: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\normal_ca.paa',
      animTextureDisabled: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\disabled_ca.paa',
      animTextureOver: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\over_ca.paa',
      animTextureFocused: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\focus_ca.paa',
      animTexturePressed: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\down_ca.paa',
      animTextureDefault: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscShortcutButtonMain\\normal_ca.paa',
      period: 0.5,
      soundEnter: ['\\A3\\ui_f\\data\\sound\\onover', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\new1', 0, 0],
      soundClick: ['\\A3\\ui_f\\data\\sound\\onclick', 0.07, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\onescape', 0.09, 1],
      action: '',
      attributes: {
        font: 'RobotoCondensed',
        color: '#E5E5E5',
        align: 'left',
        shadow: 'false',
      },
      attributesImage: {
        font: 'RobotoCondensed',
        color: '#E5E5E5',
        align: 'false',
      },
      hitZone: { left: 0, top: 0, right: 0, bottom: 0 },
      shortcutPos: {
        left: 0.0145,
        top: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 20) - (((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1.2)) / 2',
        w: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1.2) * (3/4)',
        h: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1.2)',
        right: 0,
        bottom: 0,
      },
      textPos: {
        left: '(((safezoneW / safezoneH) min 1.2) / 32) * 1.5',
        top: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 20)*2 - (((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 1.2)) / 2',
        right: 0.005,
        bottom: 0,
      },
    },
  },

  // ===========================================================================
  // CATEGORY: Visuals & Inputs
  // ===========================================================================

  {
    id: 'life_rscpicture',
    label: 'life_RscPicture',
    category: 'Visuals & Inputs',
    controlType: 0,
    parentClass: 'life_RscPicture',
    description: 'Static picture/image display with ST_PICTURE style.',
    defaultProperties: {
      type: 0,
      style: 48,
      sizeEx: 0.023,
      font: 'RobotoCondensed',
      shadow: 0,
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
    },
  },

  {
    id: 'life_rscpicturekeepaspect',
    label: 'Life_RscPictureKeepAspect',
    category: 'Visuals & Inputs',
    controlType: 0,
    parentClass: 'Life_RscPictureKeepAspect',
    description: 'Picture that maintains aspect ratio (ST_PICTURE + ST_KEEP_ASPECT_RATIO).',
    defaultProperties: {
      type: 0,
      style: 0x30 + 0x800,
      sizeEx: 0.023,
      font: 'RobotoCondensed',
      shadow: 0,
      tooltipColorText: [1, 1, 1, 1],
      tooltipColorBox: [1, 1, 1, 1],
      tooltipColorShade: [0, 0, 0, 0.65],
    },
  },

  {
    id: 'life_rscprogress',
    label: 'Life_RscProgress',
    category: 'Visuals & Inputs',
    controlType: 8,
    parentClass: 'Life_RscProgress',
    description: 'Progress bar with frame and colored bar fill (CT_PROGRESS).',
    defaultProperties: {
      type: 8,
      style: 0,
      shadow: 2,
      colorFrame: [0, 0, 0, 1],
      colorBackground: [0, 0, 0, 0.7],
      colorBar: [0.3843, 0.7019, 0.8862, 0.7],
    },
  },

  {
    id: 'life_rscedit',
    label: 'Life_RscEdit',
    category: 'Visuals & Inputs',
    controlType: 2,
    parentClass: 'Life_RscEdit',
    description: 'Text input field (CT_EDIT) with selection color and autocomplete.',
    defaultProperties: {
      type: 2,
      style: 0x00 + 0x40,
      font: 'RobotoCondensed',
      shadow: 2,
      sizeEx: sizeExpr,
      colorText: [0.95, 0.95, 0.95, 1],
      colorBackground: [0, 0, 0, 1],
      colorDisabled: [1, 1, 1, 0.25],
      autocomplete: false,
      colorSelection: [0.3843, 0.7019, 0.8862, 1],
      canModify: 1,
    },
  },

  {
    id: 'life_rscslider',
    label: 'Life_RscSlider',
    category: 'Visuals & Inputs',
    controlType: 3,
    parentClass: 'Life_RscSlider',
    description: 'Slider control (CT_SLIDER) with active color.',
    defaultProperties: {
      type: 3,
      style: 0,
      h: 0.025,
      colorText: [1, 1, 1, 0.8],
      colorActive: [1, 1, 1, 1],
    },
  },

  {
    id: 'life_rscxsliderh',
    label: 'life_RscXSliderH',
    category: 'Visuals & Inputs',
    controlType: 43,
    parentClass: 'life_RscXSliderH',
    description: 'Horizontal XSlider (CT_XSLIDER) with arrow and thumb textures.',
    defaultProperties: {
      type: 43,
      style: 1024,
      shadow: 2,
      x: '0',
      y: '0',
      w: 0.4,
      h: 0.029412,
      colorText: [1, 1, 1, 0.7],
      colorActive: [1, 1, 1, 1],
      colorDisabled: [1, 1, 1, 0.5],
      arrowEmpty: '\\A3\\ui_f\\data\\gui\\cfg\\slider\\arrowEmpty_ca.paa',
      arrowFull: '\\A3\\ui_f\\data\\gui\\cfg\\slider\\arrowFull_ca.paa',
      border: '\\A3\\ui_f\\data\\gui\\cfg\\slider\\border_ca.paa',
      thumb: '\\A3\\ui_f\\data\\gui\\cfg\\slider\\thumb_ca.paa',
    },
  },

  {
    id: 'life_rscbackground',
    label: 'Life_RscBackground',
    category: 'Visuals & Inputs',
    controlType: 0,
    parentClass: 'Life_RscBackground',
    description: 'Full-screen background rectangle with army green tint.',
    defaultProperties: {
      type: 0,
      style: 512,
      shadow: 0,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      colorText: [0.1, 0.1, 0.1, 1],
      colorBackground: [0.48, 0.5, 0.35, 1],
      font: 'RobotoCondensed',
      sizeEx: 1,
    },
  },

  // ===========================================================================
  // CATEGORY: Advanced / Specialized
  // ===========================================================================

  {
    id: 'life_rsctree',
    label: 'Life_RscTree',
    category: 'Advanced / Specialized',
    controlType: 12,
    parentClass: 'Life_RscTree',
    description: 'Hierarchical tree view (CT_TREE) with expandable/collapsible nodes.',
    defaultProperties: {
      type: 12,
      style: 2,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr08,
      colorText: [1, 1, 1, 1],
      colorSelect: [0.7, 0.7, 0.7, 1],
      colorBackground: [0, 0, 0, 0],
      colorSelectBackground: [0, 0, 0, 0.5],
      colorBorder: [0, 0, 0, 0],
      borderSize: 0,
      expandedTexture: 'A3\\ui_f\\data\\gui\\Rsccommon\\Rsctree\\expandedTexture_ca.paa',
      hiddenTexture: 'A3\\ui_f\\data\\gui\\Rsccommon\\Rsctree\\hiddenTexture_ca.paa',
      rowHeight: 0.0439091,
    },
  },

  {
    id: 'life_rschtml',
    label: 'Life_RscHTML',
    category: 'Advanced / Specialized',
    controlType: 9,
    parentClass: 'Life_RscHTML',
    description: 'HTML content renderer (text, images, OGV video) with pagination.',
    defaultProperties: {
      type: 9,
      style: 0,
      shadow: 2,
      sizeEx: sizeExpr,
      colorText: [1, 1, 1, 1],
      colorBold: [1, 1, 1, 1],
      colorLink: [1, 1, 1, 0.75],
      colorLinkActive: [1, 1, 1, 1],
      prevPage: '\\A3\\ui_f\\data\\gui\\Rsccommon\\Rschtml\\arrow_left_ca.paa',
      nextPage: '\\A3\\ui_f\\data\\gui\\Rsccommon\\Rschtml\\arrow_right_ca.paa',
    },
  },

  {
    id: 'life_rschitzones',
    label: 'Life_RscHitZones',
    category: 'Advanced / Specialized',
    controlType: 0,
    parentClass: 'Life_RscHitZones',
    description: 'Defines interactive click zones with configurable grid.',
    defaultProperties: {
      type: 0,
      style: 0,
      xCount: 1,
      yCount: 1,
      xSpace: 0,
      ySpace: 0,
    },
  },

  {
    id: 'life_rscmapcontrol',
    label: 'Life_RscMapControl',
    category: 'Advanced / Specialized',
    controlType: 101,
    parentClass: 'Life_RscMapControl',
    description: 'Full-featured 2D terrain map with terrain coloring, markers, and legend.',
    defaultProperties: {
      type: 101,
      style: 48,
      access: 0,
      colorText: [0, 0, 0, 1],
      colorBackground: [0.969, 0.957, 0.949, 1],
      colorOutside: [0, 0, 0, 1],
      font: 'TahomaB',
      sizeEx: 0.04,
      colorSea: [0.467, 0.631, 0.851, 0.5],
      colorForest: [0.624, 0.78, 0.388, 0.5],
      colorRocks: [0, 0, 0, 0.3],
      colorCountlines: [0.572, 0.354, 0.188, 0.25],
      colorMainCountlines: [0.572, 0.354, 0.188, 0.5],
      colorCountlinesWater: [0.491, 0.577, 0.702, 0.3],
      colorMainCountlinesWater: [0.491, 0.577, 0.702, 0.6],
      colorForestBorder: [0, 0, 0, 0],
      colorRocksBorder: [0, 0, 0, 0],
      colorPowerLines: [0.1, 0.1, 0.1, 1],
      colorRailWay: [0.8, 0.2, 0, 1],
      colorNames: [0.1, 0.1, 0.1, 0.9],
      colorInactive: [1, 1, 1, 0.5],
      colorLevels: [0.286, 0.177, 0.094, 0.5],
      colorTracks: [0.84, 0.76, 0.65, 0.15],
      colorRoads: [0.7, 0.7, 0.7, 1],
      colorMainRoads: [0.9, 0.5, 0.3, 1],
      colorTracksFill: [0.84, 0.76, 0.65, 1],
      colorRoadsFill: [1, 1, 1, 1],
      colorMainRoadsFill: [1, 0.6, 0.4, 1],
      colorGrid: [0.1, 0.1, 0.1, 0.6],
      colorGridMap: [0.1, 0.1, 0.1, 0.6],
      scaleMin: 0.001,
      scaleMax: 1,
      scaleDefault: 0.16,
      maxSatelliteAlpha: 0.85,
      alphaFadeStartScale: 0.35,
      alphaFadeEndScale: 0.4,
      fontLabel: 'RobotoCondensed',
      sizeExLabel: sizeExpr08,
      fontGrid: 'TahomaB',
      sizeExGrid: 0.02,
      fontUnits: 'TahomaB',
      sizeExUnits: sizeExpr08,
      fontNames: 'RobotoCondensed',
      sizeExNames: '(((((safezoneW / safezoneH) min 1.2) / 1.2) / 25) * 0.8) * 2',
      fontInfo: 'RobotoCondensed',
      sizeExInfo: sizeExpr08,
      fontLevel: 'TahomaB',
      sizeExLevel: 0.02,
      moveOnEdges: 0,
      shadow: 0,
      widthRailWay: 4,
      ptsPerSquareSea: 5,
      ptsPerSquareTxt: 3,
      ptsPerSquareCLn: 10,
      ptsPerSquareExp: 10,
      ptsPerSquareCost: 10,
      ptsPerSquareFor: 9,
      ptsPerSquareForEdge: 9,
      ptsPerSquareRoad: 6,
      ptsPerSquareObj: 9,
      showCountourInterval: 0,
    },
  },

  {
    id: 'life_rsctoolbox',
    label: 'Life_RscToolbox',
    category: 'Advanced / Specialized',
    controlType: 6,
    parentClass: 'Life_RscToolbox',
    description: 'Row/column of toggle buttons (CT_TOOLBOX). Only one selectable at a time.',
    defaultProperties: {
      type: 6,
      style: 0,
      font: 'RobotoCondensed',
      sizeEx: sizeExpr08,
      colorText: [0.95, 0.95, 0.95, 1],
      colorTextSelect: [0.95, 0.95, 0.95, 1],
      colorSelect: [0.95, 0.95, 0.95, 1],
      colorTextDisable: [0.4, 0.4, 0.4, 1],
      colorDisable: [0.4, 0.4, 0.4, 1],
      colorSelectedBg: [0.3843, 0.7019, 0.8862, 0.5],
    },
  },

  // ===========================================================================
  // RJ Celular Framework Components
  // ===========================================================================

  {
    id: 'rj_rsccontrolsgroup',
    label: 'RJ_RscControlsGroup',
    category: 'Advanced / Specialized',
    controlType: 15,
    parentClass: 'RJ_RscControlsGroup',
    description: 'RJ Celular controls group with themed scrollbars.',
    defaultProperties: {
      type: 15,
      style: 16,
      shadow: 0,
      x: '0',
      y: '0',
      w: '20 * GUI_GRID_CENTER_W',
      h: '15 * GUI_GRID_CENTER_H',
      vScrollBar: {
        width: 0.011,
        autoScrollSpeed: -1,
        autoScrollDelay: 5,
        autoScrollRewind: 0,
        shadow: 0,
        color: [1, 1, 1, 0.5],
      },
      hScrollBar: {
        height: 0.018,
        shadow: 0,
        color: [1, 1, 1, 0.5],
      },
    },
  },

  {
    id: 'rj_celularbtn',
    label: 'RJ_CelularBtn',
    category: 'Buttons',
    controlType: 1,
    parentClass: 'RJ_CelularBtn',
    description: 'Blue-themed celular button with sound effects.',
    defaultProperties: {
      type: 1,
      style: 2,
      colorText: [1, 1, 1, 1],
      colorBackground: [0, 0.5, 1, 0.85],
      colorBackgroundActive: [0, 0.5, 0.8, 0.9],
      colorBackgroundDisabled: [0.2, 0.2, 0.2, 1],
      colorDisabled: [0.2, 0.2, 0.2, 1],
      colorFocused: [0.2, 0.2, 0.2, 1],
      colorBorder: [0, 0, 0, 0],
      colorShadow: [0, 0, 0, 0],
      font: 'PuristaMedium',
      borderSize: 0,
      offsetPressedX: 0.01,
      offsetPressedY: 0.01,
      offsetX: 0.01,
      offsetY: 0.01,
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
    },
  },

  {
    id: 'rj_celularbtninvisivel',
    label: 'RJ_CelularBtnInvisivel',
    category: 'Buttons',
    controlType: 1,
    parentClass: 'RJ_CelularBtnInvisivel',
    description: 'Fully transparent invisible button — clickable area with no visuals.',
    defaultProperties: {
      type: 1,
      style: 0,
      colorText: [0, 0, 0, 0],
      colorBackground: [0, 0, 0, 0],
      colorBackgroundActive: [0, 0, 0, 0],
      colorBackgroundDisabled: [0, 0, 0, 0],
      colorDisabled: [0, 0, 0, 0],
      colorFocused: [0, 0, 0, 0],
      colorBorder: [0, 0, 0, 0],
      colorShadow: [0, 0, 0, 0],
      font: 'PuristaMedium',
      borderSize: 0,
      offsetPressedX: 0.01,
      offsetPressedY: 0.01,
      offsetX: 0.01,
      offsetY: 0.01,
      sizeEx: sizeExpr,
      soundClick: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundClick', 0.09, 1],
      soundEnter: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEnter', 0.09, 1],
      soundEscape: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundEscape', 0.09, 1],
      soundPush: ['\\A3\\ui_f\\data\\sound\\RscButton\\soundPush', 0.09, 1],
    },
  },

  {
    id: 'rj_celularlistbox',
    label: 'RJ_CelularListBox',
    category: 'Lists & Selection',
    controlType: 5,
    parentClass: 'RJ_CelularListBox',
    description: 'Celular-themed listbox with custom colors and scrollbar.',
    defaultProperties: {
      type: 5,
      style: 16,
      font: 'PuristaMedium',
      colorPicture: [1, 1, 1, 1],
      colorPictureSelected: [1, 1, 1, 1],
      colorPictureDisabled: [1, 1, 1, 1],
      maxHistoryDelay: 0,
      soundSelect: ['\\A3\\ui_f\\data\\sound\\RscListbox\\soundSelect', 0.09, 1],
    },
  },

  {
    id: 'rj_celularcombobox',
    label: 'RJ_CelularComboBox',
    category: 'Lists & Selection',
    controlType: 4,
    parentClass: 'RJ_CelularComboBox',
    description: 'Celular-themed combo box with themed arrows and scrollbar.',
    defaultProperties: {
      type: 4,
      style: 16,
      font: 'PuristaMedium',
      colorText: [0.8706, 0.8863, 0.9725, 1],
      colorBackground: [0, 0.5, 1, 0.5],
      colorDisabled: [0.2, 0.2, 0.2, 1],
      colorSelect: [0, 0.5, 1, 1],
      colorSelectBackground: [0, 0, 0, 1],
      arrowEmpty: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscCombo\\arrow_combo_ca.paa',
      arrowFull: '\\A3\\ui_f\\data\\GUI\\RscCommon\\RscCombo\\arrow_combo_active_ca.paa',
      wholeHeight: 0.3,
      maxHistoryDelay: 0,
      soundCollapse: ['\\A3\\ui_f\\data\\sound\\RscCombo\\soundCollapse', 0.1, 1],
      soundExpand: ['\\A3\\ui_f\\data\\sound\\RscCombo\\soundExpand', 0.1, 1],
      soundSelect: ['\\A3\\ui_f\\data\\sound\\RscCombo\\soundSelect', 0.1, 1],
    },
  },

  {
    id: 'rj_celularfundo',
    label: 'RJ_CelularFundo',
    category: 'Visuals & Inputs',
    controlType: 0,
    parentClass: 'RJ_CelularFundo',
    description: 'Celular phone background picture (ST_PICTURE). Set texture path in `text`.',
    defaultProperties: {
      type: 0,
      style: 48,
      colorText: [1, 1, 1, 1],
      colorBackground: [1, 1, 1, 1],
      font: 'PuristaMedium',
      sizeEx: sizeExpr,
    },
  },
];

// =============================================================================
// Helpers
// =============================================================================

export function getPresetById(id: string): ComponentPreset | undefined {
  return COMPONENT_PRESETS.find(p => p.id === id);
}

export function getPresetsByCategory(): Record<string, ComponentPreset[]> {
  const map: Record<string, ComponentPreset[]> = {};
  for (const p of COMPONENT_PRESETS) {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  }
  return map;
}

export function getCategoryOrder(): ComponentCategory[] {
  return [
    'Checkboxes',
    'Scrollbars',
    'Control Groups',
    'HUD / Text',
    'Lists & Selection',
    'Buttons',
    'Visuals & Inputs',
    'Advanced / Specialized',
  ];
}
