// =============================================================================
// Zustand Editor Store — Global application state
// Handles all editor operations: CRUD for dialogs/controls, selection,
// grid/resolution settings, import/export actions.
// =============================================================================

import { create } from 'zustand';
import type {
  DialogConfig,
  ControlConfig,
  UIContainerType,
  ControlType,
  GridSystem,
  ControlZone,
  ValidationIssue,
  AlignmentGuide,
} from '../types/controls';
import { CONTROL_TYPES } from '../data/controlDefaults';
import { COMPONENT_PRESETS, getPresetById } from '../data/componentLibrary';
import { validateAll } from '../utils/validation';
import { generateDialogConfig } from '../utils/configGenerator';
import { importConfig } from '../utils/configParser';
import { serializeProject, deserializeProject } from '../utils/projectSerializer';

// =============================================================================
// Helpers
// =============================================================================

let idCounter = 0;
function uid(): string {
  return `ctrl_${Date.now()}_${++idCounter}`;
}

function nextIdc(): number {
  return 1600 + idCounter;
}

function createDefaultControl(type: ControlType): ControlConfig {
  const info = CONTROL_TYPES.find(ct => ct.type === type);
  return {
    id: uid(),
    className: `Control_${1600 + idCounter}`,
    idc: 1600 + idCounter,
    type,
    style: 0,
    x: 0.25,
    y: 0.25,
    w: 0.5,
    h: 0.5,
    sizeEx: 4,
    font: 'RobotoCondensed',
    colorText: [1, 1, 1, 1],
    colorBackground: [0, 0, 0, 0],
    text: info?.label ?? 'Control',
    shadow: 0,
    tooltip: '',
    moving: false,
    parentClass: info?.defaultParent ?? 'RscText',
    eventHandlers: [],
  };
}

function createControlFromPreset(presetId: string): ControlConfig | null {
  const preset = getPresetById(presetId);
  if (!preset) return null;
  const info = CONTROL_TYPES.find(ct => ct.type === preset.controlType);
  const base: ControlConfig = {
    id: uid(),
    className: `${preset.label}_${1600 + idCounter}`,
    idc: 1600 + idCounter,
    type: preset.controlType,
    style: 0,
    x: 0.25,
    y: 0.25,
    w: 0.5,
    h: 0.5,
    sizeEx: 4,
    font: 'RobotoCondensed',
    colorText: [1, 1, 1, 1],
    colorBackground: [0, 0, 0, 0],
    text: preset.label,
    shadow: 0,
    tooltip: '',
    moving: false,
    parentClass: preset.parentClass,
    eventHandlers: [],
  };
  // Merge preset defaults, then override identity fields
  const merged = { ...base, ...preset.defaultProperties };
  merged.id = uid();
  merged.className = `${preset.label}_${1600 + idCounter}`;
  merged.idc = 1600 + idCounter;
  merged.type = preset.controlType;
  merged.parentClass = preset.parentClass;
  merged.eventHandlers = [];
  return merged;
}

function createDefaultDialog(type: UIContainerType): DialogConfig {
  return {
    id: uid(),
    className: type === 'hud' ? 'HUD_Name' : type === 'display' ? 'DisplayName' : 'DialogName',
    containerType: type,
    idd: -1,
    movingEnable: true,
    enableSimulation: type === 'dialog' ? false : true,
    onLoad: '',
    onUnload: '',
    controlsBackground: [],
    controls: [],
    objects: [],
    eventHandlers: [],
    ...(type === 'hud' ? { fadeIn: 0, fadeOut: 0, duration: 1e11 } : {}),
  };
}

function findControl(dialog: DialogConfig, controlId: string): { zone: ControlZone; control: ControlConfig; parent?: ControlConfig } | null {
  for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
    const controls = dialog[zone];
    for (const ctrl of controls) {
      if (ctrl.id === controlId) return { zone, control: ctrl };
      if (ctrl.children) {
        const found = findInChildren(ctrl.children, controlId);
        if (found) return { zone, control: found, parent: ctrl };
      }
    }
  }
  return null;
}

function findInChildren(children: ControlConfig[], controlId: string): ControlConfig | null {
  for (const ctrl of children) {
    if (ctrl.id === controlId) return ctrl;
    if (ctrl.children) {
      const found = findInChildren(ctrl.children, controlId);
      if (found) return found;
    }
  }
  return null;
}

