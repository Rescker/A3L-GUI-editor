// =============================================================================
// Canvas — Main preview canvas with drag & resize orchestration
// All drag/resize state lives here. Document-level listeners track mouse
// outside individual control divs for smooth, uninterrupted interaction.
// =============================================================================

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  controlToCanvasCoords,
  computeSafeZone,
  pixelToGridExpr,
} from '../../utils/gridUtils';
import { buildComponentRects, findAlignments } from '../../utils/alignmentUtils';
import { ControlRenderer } from './ControlRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { GridOverlay } from './GridOverlay';
import { AlignmentGuideOverlay } from './AlignmentGuideOverlay';
import type { ControlConfig, GridSystem, ResizeDir, GroupResizeState, ComponentRect, ControlZone } from '../../types/controls';

// =============================================================================
// Local drag state (not exported — single-control drag)
// =============================================================================
interface DragState {
  controlId: string;
  startPixelX: number;
  startPixelY: number;
  startPixelW: number;
  startPixelH: number;
  startExprX: string | number;
  startExprY: string | number;
  offsetX: number;
  offsetY: number;
}

interface SingleResizeState {
  controlId: string;
  dir: ResizeDir;
  startPixelX: number;
  startPixelY: number;
  startPixelW: number;
  startPixelH: number;
  startExprX: string | number;
  startExprY: string | number;
  startExprW: string | number;
  startExprH: string | number;
  offsetX: number;
  offsetY: number;
}

interface PanState {
  startPanX: number;
  startPanY: number;
  startMouseX: number;
  startMouseY: number;
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
    canvasPanX,
    canvasPanY,
    canvasFitRequestId,
    isCanvasFullscreen,
    editingControlId,
    selectControl,
    clearSelection,
    moveControl,
    resizeControl,
    moveMultipleControls,
    resizeMultipleControls,
    removeControl,
    addControlFromTemplate,
    moveControlUp,
    moveControlDown,
    setCursorGridPos,
    setZoomLevel,
    setCanvasPan,
    setCanvasView,
    runValidation,
    showAlignmentGuides,
    snapToAlignment,
    alignmentGuides,
    setAlignmentGuides,
    setCanvasFullscreen,
    setFullscreenIntent,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<SingleResizeState | null>(null);
  const groupResizeRef = useRef<GroupResizeState | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const prevZoomRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [pendingDrag, setPendingDrag] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panRef = useRef({ x: canvasPanX, y: canvasPanY });

  useEffect(() => {
    panRef.current = { x: canvasPanX, y: canvasPanY };
  }, [canvasPanX, canvasPanY]);

  const DRAG_THRESHOLD = 4;
  const ZOOM_MIN = 0.1;
  const ZOOM_MAX = 10;
  const ZOOM_STEP = 0.05;
  const FIT_PADDING = 1.84;

  const activeDialog = dialogs.find(d => d.id === activeDialogId);

  const canvasW = previewResolution.w;
  const canvasH = previewResolution.h;
  const zoom = zoomLevel;
  const safeZone = useMemo(
    () => computeSafeZone(canvasW, canvasH, previewUIScale),
    [canvasW, canvasH, previewUIScale]
  );

