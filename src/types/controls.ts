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

// String or number color array element (SQF expressions: "profilenamespace getvariable ['GUI_BCG_RGB_R',0.69]")
export type ColorElement = number | string;
export type ColorArray = [ColorElement, ColorElement, ColorElement, ColorElement];

// Sound entry: [file, volume, pitch]
export type SoundEntry = [string, number, number];

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

// Rectangle position
export interface RectPos {
  left: number | string;
  top: number | string;
  right: number | string;
  bottom: number | string;
  w?: number | string;
  h?: number | string;
}

// Structured Text / ShortcutButton attributes
export interface StructuredAttributes {
  font: string;
  color: string;
  align: string;
  shadow: number | string;
}

export interface ImageAttributes {
  font: string;
  color: string;
  align: string;
}

// Scrollbar sub-class configuration
export interface ScrollBarConfig {
  width?: number;
  height?: number;
  autoScrollEnabled?: number;
  autoScrollSpeed?: number;
  autoScrollDelay?: number;
  autoScrollRewind?: number;
  scrollSpeed?: number;
  color?: ColorRGBA;
  colorActive?: ColorRGBA;
  colorDisabled?: ColorRGBA;
  thumb?: string;
  arrowEmpty?: string;
  arrowFull?: string;
  border?: string;
  shadow?: number;
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
  sizeEx: number | string;
  font: string;
  colorText: ColorRGBA;
  colorBackground: ColorArray;
  colorDisabled?: ColorRGBA;
  colorBackgroundActive?: ColorArray;
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
  lineSpacing?: number;
  tileH?: number;
  tileW?: number;
  canDrag?: boolean;
  deletable?: 0 | 1;
  fade?: number;
  access?: AccessLevel;
  onLoad?: string;

  // === Checkbox properties (type 77) ===
  default?: number;
  blinkingPeriod?: number;
  textureChecked?: string;
  textureUnchecked?: string;
  textureFocusedChecked?: string;
  textureFocusedUnchecked?: string;
  textureHoverChecked?: string;
  textureHoverUnchecked?: string;
  texturePressedChecked?: string;
  texturePressedUnchecked?: string;
  textureDisabledChecked?: string;
  textureDisabledUnchecked?: string;

  // === Checkboxes (type 7) ===
  columns?: number;
  rows?: number;
  strings?: string[];
  checkedStrings?: string[];
  colorTextSelect?: ColorRGBA;
  colorSelectedBg?: ColorArray;
  colorSelect?: ColorRGBA;
  colorTextDisable?: ColorRGBA;
  colorDisable?: ColorRGBA;

  // === Shared hover/focused/pressed color states ===
  colorHover?: ColorRGBA;
  colorFocused?: ColorArray;
  colorPressed?: ColorRGBA;
  colorBackgroundHover?: ColorRGBA;
  colorBackgroundFocused?: ColorArray;
  colorBackgroundPressed?: ColorRGBA;
  colorBackgroundDisabled?: ColorRGBA;
  colorShadow?: ColorRGBA;
  colorBorder?: ColorRGBA;
  borderSize?: number;
  colorActive?: ColorRGBA;
  color2?: ColorRGBA;
  colorBackground2?: ColorRGBA;
  colorSelect2?: ColorRGBA;
  colorSelectBackground?: ColorRGBA;
  colorSelectBackground2?: ColorRGBA;
  colorScrollbar?: ColorRGBA;
  colorPicture?: ColorRGBA;
  colorPictureSelected?: ColorRGBA;
  colorPictureDisabled?: ColorRGBA;

  // === Image preview (canvas-only, not exported) ===
  imageDataUrl?: string;

  // === Property tracking for export inheritance ===
  explicitProperties?: string[];

  // === Sound properties ===
  soundEnter?: SoundEntry;
  soundPush?: SoundEntry;
  soundClick?: SoundEntry;
  soundEscape?: SoundEntry;
  soundSelect?: SoundEntry;
  soundExpand?: SoundEntry;
  soundCollapse?: SoundEntry;

  // === Button-specific (type 1) ===
  offsetX?: number;
  offsetY?: number;
  offsetPressedX?: number;
  offsetPressedY?: number;

  // === ShortcutButton-specific (type 16) ===
  animTextureNormal?: string;
  animTextureDisabled?: string;
  animTextureOver?: string;
  animTextureFocused?: string;
  animTexturePressed?: string;
  animTextureDefault?: string;
  period?: number;
  periodFocus?: number;
  periodOver?: number;
  action?: string;
  textureNoShortcut?: string;
  hitZone?: RectPos;
  shortcutPos?: RectPos;
  textPos?: RectPos;
  attributes?: StructuredAttributes;
  attributesImage?: ImageAttributes;