function updateControlInDialog(dialog: DialogConfig, controlId: string, patch: Partial<ControlConfig>): DialogConfig {
  const newDialog = { ...dialog };
  for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
    const idx = newDialog[zone].findIndex(c => c.id === controlId);
    if (idx >= 0) {
      const updated = [...newDialog[zone]];
      const existing = updated[idx];
      const merged = { ...existing, ...patch };
      if (existing.parentClass) {
        const newKeys = Object.keys(patch);
        const prev = existing.explicitProperties ?? [];
        const next = [...new Set([...prev, ...newKeys])];
        merged.explicitProperties = next;
      }
      updated[idx] = merged;
      newDialog[zone] = updated;
      return newDialog;
    }
    // Check children
    const newControls = updateInControls(newDialog[zone], controlId, patch);
    if (newControls) {
      newDialog[zone] = newControls;
      return newDialog;
    }
  }
  return dialog;
}

function updateInControls(controls: ControlConfig[], controlId: string, patch: Partial<ControlConfig>): ControlConfig[] | null {
  const result = [...controls];
  for (let i = 0; i < result.length; i++) {
    if (result[i].id === controlId) {
      result[i] = { ...result[i], ...patch };
      return result;
    }
    if (result[i].children) {
      const updated = updateInControls(result[i].children!, controlId, patch);
      if (updated) {
        result[i] = { ...result[i], children: updated };
        return result;
      }
    }
  }
  return null;
}

function removeFromControls(controls: ControlConfig[], controlId: string): ControlConfig[] | null {
  const idx = controls.findIndex(c => c.id === controlId);
  if (idx >= 0) {
    const result = [...controls];
    result.splice(idx, 1);
    return result;
  }
  for (let i = 0; i < controls.length; i++) {
    if (controls[i].children) {
      const updated = removeFromControls(controls[i].children!, controlId);
      if (updated) {
        const result = [...controls];
        result[i] = { ...result[i], children: updated };
        return result;
      }
    }
  }
  return null;
}

// =============================================================================
// History (Undo/Redo) helpers
// =============================================================================

const MAX_HISTORY = 50;
let _lastHistoryPush = 0;
const _historyCoalesceMs = 200;

function pushHistory(state: { history: DialogConfig[][]; historyIndex: number }, currentDialogs: DialogConfig[], newDialogs: DialogConfig[]) {
  const now = Date.now();
  const history = [...state.history];

  if (history.length === 0) {
    history.push(structuredClone(currentDialogs));
  }

  if (history.length > 0 && now - _lastHistoryPush < _historyCoalesceMs) {
    history[history.length - 1] = structuredClone(newDialogs);
  } else {
    history.length = state.historyIndex + 1;
    history.push(structuredClone(newDialogs));
    if (history.length > MAX_HISTORY) history.shift();
  }

  _lastHistoryPush = now;
  return { history, historyIndex: history.length - 1 };
}

// =============================================================================
// Store Interface
// =============================================================================

interface EditorStore {
  dialogs: DialogConfig[];
  activeDialogId: string | null;
  selectedControlIds: string[];
  hoveredControlId: string | null;
  editingControlId: string | null;
  gridSystem: GridSystem;
  gridVariant: string;
  showGrid: boolean;
  snapToGrid: boolean;
  previewResolution: { w: number; h: number };
  previewUIScale: string;
  zoomLevel: number;
  canvasPanX: number;
  canvasPanY: number;
  canvasFitRequestId: number;
  isCanvasFullscreen: boolean;
  fullscreenIntent: boolean;
  cursorGridX: string;
  cursorGridY: string;
  importModalOpen: boolean;
  exportModalOpen: boolean;
  exportSelectedOnly: boolean;
  uiehPickerOpen: boolean;
  componentLibraryOpen: boolean;
  exportFormat: 'class' | 'full_dialog' | 'hud' | 'editor_format';
  validationIssues: ValidationIssue[];
  history: DialogConfig[][];
  historyIndex: number;
  showAlignmentGuides: boolean;
  snapToAlignment: boolean;
  alignmentGuides: AlignmentGuide[];
  clipboard: ControlConfig[];
  clipboardSourceZone: ControlZone | null;

