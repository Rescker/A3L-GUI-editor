// =============================================================================
// Arma 3 GUI Editor — Core TypeScript Types
// =============================================================================

export type UIContainerType = 'dialog' | 'display' | 'hud';

export type GridSystem = 'absolute' | 'safezone' | 'gui_grid' | 'pixel_grid';

export type ControlZone = 'controlsBackground' | 'controls' | 'objects';

// All control types as per Arma 3 RV engine
export type ControlType =
  | 0   // CT_STATIC
  | 1   // CT_BUTTON
  | 2   // CT_EDIT
  | 3   // CT_SLIDER
  | 4   // CT_COMBO
  | 5   // CT_LISTBOX
  | 6   // CT_TOOLBOX
  | 7   // CT_CHECKBOXES
  | 8   // CT_PROGRESS
  | 9   // CT_HTML
  | 11  // CT_ACTIVETEXT
  | 12  // CT_TREE
  | 13  // CT_STRUCTURED_TEXT
  | 14  // CT_CONTEXT_MENU
  | 15  // CT_CONTROLS_GROUP
  | 16  // CT_SHORTCUTBUTTON
  | 41  // CT_XBUTTON
  | 43  // CT_XSLIDER
  | 44  // CT_XCOMBO
  | 45  // CT_XLISTBOX
  | 77  // CT_CHECKBOX
  | 80  // CT_OBJECT
  | 81  // CT_OBJECT_ZOOM
  | 82  // CT_OBJECT_CONTAINER
  | 83  // CT_OBJECT_CONT_ANIM
  | 100 // CT_MAP
  | 101 // CT_MAP_MAIN
  | 102 // CT_LISTNBOX
  | 104; // CT_MAP_ALT

export type ShadowType = 0 | 1 | 2;
export type OverlayMode = 0 | 1 | 2;
export type AccessLevel = 0 | 1 | 2 | 3;

export type ColorRGBA = [number, number, number, number];

// =============================================================================
// Event Handler Definitions
// =============================================================================

export type EventApplicable = 'display' | 'control' | 'button' | 'listbox' | 'tree' | 'checkbox' | 'combo' | 'slider' | 'misc';

export interface UIEHDefinition {
  name: string;
  scriptName: string;        // without "on" prefix for ctrlAddEventHandler
  applicableTo: EventApplicable[];
  paramSignature: string;
  description: string;
  returnDescription?: string;
  example?: string;
}

// =============================================================================
// Control Configuration
// =============================================================================

export interface EventHandlerConfig {
  id: string;
  event: string;
  code: string;
}

export interface ControlConfig {
  id: string;                 // internal UUID for React keys
  className: string;          // Config class name, e.g. "RscButton_1600"
  idc: number;
  type: ControlType;
  style: number;              // bitwise OR of style flags
  x: string | number;
  y: string | number;
  w: string | number;
  h: string | number;
  sizeEx: number;
  font: string;
  colorText: ColorRGBA;
  colorBackground: ColorRGBA;
  colorDisabled?: ColorRGBA;
  colorBackgroundActive?: ColorRGBA;
  text: string;
  shadow: ShadowType;
  tooltip: string;
  tooltipColorText?: ColorRGBA;
  tooltipColorBox?: ColorRGBA;
  tooltipColorShade?: ColorRGBA;
  moving: boolean;
  url?: string;
  overlayMode?: OverlayMode;
  parentClass: string;        // inheritance: e.g. "RscText", "RscButton"
  eventHandlers: EventHandlerConfig[];
  children?: ControlConfig[]; // for CT_CONTROLS_GROUP (type=15)
  // Type-specific optional fields:
  lineSpacing?: number;
  tileH?: number;
  tileW?: number;
  canDrag?: boolean;
  deletable?: 0 | 1;
  fade?: number;
  access?: AccessLevel;
  onLoad?: string;
}

// =============================================================================
// Dialog / Display / HUD Container Configuration
// =============================================================================

export interface DialogConfig {
  id: string;
  className: string;
  containerType: UIContainerType;
  idd: number;
  movingEnable: boolean;
  enableSimulation: boolean;
  onLoad: string;
  onUnload: string;
  controlsBackground: ControlConfig[];
  controls: ControlConfig[];
  objects: ControlConfig[];
  // HUD-only properties
  fadeIn?: number;
  fadeOut?: number;
  duration?: number;
  // Display-level event handlers
  eventHandlers: EventHandlerConfig[];
}

// =============================================================================
// Grid Variants
// =============================================================================

export interface GridVariant {
  name: string;
  label: string;
  xExpr: string;
  yExpr: string;
  wExpr: string;
  hExpr: string;
}

// =============================================================================
// Validation
// =============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  dialogId?: string;
  controlId?: string;
}

// =============================================================================
// Editor Store State
// =============================================================================

export interface EditorState {
  // Project data
  dialogs: DialogConfig[];
  activeDialogId: string | null;

  // Selection & interaction
  selectedControlIds: string[];
  hoveredControlId: string | null;
  editingControlId: string | null;      // double-clicked group, editing children
  draggingControlId: string | null;

  // Canvas settings
  gridSystem: GridSystem;
  gridVariant: string;
  showGrid: boolean;
  snapToGrid: boolean;
  previewResolution: { w: number; h: number };
  previewUIScale: string;
  zoomLevel: number;

  // Cursor info
  cursorGridX: string;
  cursorGridY: string;

  // Modals
  importModalOpen: boolean;
  exportModalOpen: boolean;
  uiehPickerOpen: boolean;
  exportFormat: 'class' | 'full_dialog' | 'hud' | 'editor_format';

  // Validation
  validationIssues: ValidationIssue[];
}

// =============================================================================
// Config Generator Options
// =============================================================================

export interface GeneratorOptions {
  format: 'class' | 'full_dialog' | 'hud' | 'editor_format';
  gridSystem: GridSystem;
  gridVariant: string;
  indentSize: 2 | 4;
  useInheritance: boolean;
  emitIncludes: boolean;
  usePreprocessorColors: boolean;
  exportZone: 'background' | 'controls' | 'objects' | 'all';
  tabCount: number;
}

// =============================================================================
// Control Type Metadata
// =============================================================================

export interface ControlTypeInfo {
  type: ControlType;
  constantName: string;
  label: string;
  description: string;
  category: 'static' | 'interactive' | 'container' | 'special' | 'xbox';
  defaultSize: { w: number; h: number };
  defaultParent: string;
}

// =============================================================================
// Style Flag Info
// =============================================================================

export interface StyleFlagInfo {
  flag: number;
  name: string;
  constant: string;
  description: string;
  // Which control types this style is applicable to
  applicableTo: 'all' | ControlType[];
}
