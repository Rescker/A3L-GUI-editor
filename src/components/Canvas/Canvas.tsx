// =============================================================================
// Canvas — Main preview canvas with drag & resize orchestration
// All drag/resize state lives here. Document-level listeners track mouse
// outside individual control divs for smooth, uninterrupted interaction.
// =============================================================================

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  controlToCanvasCoords,
  computeSafeZone,
  pixelToGridExpr,
} from '../../utils/gridUtils';
import { ControlRenderer } from './ControlRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { GridOverlay } from './GridOverlay';
import type { ControlConfig, GridSystem } from '../../types/controls';

// =============================================================================
// Resize handle direction
// =============================================================================
type ResizeDir = 'nw' | 'ne' | 'sw' | 'se';

// =============================================================================
// Drag state
// =============================================================================
interface DragState {
  controlId: string;
  startPixelX: number;
  startPixelY: number;
  startPixelW: number;
  startPixelH: number;
  offsetX: number;
  offsetY: number;
}

interface ResizeState {
  controlId: string;
  dir: ResizeDir;
  startPixelX: number;
  startPixelY: number;
  startPixelW: number;
  startPixelH: number;
  offsetX: number;
  offsetY: number;
}

// =============================================================================
// Canvas Component
// =============================================================================
export const Canvas: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    gridSystem,
    gridVariant,
    showGrid,
    snapToGrid,
    previewResolution,
    previewUIScale,
    zoomLevel,
    editingControlId,
    selectControl,
    clearSelection,
    moveControl,
    resizeControl,
    removeControl,
    setCursorGridPos,
    setZoomLevel,
    runValidation,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const activeDialog = dialogs.find(d => d.id === activeDialogId);

  const canvasW = previewResolution.w;
  const canvasH = previewResolution.h;
  const scale = zoomLevel;
  const safeZone = computeSafeZone(canvasW, canvasH, previewUIScale);

  // Get all controls to render based on editing context
  const visibleControls = getVisibleControls(activeDialog, editingControlId);

  // ===========================================================================
  // Auto-fit zoom
  // ===========================================================================
  useEffect(() => {
    if (!activeDialog || !containerRef.current) return;
    const allControls = [...activeDialog.controlsBackground, ...activeDialog.controls];
    if (allControls.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ctrl of allControls) {
      const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
      minX = Math.min(minX, coords.x);
      minY = Math.min(minY, coords.y);
      maxX = Math.max(maxX, coords.x + coords.w);
      maxY = Math.max(maxY, coords.y + coords.h);
    }

    const ctrlW = maxX - minX;
    const ctrlH = maxY - minY;
    if (ctrlW <= 0 || ctrlH <= 0) return;

    const containerW = containerRef.current.clientWidth * 0.85;
    const containerH = containerRef.current.clientHeight * 0.85;
    const fitScale = Math.min(containerW / (ctrlW || 1), containerH / (ctrlH || 1), 2.0);
    setZoomLevel(Math.round(fitScale * 100) / 100);
  }, [activeDialog?.id, canvasW, canvasH, gridSystem, gridVariant, previewUIScale]);

  // ===========================================================================
  // Resolve control from store by ID (use ref for speed in hot loops)
  // ===========================================================================
  const getControlById = useCallback(
    (controlId: string): ControlConfig | undefined => {
      if (!activeDialog) return undefined;
      for (const zone of ['controlsBackground', 'controls', 'objects'] as const) {
        const ctrl = activeDialog[zone].find(c => c.id === controlId);
        if (ctrl) return ctrl;
      }
      return undefined;
    },
    [activeDialog]
  );

  // ===========================================================================
  // Convert pixel position to grid expression for the active grid system
  // ===========================================================================
  const pixelToCurrentGrid = useCallback(
    (px: number, py: number, pw: number, ph: number) => {
      return pixelToGridExpr(px, py, pw, ph, gridSystem, gridVariant, canvasW, canvasH);
    },
    [gridSystem, gridVariant, canvasW, canvasH]
  );

  // ===========================================================================
  // Snap value helpers
  // ===========================================================================
  const snapGridValue = useCallback(
    (expr: string): string => {
      if (!snapToGrid) return expr;
      // For gui_grid values like "4.7 * GUI_GRID_CENTER_W + GUI_GRID_CENTER_X"
      // snap the multiplier to nearest integer
      const match = expr.match(/^([\d.-]+)\s*\*/);
      if (match) {
        const rounded = Math.round(parseFloat(match[1]));
        return expr.replace(/^[\d.-]+/, String(rounded));
      }
      // For absolute/safezone numbers, round to nearest 0.01
      const num = parseFloat(expr);
      if (!isNaN(num)) {
        // Round to nearest grid-increment equivalent (0.025 for 40-wide grid)
        const gridSize = gridSystem === 'absolute' ? 0.025 : 0.01;
        return (Math.round(num / gridSize) * gridSize).toFixed(gridSystem === 'absolute' ? 4 : 2);
      }
      return expr;
    },
    [snapToGrid, gridSystem]
  );

  // ===========================================================================
  // Minimum constraints
  // ===========================================================================
  const enforceMinSize = useCallback(
    (w: number, h: number): { w: number; h: number } => {
      const minPx = 4;
      return {
        w: Math.max(minPx, w),
        h: Math.max(minPx, h),
      };
    },
    []
  );

  // ===========================================================================
  // Canvas-relative mouse coordinate helper
  // ===========================================================================
  const getCanvasMouse = useCallback(
    (e: MouseEvent | React.MouseEvent): { x: number; y: number } | null => {
      if (!canvasInnerRef.current) return null;
      const rect = canvasInnerRef.current.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale,
      };
    },
    [scale]
  );

  // ===========================================================================
  // Canvas boundary clamping
  // ===========================================================================
  const clampToCanvas = useCallback(
    (px: number, py: number, pw: number, ph: number) => ({
      x: Math.max(0, Math.min(px, canvasW - pw)),
      y: Math.max(0, Math.min(py, canvasH - ph)),
    }),
    [canvasW, canvasH]
  );

  // ===========================================================================
  // Clipboard (Ctrl+C / Ctrl+V) via useRef to avoid stale closures
  // ===========================================================================
  const clipboardRef = useRef<ControlConfig[]>([]);

  // ===========================================================================
  // Document-level mousemove — shared by drag and resize
  // ===========================================================================
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDialogId) return;
      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;

      if (isDragging && dragStateRef.current) {
        const ds = dragStateRef.current;

        let newPx = canvasMouse.x - ds.offsetX;
        let newPy = canvasMouse.y - ds.offsetY;

        // Clamp to canvas boundaries
        const clamped = clampToCanvas(newPx, newPy, ds.startPixelW, ds.startPixelH);
        newPx = clamped.x;
        newPy = clamped.y;

        const gridExpr = pixelToCurrentGrid(newPx, newPy, ds.startPixelW, ds.startPixelH);
        let x = gridExpr.x;
        let y = gridExpr.y;
        if (snapToGrid) {
          x = snapGridValue(x);
          y = snapGridValue(y);
        }
        moveControl(activeDialogId, ds.controlId, x, y);
      }

      if (isResizing && resizeStateRef.current) {
        const rs = resizeStateRef.current;

        let newPx = rs.startPixelX;
        let newPy = rs.startPixelY;
        let newPw = rs.startPixelW;
        let newPh = rs.startPixelH;

        const deltaX = canvasMouse.x - (rs.startPixelX + rs.offsetX);
        const deltaY = canvasMouse.y - (rs.startPixelY + rs.offsetY);

        switch (rs.dir) {
          case 'se':
            newPw = rs.startPixelW + deltaX;
            newPh = rs.startPixelH + deltaY;
            break;
          case 'ne':
            newPy = rs.startPixelY + deltaY;
            newPw = rs.startPixelW + deltaX;
            newPh = rs.startPixelH - deltaY;
            break;
          case 'sw':
            newPx = rs.startPixelX + deltaX;
            newPw = rs.startPixelW - deltaX;
            newPh = rs.startPixelH + deltaY;
            break;
          case 'nw':
            newPx = rs.startPixelX + deltaX;
            newPy = rs.startPixelY + deltaY;
            newPw = rs.startPixelW - deltaX;
            newPh = rs.startPixelH - deltaY;
            break;
        }

        const constrained = enforceMinSize(newPw, newPh);
        newPw = constrained.w;
        newPh = constrained.h;

        // Recalculate position if width/height were clamped
        if (constrained.w !== rs.startPixelW + deltaX) {
          if (rs.dir === 'sw' || rs.dir === 'nw') {
            newPx = rs.startPixelX + rs.startPixelW - newPw;
          }
        }
        if (constrained.h !== rs.startPixelH + deltaY) {
          if (rs.dir === 'ne' || rs.dir === 'nw') {
            newPy = rs.startPixelY + rs.startPixelH - newPh;
          }
        }

        // Clamp to canvas boundaries
        const clamped = clampToCanvas(newPx, newPy, newPw, newPh);
        newPx = clamped.x;
        newPy = clamped.y;
        // Also clamp size to canvas if it would exceed
        if (clamped.x + newPw > canvasW) newPw = canvasW - clamped.x;
        if (clamped.y + newPh > canvasH) newPh = canvasH - clamped.y;
        const clamped2 = enforceMinSize(newPw, newPh);
        newPw = clamped2.w;
        newPh = clamped2.h;

        const gridExpr = pixelToCurrentGrid(newPx, newPy, newPw, newPh);
        let x = gridExpr.x;
        let y = gridExpr.y;
        let w = gridExpr.w;
        let h = gridExpr.h;
        if (snapToGrid) {
          x = snapGridValue(x);
          y = snapGridValue(y);
          w = snapGridValue(w);
          h = snapGridValue(h);
        }
        moveControl(activeDialogId, rs.controlId, x, y);
        resizeControl(activeDialogId, rs.controlId, w, h);
      }
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      resizeStateRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
      runValidation();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, activeDialogId, scale, snapToGrid, moveControl, resizeControl, pixelToCurrentGrid, snapGridValue, enforceMinSize, runValidation, getCanvasMouse, clampToCanvas, canvasW, canvasH]);

  // ===========================================================================
  // Keyboard: Delete, Escape, Ctrl+C, Ctrl+V, Arrow nudging
  // ===========================================================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toUpperCase();
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      const ids = selectedControlIds;
      const dialogId = activeDialogId;

      // === Delete / Backspace ===
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length > 0 && dialogId) {
        if (isInput) return;
        e.preventDefault();
        const store = useEditorStore.getState();
        for (const id of ids) {
          store.removeControl(dialogId, id);
        }
        return;
      }

      // === Escape ===
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }

      // === Arrow key nudging (1 grid unit or pixel unit) ===
      if (ids.length > 0 && dialogId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Don't nudge if the cursor stays at the boundaries of a text field
        if (isInput && !e.ctrlKey) return;

        e.preventDefault();
        const store = useEditorStore.getState();
        const isFine = e.ctrlKey;
        const step = isFine ? 0.1 : 1;

        for (const id of ids) {
          const ctrl = getControlById(id);
          if (!ctrl) continue;

          const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          let dx = 0, dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;

          // Apply delta in grid units (pixels for convenience, converted below)
          const newPx = coords.x + dx;
          const newPy = coords.y + dy;
          // Clamp to canvas boundaries
          const clamped = clampToCanvas(newPx, newPy, coords.w, coords.h);
          const gridExpr = pixelToCurrentGrid(clamped.x, clamped.y, coords.w, coords.h);
          store.moveControl(dialogId, id, gridExpr.x, gridExpr.y);
        }
        return;
      }

      // === Ctrl+C / Ctrl+V ===
      if (e.ctrlKey && e.key === 'c' && ids.length > 0 && dialogId) {
        if (isInput) return;
        const store = useEditorStore.getState();
        const copies: ControlConfig[] = [];
        for (const id of ids) {
          const ctrl = getControlById(id);
          if (ctrl) copies.push(structuredClone(ctrl));
        }
        clipboardRef.current = copies;
        return;
      }

      if (e.ctrlKey && e.key === 'v' && clipboardRef.current.length > 0 && dialogId) {
        if (isInput) return;
        e.preventDefault();
        const store = useEditorStore.getState();
        for (const copy of clipboardRef.current) {
          // Offset each pasted copy slightly
          const coords = controlToCanvasCoords(copy, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          const gridExpr = pixelToCurrentGrid(coords.x + 1, coords.y + 1, coords.w, coords.h);
          // Create a new control with same properties but new id/idc
          const newCtrl: ControlConfig = {
            ...structuredClone(copy),
            x: gridExpr.x,
            y: gridExpr.y,
          };
          store.addControl(dialogId, copy.type, 'controls');
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedControlIds, activeDialogId, canvasW, canvasH, gridSystem, gridVariant, previewUIScale, clearSelection, getControlById, pixelToCurrentGrid, clampToCanvas]);

  // ===========================================================================
  // Canvas click for deselection
  // ===========================================================================
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
        if (!e.ctrlKey) {
          clearSelection();
        }
      }
    },
    [clearSelection]
  );

  // ===========================================================================
  // Mouse move for cursor position display
  // ===========================================================================
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      const gridX = (x / canvasW * 40).toFixed(1);
      const gridY = (y / canvasH * 25).toFixed(1);
      setCursorGridPos(gridX, gridY);
    },
    [canvasW, canvasH, scale, setCursorGridPos]
  );

  // ===========================================================================
  // Control mousedown → begin drag
  // ===========================================================================
  const handleControlMouseDown = useCallback(
    (controlId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      selectControl(controlId, e.ctrlKey || e.metaKey);

      const ctrl = getControlById(controlId);
      if (!ctrl) return;

      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;

      const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);

      dragStateRef.current = {
        controlId,
        startPixelX: coords.x,
        startPixelY: coords.y,
        startPixelW: coords.w,
        startPixelH: coords.h,
        offsetX: canvasMouse.x - coords.x,
        offsetY: canvasMouse.y - coords.y,
      };
      setIsDragging(true);
    },
    [selectControl, getControlById, getCanvasMouse, gridSystem, gridVariant, canvasW, canvasH, previewUIScale]
  );

  // ===========================================================================
  // Resize handle mousedown → begin resize
  // ===========================================================================
  const handleResizeHandleMouseDown = useCallback(
    (controlId: string, dir: ResizeDir, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const ctrl = getControlById(controlId);
      if (!ctrl) return;

      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;

      const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);

      resizeStateRef.current = {
        controlId,
        dir,
        startPixelX: coords.x,
        startPixelY: coords.y,
        startPixelW: coords.w,
        startPixelH: coords.h,
        offsetX: canvasMouse.x - coords.x,
        offsetY: canvasMouse.y - coords.y,
      };
      setIsResizing(true);
    },
    [getControlById, getCanvasMouse, gridSystem, gridVariant, canvasW, canvasH, previewUIScale]
  );

  // ===========================================================================
  // Render
  // ===========================================================================
  if (!activeDialog) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-light rounded-lg m-2">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-lg font-medium mb-2">No Dialog Open</div>
          <div className="text-sm">Create a new dialog or select one from the hierarchy.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-surface-light rounded-lg m-2 relative outline-none"
      tabIndex={0}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onClick={() => containerRef.current?.focus()}
      style={{ cursor: isDragging ? 'grabbing' : isResizing ? 'crosshair' : 'default' }}
    >
      <div
        ref={canvasInnerRef}
        data-canvas="true"
        className="relative mx-auto shadow-2xl"
        style={{
          width: canvasW * scale,
          height: canvasH * scale,
          minWidth: canvasW * scale,
          minHeight: canvasH * scale,
          backgroundColor: '#0a0a1a',
          backgroundImage:
            'linear-gradient(45deg, #111 25%, transparent 25%), ' +
            'linear-gradient(-45deg, #111 25%, transparent 25%), ' +
            'linear-gradient(45deg, transparent 75%, #111 75%), ' +
            'linear-gradient(-45deg, transparent 75%, #111 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      >
        {/* SafeZone indicator */}
        <div
          className="absolute border border-teal-500/30 pointer-events-none"
          style={{
            left: safeZone.x * canvasW * scale,
            top: safeZone.y * canvasH * scale,
            width: safeZone.w * canvasW * scale,
            height: safeZone.h * canvasH * scale,
          }}
        />

        {/* Grid overlay */}
        {showGrid && (
          <GridOverlay
            gridSystem={gridSystem}
            canvasW={canvasW}
            canvasH={canvasH}
            scale={scale}
            safeZone={safeZone}
          />
        )}

        {/* Render controls */}
        {visibleControls.map((ctrl) => (
          <ControlRenderer
            key={ctrl.id}
            control={ctrl}
            dialogId={activeDialog.id}
            isSelected={selectedControlIds.includes(ctrl.id)}
            gridSystem={gridSystem}
            gridVariant={gridVariant}
            canvasW={canvasW}
            canvasH={canvasH}
            scale={scale}
            safeZone={safeZone}
            uiScale={previewUIScale}
            onMouseDownCapture={(e) => handleControlMouseDown(ctrl.id, e)}
          />
        ))}

        {/* Selection overlay with resize handles */}
        <SelectionOverlay
          controls={visibleControls}
          selectedIds={selectedControlIds}
          gridSystem={gridSystem}
          gridVariant={gridVariant}
          canvasW={canvasW}
          canvasH={canvasH}
          scale={scale}
          safeZone={safeZone}
          uiScale={previewUIScale}
          onHandleMouseDown={handleResizeHandleMouseDown}
        />
      </div>
    </div>
  );
};

// =============================================================================
// Helpers
// =============================================================================
function getVisibleControls(
  dialog: import('../../types/controls').DialogConfig | undefined,
  editingControlId: string | null
): ControlConfig[] {
  if (!dialog) return [];

  if (editingControlId) {
    const findGroup = (controls: ControlConfig[]): ControlConfig[] | null => {
      for (const ctrl of controls) {
        if (ctrl.id === editingControlId && ctrl.type === 15) {
          return ctrl.children ?? [];
        }
        if (ctrl.children) {
          const found = findGroup(ctrl.children);
          if (found) return found;
        }
      }
      return null;
    };

    const groupChildren =
      findGroup(dialog.controls) ??
      findGroup(dialog.controlsBackground) ??
      findGroup(dialog.objects);
    if (groupChildren) return groupChildren;
  }

  return [...dialog.controlsBackground, ...dialog.controls, ...dialog.objects];
}