  // Actions
  addDialog: (type: UIContainerType) => void;
  removeDialog: (id: string) => void;
  setActiveDialog: (id: string) => void;
  addControl: (dialogId: string, type: ControlType, zone: ControlZone) => void;
  addControlFromPreset: (dialogId: string, presetId: string, zone: ControlZone) => void;
  addControlFromTemplate: (dialogId: string, control: ControlConfig, zone: ControlZone) => void;
  updateControl: (dialogId: string, controlId: string, patch: Partial<ControlConfig>) => void;
  removeControl: (dialogId: string, controlId: string) => void;
  moveControl: (dialogId: string, controlId: string, x: number | string, y: number | string) => void;
  resizeControl: (dialogId: string, controlId: string, w: number | string, h: number | string) => void;
  moveMultipleControls: (dialogId: string, updates: { id: string; x: number | string; y: number | string }[]) => void;
  reparentControl: (controlId: string, targetGroupId: string | null) => void;
  toggleStyleFlag: (dialogId: string, controlId: string, flag: number) => void;
  selectControl: (controlId: string, multi?: boolean) => void;
  clearSelection: () => void;
  setGridSystem: (grid: GridSystem) => void;
  setGridVariant: (variant: string) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setPreviewResolution: (res: { w: number; h: number }) => void;
  setPreviewUIScale: (scale: string) => void;
  setZoomLevel: (zoom: number) => void;
  setCanvasPan: (x: number, y: number) => void;
  setCanvasView: (zoom: number, x: number, y: number) => void;
  requestCanvasFit: () => void;
  setCanvasFullscreen: (isFullscreen: boolean) => void;
  setFullscreenIntent: (intent: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setExportSelectedOnly: (value: boolean) => void;
  setUiehPickerOpen: (open: boolean) => void;
  setComponentLibraryOpen: (open: boolean) => void;
  setExportFormat: (format: 'class' | 'full_dialog' | 'hud' | 'editor_format') => void;
  importData: (raw: string) => void;
  exportData: (dialogId: string, format?: 'class' | 'full_dialog' | 'hud' | 'editor_format') => string;
  exportSelectedControls: (dialogId: string, format?: 'class' | 'full_dialog' | 'hud' | 'editor_format') => string;
  setCursorGridPos: (x: string, y: string) => void;
  runValidation: () => void;
  undo: () => void;
  redo: () => void;
  resizeMultipleControls: (dialogId: string, updates: { id: string; x: number | string; y: number | string; w: number | string; h: number | string }[]) => void;
  setShowAlignmentGuides: (show: boolean) => void;
  setSnapToAlignment: (snap: boolean) => void;
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  moveControlUp: (dialogId: string, controlId: string) => void;
  moveControlDown: (dialogId: string, controlId: string) => void;
  swapControlOrder: (dialogId: string, controlIdA: string, controlIdB: string) => void;
  exportProject: () => string;
  importProject: (json: string) => boolean;
  copyControls: (controls: ControlConfig[], sourceZone: ControlZone) => void;
  clearClipboard: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useEditorStore = create<EditorStore>((set, get) => ({
  dialogs: [],
  activeDialogId: null,
  selectedControlIds: [],
  hoveredControlId: null,
  editingControlId: null,
  gridSystem: 'gui_grid',
  gridVariant: 'GUI_GRID_CENTER',
  showGrid: true,
  snapToGrid: true,
  previewResolution: { w: 1920, h: 1080 },
  previewUIScale: 'normal',
  zoomLevel: 0.5,
  canvasPanX: 0,
  canvasPanY: 0,
  canvasFitRequestId: 0,
  isCanvasFullscreen: false,
  fullscreenIntent: false,
  cursorGridX: '0',
  cursorGridY: '0',
  importModalOpen: false,
  exportModalOpen: false,
  exportSelectedOnly: false,
  uiehPickerOpen: false,
  componentLibraryOpen: false,
  exportFormat: 'full_dialog',
  validationIssues: [],
  history: [],
  historyIndex: -1,
  showAlignmentGuides: true,
  snapToAlignment: true,
  alignmentGuides: [],
  clipboard: [],
  clipboardSourceZone: null,

  // === Dialog Actions ===

  addDialog: (type) => {
    const dialog = createDefaultDialog(type);
    set(state => {
      const newDialogs = [...state.dialogs, dialog];
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        activeDialogId: dialog.id,
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  removeDialog: (id) => {
    set(state => {
      const newDialogs = state.dialogs.filter(d => d.id !== id);
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        activeDialogId: state.activeDialogId === id ? (newDialogs[0]?.id ?? null) : state.activeDialogId,
        selectedControlIds: [],
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  setActiveDialog: (id) => {
    set({ activeDialogId: id, selectedControlIds: [], editingControlId: null });
  },

  // === Control CRUD ===

  addControl: (dialogId, type, zone) => {
    set(state => {
      const control = createDefaultControl(type);
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        const updated = { ...d };
        updated[zone] = [...d[zone], control];
        return updated;
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        selectedControlIds: [control.id],
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  addControlFromPreset: (dialogId, presetId, zone) => {
    set(state => {
      const control = createControlFromPreset(presetId);
      if (!control) return state;
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        const updated = { ...d };
        updated[zone] = [...d[zone], control];
        return updated;
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        selectedControlIds: [control.id],
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  addControlFromTemplate: (dialogId, control, zone) => {
    set(state => {
      // Generate new unique identifiers
      const clone = structuredClone(control);
      clone.id = uid();
      clone.idc = nextIdc();
      clone.className = `${control.className}_copy`;
      // Clear children unless it's a controls group (type 15)
      if (clone.type !== 15) {
        clone.children = undefined;
      }
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        const updated = { ...d };
        updated[zone] = [...d[zone], clone];
        return updated;
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        selectedControlIds: [clone.id],
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  updateControl: (dialogId, controlId, patch) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return updateControlInDialog(d, controlId, patch);
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  removeControl: (dialogId, controlId) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        const updated = { ...d };
        for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
          const removed = removeFromControls(updated[zone], controlId);
          if (removed) {
            updated[zone] = removed;
            return updated;
          }
        }
        return updated;
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return {
        ...hist,
        dialogs: newDialogs,
        selectedControlIds: state.selectedControlIds.filter(id => id !== controlId),
        validationIssues: validateAll(newDialogs),
      };
    });
  },

  moveControl: (dialogId, controlId, x, y) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return updateControlInDialog(d, controlId, { x, y });
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  resizeControl: (dialogId, controlId, w, h) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return updateControlInDialog(d, controlId, { w, h });
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  moveMultipleControls: (dialogId, updates) => {
    set(state => {
      let newDialogs = state.dialogs;
      for (const { id, x, y } of updates) {
        newDialogs = newDialogs.map(d => {
          if (d.id !== dialogId) return d;
          return updateControlInDialog(d, id, { x, y });
        });
      }
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  reparentControl: (controlId, targetGroupId) => {
    set(state => {
      const dialog = state.dialogs.find(d => d.id === state.activeDialogId);
      if (!dialog) return state;

      let sourceControl: ControlConfig | null = null;
      let sourceZone: ControlZone | null = null;

      // Find and extract control
      for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
        const idx = dialog[zone].findIndex(c => c.id === controlId);
        if (idx >= 0) {
          sourceControl = dialog[zone][idx];
          sourceZone = zone;
          break;
        }
        // Check in children
        for (const ctrl of dialog[zone]) {
          if (ctrl.children) {
            const childIdx = ctrl.children.findIndex(c => c.id === controlId);
            if (childIdx >= 0) {
              sourceControl = ctrl.children[childIdx];
              sourceZone = zone;
              break;
            }
          }
        }
      }

      if (!sourceControl) return state;

      let newDialogs = state.dialogs.map(d => {
        if (d.id !== state.activeDialogId) return d;
        // Remove from source
        const updated = { ...d };
        for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
          const removed = removeFromControls(updated[zone], controlId);
          if (removed) {
            updated[zone] = removed;
            break;
          }
        }
        return updated;
      });

      // Add to target
      newDialogs = newDialogs.map(d => {
        if (d.id !== state.activeDialogId) return d;
        const updated = { ...d };
        if (targetGroupId) {
          // Add as child of group
          const newControls = addToGroup(updated.controls, targetGroupId, sourceControl!);
          if (!newControls) {
            // Try other zones
            const bg = addToGroup(updated.controlsBackground, targetGroupId, sourceControl!);
            if (bg) updated.controlsBackground = bg;
          } else {
            updated.controls = newControls;
          }
        } else {
          // Add to controls as top-level
          updated.controls = [...updated.controls, { ...sourceControl!, children: undefined }];
        }
        return updated;
      });

      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  toggleStyleFlag: (dialogId, controlId, flag) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        const updated = updateControlInDialog(d, controlId, {});
        const found = findControl(updated, controlId);
        if (found) {
          const newStyle = (found.control.style & flag) === flag
            ? found.control.style & ~flag
            : found.control.style | flag;
          return updateControlInDialog(d, controlId, { style: newStyle });
        }
        return d;
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs, validationIssues: validateAll(newDialogs) };
    });
  },

  // === Selection ===

  selectControl: (controlId, multi = false) => {
    set(state => {
      if (multi) {
        const exists = state.selectedControlIds.includes(controlId);
        return {
          selectedControlIds: exists
            ? state.selectedControlIds.filter(id => id !== controlId)
            : [...state.selectedControlIds, controlId],
        };
      }
      return { selectedControlIds: [controlId] };
    });
  },

  clearSelection: () => set({ selectedControlIds: [] }),

  // === Settings ===

  setGridSystem: (grid) => set({ gridSystem: grid }),
  setGridVariant: (variant) => set({ gridVariant: variant }),
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),
  setPreviewResolution: (res) => set({ previewResolution: res }),
  setPreviewUIScale: (scale) => set({ previewUIScale: scale }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setCanvasPan: (x, y) => set({ canvasPanX: x, canvasPanY: y }),
  setCanvasView: (zoom, x, y) => set({ zoomLevel: zoom, canvasPanX: x, canvasPanY: y }),
  requestCanvasFit: () => set(state => ({ canvasFitRequestId: state.canvasFitRequestId + 1 })),
  setCanvasFullscreen: (isFullscreen) => set({ isCanvasFullscreen: isFullscreen }),
  setFullscreenIntent: (intent) => set({ fullscreenIntent: intent }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setExportSelectedOnly: (value) => set({ exportSelectedOnly: value }),
  setUiehPickerOpen: (open) => set({ uiehPickerOpen: open }),
  setComponentLibraryOpen: (open) => set({ componentLibraryOpen: open }),
  setExportFormat: (format) => set({ exportFormat: format }),

  // === Import/Export ===

  importData: (raw) => {
    const parsed = importConfig(raw);
    if (parsed) {
      const dialog: DialogConfig = {
        id: parsed.id ?? uid(),
        className: parsed.className ?? 'ImportedDialog',
        containerType: parsed.containerType ?? 'dialog',
        idd: parsed.idd ?? -1,
        movingEnable: parsed.movingEnable ?? true,
        enableSimulation: parsed.enableSimulation ?? false,
        onLoad: parsed.onLoad ?? '',
        onUnload: parsed.onUnload ?? '',
        controlsBackground: parsed.controlsBackground ?? [],
        controls: parsed.controls ?? [],
        objects: parsed.objects ?? [],
        eventHandlers: parsed.eventHandlers ?? [],
        fadeIn: parsed.fadeIn,
        fadeOut: parsed.fadeOut,
        duration: parsed.duration,
      };
      // Auto-detect coordinate system: if all x/w values are 0..1 and y/h are 0..1,
      // the config uses absolute coordinates
      const allControls = [...dialog.controlsBackground, ...dialog.controls, ...dialog.objects];
      const useAbsolute = allControls.length > 0 && allControls.every(c =>
        isFloatInRange(c.x, 0, 1) && isFloatInRange(c.y, 0, 1) &&
        isFloatInRange(c.w, 0, 1) && isFloatInRange(c.h, 0, 1)
      );
      set(state => {
        const newDialogs = [...state.dialogs, dialog];
        const hist = pushHistory(state, state.dialogs, newDialogs);
        return {
          ...hist,
          dialogs: newDialogs,
          activeDialogId: dialog.id,
          importModalOpen: false,
          gridSystem: useAbsolute ? 'absolute' : state.gridSystem,
          validationIssues: validateAll(newDialogs),
        };
      });
    }
  },

  exportData: (dialogId, format) => {
    const state = get();
    const dialog = state.dialogs.find(d => d.id === dialogId);
    if (!dialog) return '';

    return generateDialogConfig(dialog, {
      format: format ?? state.exportFormat,
      gridSystem: state.gridSystem,
      gridVariant: state.gridVariant,
      indentSize: 2,
      useInheritance: true,
      emitIncludes: true,
      usePreprocessorColors: false,
      exportZone: 'all',
      tabCount: 1,
    });
  },

  exportSelectedControls: (dialogId, format) => {
    const state = get();
    const dialog = state.dialogs.find(d => d.id === dialogId);
    if (!dialog) return '';

    const selectedIds = state.selectedControlIds;
    if (selectedIds.length === 0) return '';

    return generateDialogConfig(dialog, {
      format: format ?? state.exportFormat,
      gridSystem: state.gridSystem,
      gridVariant: state.gridVariant,
      indentSize: 2,
      useInheritance: true,
      emitIncludes: true,
      usePreprocessorColors: false,
      exportZone: 'all',
      selectedControlIds: selectedIds,
      tabCount: 1,
    });
  },

  moveControlUp: (dialogId, controlId) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return reorderInDialog(d, controlId, -1);
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  moveControlDown: (dialogId, controlId) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return reorderInDialog(d, controlId, 1);
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  swapControlOrder: (dialogId, controlIdA, controlIdB) => {
    set(state => {
      const newDialogs = state.dialogs.map(d => {
        if (d.id !== dialogId) return d;
        return swapInDialog(d, controlIdA, controlIdB);
      });
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  exportProject: () => {
    const state = get();
    const project = serializeProject(state.dialogs, {
      gridSystem: state.gridSystem,
      gridVariant: state.gridVariant,
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid,
      previewResolution: state.previewResolution,
      previewUIScale: state.previewUIScale,
      zoomLevel: state.zoomLevel,
      showAlignmentGuides: state.showAlignmentGuides,
      snapToAlignment: state.snapToAlignment,
      exportFormat: state.exportFormat,
    });
    return JSON.stringify(project, null, 2);
  },

  importProject: (json) => {
    const project = deserializeProject(json);
    if (!project) return false;

    set({
      dialogs: project.dialogs,
      gridSystem: project.editorSettings.gridSystem,
      gridVariant: project.editorSettings.gridVariant,
      showGrid: project.editorSettings.showGrid,
      snapToGrid: project.editorSettings.snapToGrid,
      previewResolution: project.editorSettings.previewResolution,
      previewUIScale: project.editorSettings.previewUIScale,
      zoomLevel: project.editorSettings.zoomLevel,
      showAlignmentGuides: project.editorSettings.showAlignmentGuides,
      snapToAlignment: project.editorSettings.snapToAlignment,
      exportFormat: project.editorSettings.exportFormat as 'class' | 'full_dialog' | 'hud' | 'editor_format',
      activeDialogId: project.dialogs[0]?.id ?? null,
      selectedControlIds: [],
      editingControlId: null,
      history: [structuredClone(project.dialogs)],
      historyIndex: 0,
      validationIssues: validateAll(project.dialogs),
    });
    return true;
  },

  copyControls: (controls, sourceZone) => {
    set({ clipboard: structuredClone(controls), clipboardSourceZone: sourceZone });
  },

  clearClipboard: () => {
    set({ clipboard: [], clipboardSourceZone: null });
  },

  setCursorGridPos: (x, y) => set({ cursorGridX: x, cursorGridY: y }),
  runValidation: () => {
    set(state => ({ validationIssues: validateAll(state.dialogs) }));
  },

  resizeMultipleControls: (dialogId, updates) => {
    set(state => {
      let newDialogs = state.dialogs;
      for (const { id, x, y, w, h } of updates) {
        newDialogs = newDialogs.map(d => {
          if (d.id !== dialogId) return d;
          return updateControlInDialog(d, id, { x, y, w, h });
        });
      }
      const hist = pushHistory(state, state.dialogs, newDialogs);
      return { ...hist, dialogs: newDialogs };
    });
  },

  setShowAlignmentGuides: (show) => set({ showAlignmentGuides: show }),
  setSnapToAlignment: (snap) => set({ snapToAlignment: snap }),
  setAlignmentGuides: (guides) => set({ alignmentGuides: guides }),

  undo: () => {
    set(state => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        dialogs: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
        selectedControlIds: [],
        validationIssues: validateAll(state.history[newIndex]),
      };
    });
  },

  redo: () => {
    set(state => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        dialogs: structuredClone(state.history[newIndex]),
        historyIndex: newIndex,
        selectedControlIds: [],
        validationIssues: validateAll(state.history[newIndex]),
      };
    });
  },
}));

// =============================================================================
// Helper functions
// =============================================================================

function reorderInDialog(dialog: DialogConfig, controlId: string, direction: -1 | 1): DialogConfig {
  const updated = { ...dialog };
  for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
    const idx = updated[zone].findIndex(c => c.id === controlId);
    if (idx >= 0) {
      const targetIdx = idx + direction;
      if (targetIdx >= 0 && targetIdx < updated[zone].length) {
        const newArr = [...updated[zone]];
        [newArr[idx], newArr[targetIdx]] = [newArr[targetIdx], newArr[idx]];
        updated[zone] = newArr;
        return updated;
      }
      return dialog;
    }
    const result = reorderInControls(updated[zone], controlId, direction);
    if (result) {
      updated[zone] = result;
      return updated;
    }
  }
  return dialog;
}

function reorderInControls(controls: ControlConfig[], controlId: string, direction: -1 | 1): ControlConfig[] | null {
  const arr = [...controls];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === controlId) {
      const targetIdx = i + direction;
      if (targetIdx >= 0 && targetIdx < arr.length) {
        [arr[i], arr[targetIdx]] = [arr[targetIdx], arr[i]];
        return arr;
      }
      return null;
    }
    if (arr[i].children) {
      const children = arr[i].children as ControlConfig[];
      const result = reorderInControls(children, controlId, direction);
      if (result) {
        arr[i] = { ...arr[i], children: result };
        return arr;
      }
    }
  }
  return null;
}

function swapInDialog(dialog: DialogConfig, controlIdA: string, controlIdB: string): DialogConfig {
  const updated = { ...dialog };
  for (const zone of ['controlsBackground', 'controls', 'objects'] as ControlZone[]) {
    const idxA = updated[zone].findIndex(c => c.id === controlIdA);
    const idxB = updated[zone].findIndex(c => c.id === controlIdB);
    if (idxA >= 0 && idxB >= 0) {
      const newArr = [...updated[zone]];
      [newArr[idxA], newArr[idxB]] = [newArr[idxB], newArr[idxA]];
      updated[zone] = newArr;
      return updated;
    }
    const result = swapInControls(updated[zone], controlIdA, controlIdB);
    if (result) {
      updated[zone] = result;
      return updated;
    }
  }
  return dialog;
}

function swapInControls(controls: ControlConfig[], controlIdA: string, controlIdB: string): ControlConfig[] | null {
  const arr = [...controls];
  const idxA = arr.findIndex(c => c.id === controlIdA);
  const idxB = arr.findIndex(c => c.id === controlIdB);
  if (idxA >= 0 && idxB >= 0) {
    [arr[idxA], arr[idxB]] = [arr[idxB], arr[idxA]];
    return arr;
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].children) {
      const children = arr[i].children as ControlConfig[];
      const result = swapInControls(children, controlIdA, controlIdB);
      if (result) {
        arr[i] = { ...arr[i], children: result };
        return arr;
      }
    }
  }
  return null;
}

function addToGroup(controls: ControlConfig[], groupId: string, child: ControlConfig): ControlConfig[] | null {
  for (let i = 0; i < controls.length; i++) {
    if (controls[i].id === groupId && controls[i].type === 15) {
      const result = [...controls];
      result[i] = {
        ...result[i],
        children: [...(result[i].children ?? []), { ...child, children: undefined }],
      };
      return result;
    }
    if (controls[i].children) {
      const updated = addToGroup(controls[i].children!, groupId, child);
      if (updated) {
        const result = [...controls];
        result[i] = { ...result[i], children: updated };
        return result;
      }
    }
  }
  return null;
}

function isFloatInRange(val: string | number, min: number, max: number): boolean {
  if (typeof val === 'number') return val >= min && val <= max;
  const n = parseFloat(val);
  return !isNaN(n) && n >= min && n <= max;
}