  const clampZoom = useCallback(
    (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)),
    [ZOOM_MAX, ZOOM_MIN]
  );

  const roundZoom = useCallback((value: number) => Math.round(value * 100) / 100, []);

  const getViewportSize = useCallback(() => {
    const fullscreenEl = fullscreenRef.current;
    const isFullscreen = fullscreenEl && document.fullscreenElement === fullscreenEl;
    const target = isFullscreen ? fullscreenEl : containerRef.current;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : target.clientWidth;
    const height = rect.height > 0 ? rect.height : target.clientHeight;
    if (width <= 0 || height <= 0) return null;
    return { width, height };
  }, []);

  const getCenteredPan = useCallback(
    (targetZoom: number, pointX: number, pointY: number) => {
      const viewport = getViewportSize();
      if (!viewport) return null;
      return {
        x: viewport.width / 2 - pointX * targetZoom,
        y: viewport.height / 2 - pointY * targetZoom,
      };
    },
    [getViewportSize]
  );

  const centerCanvasPoint = useCallback(
    (targetZoom: number, pointX: number, pointY: number) => {
      const pan = getCenteredPan(targetZoom, pointX, pointY);
      if (!pan) return;
      setCanvasPan(pan.x, pan.y);
    },
    [getCenteredPan, setCanvasPan]
  );

  const centerSafeZone = useCallback(
    (targetZoom: number) => {
      const centerX = (safeZone.x + safeZone.w / 2) * canvasW;
      const centerY = (safeZone.y + safeZone.h / 2) * canvasH;
      centerCanvasPoint(targetZoom, centerX, centerY);
    },
    [canvasW, canvasH, safeZone, centerCanvasPoint]
  );

  const fitSafeZone = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const safeW = safeZone.w * canvasW;
    const safeH = safeZone.h * canvasH;
    if (safeW <= 0 || safeH <= 0) return;

    const fitScale = Math.min(
      (container.clientWidth / safeW) * FIT_PADDING,
      (container.clientHeight / safeH) * FIT_PADDING,
      ZOOM_MAX
    );
    const nextZoom = clampZoom(roundZoom(fitScale));
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    const pan = getCenteredPan(nextZoom, centerX, centerY);
    if (pan) {
      setCanvasView(nextZoom, pan.x, pan.y);
      return;
    }
    requestAnimationFrame(() => {
      const retry = getCenteredPan(nextZoom, centerX, centerY);
      if (retry) {
        setCanvasView(nextZoom, retry.x, retry.y);
      }
    });
  }, [canvasW, canvasH, safeZone, FIT_PADDING, ZOOM_MAX, clampZoom, roundZoom, getCenteredPan, setCanvasView]);

  // Get all controls to render based on editing context
  const visibleControls = getVisibleControls(activeDialog, editingControlId);

  // ===========================================================================
  // Fullscreen preview handling
  // ===========================================================================
  useEffect(() => {
    const handleFullscreenChange = () => {
      const target = fullscreenRef.current;
      const isActive = !!target && document.fullscreenElement === target;
      setCanvasFullscreen(isActive);

      if (isActive) {
        if (prevZoomRef.current === null) {
          prevZoomRef.current = zoomLevel;
        }
        const centerX = (safeZone.x + safeZone.w / 2) * canvasW;
        const centerY = (safeZone.y + safeZone.h / 2) * canvasH;
        const pan = getCenteredPan(1, centerX, centerY);
        if (pan) {
          setCanvasView(1, pan.x, pan.y);
        } else {
          requestAnimationFrame(() => {
            const retry = getCenteredPan(1, centerX, centerY);
            if (retry) {
              setCanvasView(1, retry.x, retry.y);
            } else {
              setZoomLevel(1);
            }
          });
        }
      } else if (prevZoomRef.current !== null) {
        prevZoomRef.current = null;
        setFullscreenIntent(false);
        requestAnimationFrame(() => {
          fitSafeZone();
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [setCanvasFullscreen, setFullscreenIntent, setZoomLevel, zoomLevel, safeZone, canvasW, canvasH, getCenteredPan, setCanvasView]);

  useEffect(() => {
    if (!activeDialog || !containerRef.current) return;
    centerSafeZone(zoom);
  }, [activeDialog?.id, canvasW, canvasH, previewUIScale, centerSafeZone]);

  useEffect(() => {
    if (!activeDialog) return;
    fitSafeZone();
  }, [canvasFitRequestId, activeDialog?.id, fitSafeZone]);

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

  const computeGroupBBox = useCallback(
    (controlIds: string[]): { x: number; y: number; w: number; h: number } => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const id of controlIds) {
        const ctrl = getControlById(id);
        if (!ctrl) continue;
        const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
        minX = Math.min(minX, coords.x);
        minY = Math.min(minY, coords.y);
        maxX = Math.max(maxX, coords.x + coords.w);
        maxY = Math.max(maxY, coords.y + coords.h);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    },
    [getControlById, gridSystem, gridVariant, canvasW, canvasH, previewUIScale]
  );

  const buildRectsForControls = useCallback(
    (controls: ControlConfig[]): ComponentRect[] => {
      const rects: ComponentRect[] = [];
      for (const ctrl of controls) {
        const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
        rects.push({
          id: ctrl.id,
          x: coords.x,
          y: coords.y,
          w: coords.w,
          h: coords.h,
          cx: coords.x + coords.w / 2,
          cy: coords.y + coords.h / 2,
          right: coords.x + coords.w,
          bottom: coords.y + coords.h,
        });
      }
      return rects;
    },
    [gridSystem, gridVariant, canvasW, canvasH, previewUIScale]
  );

  // ===========================================================================
  // Convert pixel position to grid expression for the active grid system
  // ===========================================================================
  const pixelToCurrentGrid = useCallback(
    (px: number, py: number, pw: number, ph: number) => {
      return pixelToGridExpr(px, py, pw, ph, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
    },
    [gridSystem, gridVariant, canvasW, canvasH, previewUIScale]
  );

  // ===========================================================================
  // Snap value helpers
  // ===========================================================================
  const snapGridValue = useCallback(
    (expr: string): string => {
      if (!snapToGrid) return expr;
      const gridSize = gridSystem === 'absolute' ? 0.025 : 0.01;
      const decimals = gridSystem === 'absolute' ? 4 : 2;
      // For grid expressions like "4.7 * GUI_GRID_CENTER_W + GUI_GRID_CENTER_X"
      // or safezone expressions like "0.1985 * safezoneW + safezoneX"
      // snap the leading multiplier to the grid increment
      const match = expr.match(/^([\d.-]+)\s*\*/);
      if (match) {
        const num = parseFloat(match[1]);
        const snapped = (Math.round(num / gridSize) * gridSize).toFixed(decimals);
        return expr.replace(/^[\d.-]+/, String(snapped));
      }
      // For plain numbers
      const num = parseFloat(expr);
      if (!isNaN(num)) {
        return (Math.round(num / gridSize) * gridSize).toFixed(decimals);
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
      const container = containerRef.current;
      if (!container) return null;
      const rect = container.getBoundingClientRect();
      const currentPan = panRef.current;
      return {
        x: (e.clientX - rect.left - currentPan.x) / zoom,
        y: (e.clientY - rect.top - currentPan.y) / zoom,
      };
    },
    [zoom]
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
  // Clipboard (Ctrl+C / Ctrl+V) — stored in global Zustand store
  // ===========================================================================

  // ===========================================================================
  // Document-level mousemove — shared by drag, resize, and pan
  // ===========================================================================
  useEffect(() => {
    if (!pendingDrag && !isDragging && !isResizing && !isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      // === Pan (middle mouse) ===
      if (isPanning && panStateRef.current) {
        const ps = panStateRef.current;
        const dx = e.clientX - ps.startMouseX;
        const dy = e.clientY - ps.startMouseY;
        setCanvasPan(ps.startPanX + dx, ps.startPanY + dy);
        return;
      }

      if (!activeDialogId) return;
      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;

      if (pendingDrag && dragStateRef.current && dragOriginRef.current) {
        const dx = canvasMouse.x - dragOriginRef.current.x;
        const dy = canvasMouse.y - dragOriginRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= DRAG_THRESHOLD) {
          const ds = dragStateRef.current;
          ds.offsetX = canvasMouse.x - ds.startPixelX;
          ds.offsetY = canvasMouse.y - ds.startPixelY;
          dragOriginRef.current = { x: canvasMouse.x, y: canvasMouse.y };
          setPendingDrag(false);
          setIsDragging(true);
        } else {
          return;
        }
      }

      if (isDragging && dragStateRef.current) {
        const ds = dragStateRef.current;
        const store = useEditorStore.getState();
        const selectedIds = store.selectedControlIds;
        const isMultiDrag = selectedIds.length > 1 && selectedIds.includes(ds.controlId);

        if (isMultiDrag) {
          const currentX = canvasMouse.x - ds.offsetX;
          const currentY = canvasMouse.y - ds.offsetY;
          const deltaX = currentX - ds.startPixelX;
          const deltaY = currentY - ds.startPixelY;

          const updates: { id: string; x: number | string; y: number | string }[] = [];
          for (const id of selectedIds) {
            const ctrl = getControlById(id);
            if (!ctrl) continue;
            const cCoords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
            const newPx = cCoords.x + deltaX;
            const newPy = cCoords.y + deltaY;
            const clamped = clampToCanvas(newPx, newPy, cCoords.w, cCoords.h);
            const clampedExpr = pixelToGridExpr(clamped.x, clamped.y, cCoords.w, cCoords.h, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
            let x = clampedExpr.x;
            let y = clampedExpr.y;
            if (snapToGrid) {
              x = snapGridValue(x);
              y = snapGridValue(y);
            }
            updates.push({ id, x, y });
          }
          if (updates.length > 0) {
            moveMultipleControls(activeDialogId, updates);
          }
        } else {
          let newPx = canvasMouse.x - ds.offsetX;
          let newPy = canvasMouse.y - ds.offsetY;

          const clamped = clampToCanvas(newPx, newPy, ds.startPixelW, ds.startPixelH);
          newPx = clamped.x;
          newPy = clamped.y;

          const newExpr = pixelToGridExpr(newPx, newPy, ds.startPixelW, ds.startPixelH, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          let x = newExpr.x;
          let y = newExpr.y;
          if (snapToGrid) {
            x = snapGridValue(x);
            y = snapGridValue(y);
          }
          moveControl(activeDialogId, ds.controlId, x, y);
        }
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
          case 'n':
            newPy = rs.startPixelY + deltaY;
            newPh = rs.startPixelH - deltaY;
            break;
          case 's':
            newPh = rs.startPixelH + deltaY;
            break;
          case 'e':
            newPw = rs.startPixelW + deltaX;
            break;
          case 'w':
            newPx = rs.startPixelX + deltaX;
            newPw = rs.startPixelW - deltaX;
            break;
        }

        const constrained = enforceMinSize(newPw, newPh);
        newPw = constrained.w;
        newPh = constrained.h;

        if (constrained.w !== (rs.startPixelW + (rs.dir === 'w' || rs.dir === 'nw' || rs.dir === 'sw' ? -deltaX : deltaX))) {
          if (rs.dir === 'sw' || rs.dir === 'nw' || rs.dir === 'w') {
            newPx = rs.startPixelX + rs.startPixelW - newPw;
          }
        }
        if (constrained.h !== (rs.startPixelH + (rs.dir === 'n' || rs.dir === 'ne' || rs.dir === 'nw' ? -deltaY : deltaY))) {
          if (rs.dir === 'ne' || rs.dir === 'nw' || rs.dir === 'n') {
            newPy = rs.startPixelY + rs.startPixelH - newPh;
          }
        }

        const clamped = clampToCanvas(newPx, newPy, newPw, newPh);
        newPx = clamped.x;
        newPy = clamped.y;
        if (clamped.x + newPw > canvasW) newPw = canvasW - clamped.x;
        if (clamped.y + newPh > canvasH) newPh = canvasH - clamped.y;
        const clamped2 = enforceMinSize(newPw, newPh);
        newPw = clamped2.w;
        newPh = clamped2.h;

        const newExpr = pixelToGridExpr(newPx, newPy, newPw, newPh, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
        let x = newExpr.x;
        let y = newExpr.y;
        let w = newExpr.w;
        let h = newExpr.h;
        if (snapToGrid) {
          x = snapGridValue(x);
          y = snapGridValue(y);
          w = snapGridValue(w);
          h = snapGridValue(h);
        }
        moveControl(activeDialogId, rs.controlId, x, y);
        resizeControl(activeDialogId, rs.controlId, w, h);
      }

      if (isResizing && groupResizeRef.current) {
        const grs = groupResizeRef.current;

        const canvasMouseDeltaX = canvasMouse.x - (grs.startBBox.x + grs.offsetX);
        const canvasMouseDeltaY = canvasMouse.y - (grs.startBBox.y + grs.offsetY);

        let newBw = grs.startBBox.w;
        let newBh = grs.startBBox.h;
        let newBx = grs.startBBox.x;
        let newBy = grs.startBBox.y;

        const deltaX = canvasMouse.x - (grs.startBBox.x + grs.offsetX);
        const deltaY = canvasMouse.y - (grs.startBBox.y + grs.offsetY);

        switch (grs.dir) {
          case 'se':
            newBw = grs.startBBox.w + deltaX;
            newBh = grs.startBBox.h + deltaY;
            break;
          case 'ne':
            newBy = grs.startBBox.y + deltaY;
            newBw = grs.startBBox.w + deltaX;
            newBh = grs.startBBox.h - deltaY;
            break;
          case 'sw':
            newBx = grs.startBBox.x + deltaX;
            newBw = grs.startBBox.w - deltaX;
            newBh = grs.startBBox.h + deltaY;
            break;
          case 'nw':
            newBx = grs.startBBox.x + deltaX;
            newBy = grs.startBBox.y + deltaY;
            newBw = grs.startBBox.w - deltaX;
            newBh = grs.startBBox.h - deltaY;
            break;
          case 'n':
            newBy = grs.startBBox.y + deltaY;
            newBh = grs.startBBox.h - deltaY;
            break;
          case 's':
            newBh = grs.startBBox.h + deltaY;
            break;
          case 'e':
            newBw = grs.startBBox.w + deltaX;
            break;
          case 'w':
            newBx = grs.startBBox.x + deltaX;
            newBw = grs.startBBox.w - deltaX;
            break;
        }

        const constrainedB = enforceMinSize(newBw, newBh);
        newBw = constrainedB.w;
        newBh = constrainedB.h;

        if (constrainedB.w !== newBw) {
          if (grs.dir === 'sw' || grs.dir === 'nw' || grs.dir === 'w') {
            newBx = grs.startBBox.x + grs.startBBox.w - newBw;
          }
        }
        if (constrainedB.h !== newBh) {
          if (grs.dir === 'ne' || grs.dir === 'nw' || grs.dir === 'n') {
            newBy = grs.startBBox.y + grs.startBBox.h - newBh;
          }
        }

        const clampedB = clampToCanvas(newBx, newBy, newBw, newBh);
        newBx = clampedB.x;
        newBy = clampedB.y;
        if (clampedB.x + newBw > canvasW) newBw = canvasW - clampedB.x;
        if (clampedB.y + newBh > canvasH) newBh = canvasH - clampedB.y;
        const clampedB2 = enforceMinSize(newBw, newBh);
        newBw = clampedB2.w;
        newBh = clampedB2.h;

        const scaleX = grs.startBBox.w > 0 ? newBw / grs.startBBox.w : 1;
        const scaleY = grs.startBBox.h > 0 ? newBh / grs.startBBox.h : 1;
        const shiftX = newBx - grs.startBBox.x;
        const shiftY = newBy - grs.startBBox.y;

        const updates: { id: string; x: number | string; y: number | string; w: number | string; h: number | string }[] = [];

        for (const snap of grs.snapshots) {
          const newPixelX = snap.pixelX + (snap.pixelX - grs.startBBox.x) * (scaleX - 1) + shiftX;
          const newPixelY = snap.pixelY + (snap.pixelY - grs.startBBox.y) * (scaleY - 1) + shiftY;
          const newPixelW = snap.pixelW * scaleX;
          const newPixelH = snap.pixelH * scaleY;

          const controlExpr = pixelToGridExpr(newPixelX, newPixelY, newPixelW, newPixelH, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          let x = controlExpr.x;
          let y = controlExpr.y;
          let w = controlExpr.w;
          let h = controlExpr.h;
          if (snapToGrid) {
            x = snapGridValue(x);
            y = snapGridValue(y);
            w = snapGridValue(w);
            h = snapGridValue(h);
          }
          updates.push({ id: snap.id, x, y, w, h });
        }

        if (updates.length > 0) {
          resizeMultipleControls(activeDialogId, updates);
        }
      }

      // Alignment detection during drag or resize
      if (showAlignmentGuides && (isDragging || isResizing)) {
        const store = useEditorStore.getState();
        const selectedIds = store.selectedControlIds;
        const activeDialog = store.dialogs.find(d => d.id === activeDialogId);
        if (activeDialog && selectedIds.length > 0) {
          const allControls = [...activeDialog.controlsBackground, ...activeDialog.controls, ...activeDialog.objects];
          const selectedRects: ComponentRect[] = [];
          for (const ctrl of allControls) {
            if (selectedIds.includes(ctrl.id)) {
              const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
              selectedRects.push({
                id: ctrl.id, x: coords.x, y: coords.y, w: coords.w, h: coords.h,
                cx: coords.x + coords.w / 2, cy: coords.y + coords.h / 2,
                right: coords.x + coords.w, bottom: coords.y + coords.h,
              });
            }
          }
          const allRects = buildRectsForControls(allControls);
          const sz = computeSafeZone(canvasW, canvasH, previewUIScale);
          const alignmentThreshold = Math.max(1, 5 / zoom);
          const guides = findAlignments(selectedRects, allRects, canvasW, canvasH, sz, alignmentThreshold);
          setAlignmentGuides(guides);
        }
      }
    };

    const handleMouseUp = () => {
      if (pendingDrag) {
        setPendingDrag(false);
      }
      if (isPanning) {
        panStateRef.current = null;
        setIsPanning(false);
      }
      dragStateRef.current = null;
      resizeStateRef.current = null;
      groupResizeRef.current = null;
      dragOriginRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
      setAlignmentGuides([]);
      runValidation();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pendingDrag, isDragging, isResizing, isPanning, activeDialogId, zoom, snapToGrid, moveControl, resizeControl, resizeMultipleControls, showAlignmentGuides, snapToAlignment, setAlignmentGuides, pixelToCurrentGrid, snapGridValue, enforceMinSize, runValidation, getCanvasMouse, clampToCanvas, canvasW, canvasH, gridSystem, gridVariant, previewUIScale, buildRectsForControls]);

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

      // === Ctrl+Z (Undo) ===
      if (e.ctrlKey && !e.shiftKey && e.key === 'z' && !isInput) {
        e.preventDefault();
        useEditorStore.getState().undo?.();
        return;
      }

      // === Ctrl+Y or Ctrl+Shift+Z (Redo) ===
      if (((e.ctrlKey && !e.shiftKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) && !isInput) {
        e.preventDefault();
        useEditorStore.getState().redo?.();
        return;
      }

      // === Escape ===
      if (e.key === 'Escape') {
        if (isCanvasFullscreen) return;
        clearSelection();
        return;
      }

      // === Ctrl+Shift+Arrow Up/Down — reorder selected control in hierarchy ===
      if (ids.length > 0 && dialogId && e.ctrlKey && e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        const store = useEditorStore.getState();
        if (e.key === 'ArrowUp') {
          for (const id of ids) store.moveControlUp(dialogId, id);
        } else {
          for (const id of ids) store.moveControlDown(dialogId, id);
        }
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

          const newPx = coords.x + dx;
          const newPy = coords.y + dy;
          const clamped = clampToCanvas(newPx, newPy, coords.w, coords.h);
          const nudgedExpr = pixelToGridExpr(clamped.x, clamped.y, coords.w, coords.h, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          store.moveControl(dialogId, id, nudgedExpr.x, nudgedExpr.y);
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
        // Find which zone the first selected control is in
        const activeDlg = store.dialogs.find(d => d.id === dialogId);
        let sourceZone: ControlZone = 'controls';
        if (activeDlg && copies.length > 0) {
          const firstId = copies[0].id;
          sourceZone = findControlZone(activeDlg, firstId) ?? 'controls';
        }
        store.copyControls(copies, sourceZone);
        return;
      }

      if (e.ctrlKey && e.key === 'v' && dialogId) {
        const store = useEditorStore.getState();
        if (store.clipboard.length === 0) return;
        if (isInput) return;
        e.preventDefault();
        for (const copy of store.clipboard) {
          const clone = structuredClone(copy);
          const coords = controlToCanvasCoords(copy, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          const offsetPx = Math.max(20, coords.w * 0.1);
          const pasteExpr = pixelToGridExpr(coords.x + offsetPx, coords.y + offsetPx, coords.w, coords.h, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          clone.x = snapToGrid ? snapGridValue(pasteExpr.x) : pasteExpr.x;
          clone.y = snapToGrid ? snapGridValue(pasteExpr.y) : pasteExpr.y;
          const zone = store.clipboardSourceZone ?? 'controls';
          store.addControlFromTemplate(dialogId, clone, zone);
        }
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedControlIds, activeDialogId, canvasW, canvasH, gridSystem, gridVariant, previewUIScale, clearSelection, getControlById, pixelToCurrentGrid, clampToCanvas, isCanvasFullscreen, moveControlUp, moveControlDown]);

  // ===========================================================================
  // Canvas click for deselection
  // ===========================================================================
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle mouse button → start panning
      if (e.button === 1) {
        e.preventDefault();
        const container = containerRef.current;
        if (!container) return;
        const currentPan = panRef.current;
        panStateRef.current = {
          startPanX: currentPan.x,
          startPanY: currentPan.y,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
        };
        setIsPanning(true);
        return;
      }

      // Only left-click deselects on background
      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      // Only deselect if clicking on canvas background (not a control or its handles)
      const isOnControl = target.closest('[data-control-id]');
      const isOnHandle = target.closest('[data-handle]');
      if (!isOnControl && !isOnHandle) {
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
      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;
      const x = canvasMouse.x;
      const y = canvasMouse.y;
      const gridX = (x / canvasW * 40).toFixed(1);
      const gridY = (y / canvasH * 25).toFixed(1);
      setCursorGridPos(gridX, gridY);
    },
    [canvasW, canvasH, getCanvasMouse, setCursorGridPos]
  );

  // ===========================================================================
  // Control mousedown → begin drag
  // ===========================================================================
  const handleControlMouseDown = useCallback(
    (controlId: string, e: React.MouseEvent) => {
      // Middle mouse button → start panning instead of control drag
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        const container = containerRef.current;
        if (!container) return;
        const currentPan = panRef.current;
        panStateRef.current = {
          startPanX: currentPan.x,
          startPanY: currentPan.y,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
        };
        setIsPanning(true);
        return;
      }

      // Only left-click selects and drags
      if (e.button !== 0) return;

      e.stopPropagation();

      // If clicking an already-selected control with others selected,
      // keep multi-selection intact — drag all together without needing Ctrl.
      const store = useEditorStore.getState();
      const isAlreadySelected = store.selectedControlIds.includes(controlId);
      const hasMultipleSelected = store.selectedControlIds.length > 1;

      if (!(isAlreadySelected && hasMultipleSelected)) {
        selectControl(controlId, e.ctrlKey || e.metaKey);
      }

      const ctrl = getControlById(controlId);
      if (!ctrl) return;

      const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left) / zoom;
      const offsetY = (e.clientY - rect.top) / zoom;
      const canvasMouse = { x: coords.x + offsetX, y: coords.y + offsetY };

      dragStateRef.current = {
        controlId,
        startPixelX: coords.x,
        startPixelY: coords.y,
        startPixelW: coords.w,
        startPixelH: coords.h,
        startExprX: ctrl.x,
        startExprY: ctrl.y,
        offsetX,
        offsetY,
      };
      dragOriginRef.current = { x: canvasMouse.x, y: canvasMouse.y };
      setPendingDrag(true);
    },
    [selectControl, getControlById, gridSystem, gridVariant, canvasW, canvasH, previewUIScale, zoom]
  );

  // ===========================================================================
  // Resize handle mousedown → begin resize
  // ===========================================================================
  const handleResizeHandleMouseDown = useCallback(
    (controlId: string, dir: ResizeDir, e: React.MouseEvent) => {
      if (e.button !== 0) return;

      e.stopPropagation();

      const store = useEditorStore.getState();
      const selectedIds = store.selectedControlIds;

      const canvasMouse = getCanvasMouse(e);
      if (!canvasMouse) return;

      if (selectedIds.length > 1 && selectedIds.includes(controlId)) {
        const bbox = computeGroupBBox(selectedIds);
        const snapshots: GroupResizeState['snapshots'] = [];
        for (const id of selectedIds) {
          const ctrl = getControlById(id);
          if (!ctrl) continue;
          const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);
          snapshots.push({
            id,
            pixelX: coords.x,
            pixelY: coords.y,
            pixelW: coords.w,
            pixelH: coords.h,
            exprX: ctrl.x,
            exprY: ctrl.y,
            exprW: ctrl.w,
            exprH: ctrl.h,
          });
        }
        groupResizeRef.current = {
          dir,
          startBBox: bbox,
          snapshots,
          offsetX: canvasMouse.x - bbox.x,
          offsetY: canvasMouse.y - bbox.y,
          canvasW,
          canvasH,
        };
        setIsResizing(true);
        return;
      }

      const ctrl = getControlById(controlId);
      if (!ctrl) return;

      const coords = controlToCanvasCoords(ctrl, gridSystem, gridVariant, canvasW, canvasH, previewUIScale);

      resizeStateRef.current = {
        controlId,
        dir,
        startPixelX: coords.x,
        startPixelY: coords.y,
        startPixelW: coords.w,
        startPixelH: coords.h,
        startExprX: ctrl.x,
        startExprY: ctrl.y,
        startExprW: ctrl.w,
        startExprH: ctrl.h,
        offsetX: canvasMouse.x - coords.x,
        offsetY: canvasMouse.y - coords.y,
      };
      setIsResizing(true);
    },
    [getControlById, getCanvasMouse, gridSystem, gridVariant, canvasW, canvasH, previewUIScale, computeGroupBBox]
  );

  // ===========================================================================
  // Ctrl+Scroll / Alt+Scroll zoom — cursor-centered (Photoshop-style)
  // ===========================================================================
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!e.ctrlKey && !e.altKey) return;
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const currentPan = panRef.current;

      const canvasX = (mx - currentPan.x) / zoom;
      const canvasY = (my - currentPan.y) / zoom;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const nextZoom = clampZoom(roundZoom(zoom + delta));
      const nextPanX = mx - canvasX * nextZoom;
      const nextPanY = my - canvasY * nextZoom;

      setCanvasView(nextZoom, nextPanX, nextPanY);
    },
    [zoom, clampZoom, roundZoom, setCanvasView]
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
      className="flex-1 overflow-hidden bg-surface-light rounded-lg m-2 relative outline-none"
      tabIndex={0}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => containerRef.current?.focus()}
      style={{
        cursor: isPanning ? 'grabbing' : isDragging ? 'grabbing' : isResizing ? 'crosshair' : pendingDrag ? 'grabbing' : 'grab',
      }}
    >
      <div ref={fullscreenRef} data-canvas-fullscreen="true" className="relative w-full h-full">
        <div
          ref={canvasInnerRef}
          data-canvas="true"
          className="relative shadow-2xl"
          onWheel={handleWheel}
          style={{
            width: canvasW,
            height: canvasH,
            minWidth: canvasW,
            minHeight: canvasH,
            transform: `translate3d(${canvasPanX}px, ${canvasPanY}px, 0) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
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
          {/* SafeZone exterior dimming & boundary */}
          <SafeZoneOverlay safeZone={safeZone} canvasW={canvasW} canvasH={canvasH} />

          {/* Grid overlay */}
          {showGrid && (
            <GridOverlay
              gridSystem={gridSystem}
              canvasW={canvasW}
              canvasH={canvasH}
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
              uiScale={previewUIScale}
              onMouseDownCapture={(e) => handleControlMouseDown(ctrl.id, e)}
            />
          ))}

          {/* Alignment guide overlay */}
          <AlignmentGuideOverlay guides={alignmentGuides} />

          {/* Selection overlay with resize handles */}
          <SelectionOverlay
            controls={visibleControls}
            selectedIds={selectedControlIds}
            gridSystem={gridSystem}
            gridVariant={gridVariant}
            canvasW={canvasW}
            canvasH={canvasH}
            uiScale={previewUIScale}
            onHandleMouseDown={handleResizeHandleMouseDown}
          />
        </div>
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

function findControlZone(
  dialog: import('../../types/controls').DialogConfig,
  controlId: string
): import('../../types/controls').ControlZone | null {
  for (const zone of ['controlsBackground', 'controls', 'objects'] as const) {
    if (dialog[zone].some(c => c.id === controlId)) return zone;
  }
  return null;
}

// =============================================================================
// SafeZoneOverlay — dims exterior areas and draws boundary
// =============================================================================
function SafeZoneOverlay({
  safeZone,
  canvasW,
  canvasH,
}: {
  safeZone: { x: number; y: number; w: number; h: number };
  canvasW: number;
  canvasH: number;
}) {
  const hasInset = safeZone.x > 0.001 || safeZone.y > 0.001;
  if (!hasInset) return null;

  const dimColor = 'rgba(0,0,0,0.4)';
  const sx = safeZone.x * canvasW;
  const sy = safeZone.y * canvasH;
  const sw = safeZone.w * canvasW;
  const sh = safeZone.h * canvasH;
  const cw = canvasW;
  const ch = canvasH;

  return (
    <>
      {/* Top strip */}
      {safeZone.y > 0.001 && (
        <div className="absolute pointer-events-none z-[1]" style={{ left: 0, top: 0, width: cw, height: sy, backgroundColor: dimColor }} />
      )}
      {/* Bottom strip */}
      {safeZone.y + safeZone.h < 0.999 && (
        <div className="absolute pointer-events-none z-[1]" style={{ left: 0, top: sy + sh, width: cw, height: ch - sy - sh, backgroundColor: dimColor }} />
      )}
      {/* Left strip */}
      {safeZone.x > 0.001 && (
        <div className="absolute pointer-events-none z-[1]" style={{ left: 0, top: sy, width: sx, height: sh, backgroundColor: dimColor }} />
      )}
      {/* Right strip */}
      {safeZone.x + safeZone.w < 0.999 && (
        <div className="absolute pointer-events-none z-[1]" style={{ left: sx + sw, top: sy, width: cw - sx - sw, height: sh, backgroundColor: dimColor }} />
      )}
      {/* Safe zone border */}
      <div
        className="absolute border-2 border-teal-500/60 pointer-events-none z-[2]"
        style={{ left: sx, top: sy, width: sw, height: sh }}
      />
      {/* Safe zone label */}
      <div
        className="absolute pointer-events-none z-[2]"
        style={{ left: sx + sw / 2, top: sy, transform: 'translate(-50%, -100%)' }}
      >
        <span className="px-2 py-0.5 text-[10px] text-teal-400 bg-[#0a0a1a] whitespace-nowrap rounded-t">
          SAFE ZONE
        </span>
      </div>
    </>
  );
}
