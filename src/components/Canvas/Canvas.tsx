// =============================================================================
// Canvas — Main preview canvas for the dialog UI
// Renders controls scaled to match Arma 3 screen layout.
// =============================================================================

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { controlToCanvasCoords, computeSafeZone } from '../../utils/gridUtils';
import { ControlRenderer } from './ControlRenderer';
import { SelectionOverlay } from './SelectionOverlay';
import { GridOverlay } from './GridOverlay';
import type { ControlConfig, ControlZone } from '../../types/controls';

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
    addControl,
    setCursorGridPos,
    setZoomLevel,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragCtrlId, setDragCtrlId] = useState<string | null>(null);

  const activeDialog = dialogs.find(d => d.id === activeDialogId);

  const canvasW = previewResolution.w;
  const canvasH = previewResolution.h;
  const scale = zoomLevel;
  const safeZone = computeSafeZone(canvasW, canvasH, previewUIScale);

  // Get all controls to render based on editing context
  const visibleControls = getVisibleControls(activeDialog, editingControlId);

  // Auto-fit zoom to make dialog content fill ~80% of viewport
  useEffect(() => {
    if (!activeDialog || !containerRef.current) return;
    const allControls = [...activeDialog.controlsBackground, ...activeDialog.controls];
    if (allControls.length === 0) return;

    // Find bounding box of all controls in this dialog
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

  // Handle canvas click for selection / deselection
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).dataset.canvas === 'true') {
      if (!e.ctrlKey) {
        clearSelection();
      }
    }
  }, [clearSelection]);

  // Handle keyboard — use useRef to avoid stale closures
  const selectedIdsRef = useRef(selectedControlIds);
  const activeDialogRef = useRef(activeDialogId);
  selectedIdsRef.current = selectedControlIds;
  activeDialogRef.current = activeDialogId;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = selectedIdsRef.current;
        const dialogId = activeDialogRef.current;
        if (ids.length > 0 && dialogId) {
          // Don't delete if user is actually typing inside an input/textarea
          const tag = document.activeElement?.tagName;
          const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
          if (isInput) return;
          e.preventDefault();
          for (const id of ids) {
            removeControl(dialogId, id);
          }
        }
      }
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [removeControl, clearSelection]);

  // Mouse move handler for cursor position
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Convert to grid units for status bar
    const gridX = (x / canvasW * 40).toFixed(1);
    const gridY = (y / canvasH * 25).toFixed(1);
    setCursorGridPos(gridX, gridY);
  }, [canvasW, canvasH, scale, setCursorGridPos]);

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
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div
        data-canvas="true"
        className="relative mx-auto shadow-2xl"
        style={{
          width: canvasW * scale,
          height: canvasH * scale,
          minWidth: canvasW * scale,
          minHeight: canvasH * scale,
          backgroundColor: '#0a0a1a',
          backgroundImage: 'linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)',
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
            onSelect={(multi) => selectControl(ctrl.id, multi)}
            onMove={(x, y) => moveControl(activeDialog.id, ctrl.id, x, y)}
            onResize={(w, h) => resizeControl(activeDialog.id, ctrl.id, w, h)}
          />
        ))}

        {/* Selection highlight */}
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
        />
      </div>
    </div>
  );
};

function getVisibleControls(
  dialog: import('../../types/controls').DialogConfig | undefined,
  editingControlId: string | null
): ControlConfig[] {
  if (!dialog) return [];

  // If editing inside a controls group, show only its children
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

    const groupChildren = findGroup(dialog.controls) ?? findGroup(dialog.controlsBackground) ?? findGroup(dialog.objects);
    if (groupChildren) return groupChildren;
  }

  return [
    ...dialog.controlsBackground,
    ...dialog.controls,
    ...dialog.objects,
  ];
}