  // === ScrollBar properties ===
  scrollSpeed?: number;
  autoScrollEnabled?: number;
  vScrollBar?: ScrollBarConfig;
  hScrollBar?: ScrollBarConfig;

  // === ListBox / ListNBox / Combo specific (types 4, 5, 102) ===
  wholeHeight?: number;
  rowHeight?: number;
  maxHistoryDelay?: number;
  autoScrollSpeed?: number;
  autoScrollDelay?: number;
  autoScrollRewind?: number;

  // === Slider / XSlider specific (types 3, 43) ===
  arrowEmpty?: string;
  arrowFull?: string;
  border?: string;
  thumb?: string;

  // === Progress specific (type 8) ===
  texture?: string;
  colorFrame?: ColorRGBA;
  colorBar?: ColorArray;

  // === Edit specific (type 2) ===
  autocomplete?: boolean;
  colorSelection?: ColorArray;
  canModify?: number;

  // === Tree specific (type 12) ===
  expandedTexture?: string;
  hiddenTexture?: string;

  // === ActiveText specific (type 11) ===

  // === StructuredText specific (type 13) ===
  size?: number | string;
  structuredAttributes?: StructuredAttributes;

  // === HTML specific (type 9) ===
  colorBold?: ColorRGBA;
  colorLink?: ColorRGBA;
  colorLinkActive?: ColorRGBA;
  prevPage?: string;
  nextPage?: string;

  // === HitZones specific ===
  xCount?: number;
  yCount?: number;
  xSpace?: number;
  ySpace?: number;

  // === MapControl specific (type 101) ===
  colorOutside?: ColorRGBA;
  colorSea?: ColorRGBA;
  colorForest?: ColorRGBA;
  colorRocks?: ColorRGBA;
  colorCountlines?: ColorRGBA;
  colorMainCountlines?: ColorRGBA;
  colorCountlinesWater?: ColorRGBA;
  colorMainCountlinesWater?: ColorRGBA;
  colorForestBorder?: ColorRGBA;
  colorRocksBorder?: ColorRGBA;
  colorPowerLines?: ColorRGBA;
  colorRailWay?: ColorRGBA;
  colorNames?: ColorRGBA;
  colorInactive?: ColorRGBA;
  colorLevels?: ColorRGBA;
  colorTracks?: ColorRGBA;
  colorRoads?: ColorRGBA;
  colorMainRoads?: ColorRGBA;
  colorTracksFill?: ColorRGBA;
  colorRoadsFill?: ColorRGBA;
  colorMainRoadsFill?: ColorRGBA;
  colorGrid?: ColorRGBA;
  colorGridMap?: ColorRGBA;
  scaleMin?: number;
  scaleMax?: number;
  scaleDefault?: number;
  maxSatelliteAlpha?: number;
  alphaFadeStartScale?: number;
  alphaFadeEndScale?: number;
  fontLabel?: string;
  sizeExLabel?: number | string;
  fontGrid?: string;
  sizeExGrid?: number;
  fontUnits?: string;
  sizeExUnits?: number | string;
  fontNames?: string;
  sizeExNames?: number | string;
  fontInfo?: string;
  sizeExInfo?: number | string;
  fontLevel?: string;
  sizeExLevel?: number;
  moveOnEdges?: number;
  widthRailWay?: number;
  stickX?: [number, { [key: string]: number }];
  stickY?: [number, { [key: string]: number }];
  ptsPerSquareSea?: number;
  ptsPerSquareTxt?: number;
  ptsPerSquareCLn?: number;
  ptsPerSquareExp?: number;
  ptsPerSquareCost?: number;
  ptsPerSquareFor?: number;
  ptsPerSquareForEdge?: number;
  ptsPerSquareRoad?: number;
  ptsPerSquareObj?: number;
  showCountourInterval?: number;

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
// Alignment & Smart Snapping
// =============================================================================

export type ResizeDir = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export interface AlignmentGuide {
  id: string;
  type: 'vertical' | 'horizontal';
  position: number;
  start: number;
  end: number;
  source: 'edge' | 'center' | 'canvas-edge' | 'canvas-center' | 'safezone-edge';
  label?: string;
}

export interface ComponentRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  right: number;
  bottom: number;
}

export interface GroupResizeSnapshot {
  id: string;
  pixelX: number;
  pixelY: number;
  pixelW: number;
  pixelH: number;
  exprX: string | number;
  exprY: string | number;
  exprW: string | number;
  exprH: string | number;
}

export interface GroupResizeState {
  dir: ResizeDir;
  startBBox: { x: number; y: number; w: number; h: number };
  snapshots: GroupResizeSnapshot[];
  offsetX: number;
  offsetY: number;
  canvasW: number;
  canvasH: number;
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
