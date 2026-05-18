// =============================================================================
// Toolbar — Top bar above the canvas with grid, resolution, zoom controls
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { GRID_SYSTEM_LABELS, GUI_GRID_VARIANTS, RESOLUTION_PRESETS, UI_SCALE_LABELS } from '../../data/gridVariants';
import type { GridSystem } from '../../types/controls';

export const Toolbar: React.FC = () => {
  const {
    gridSystem,
    gridVariant,
    showGrid,
    snapToGrid,
    previewResolution,
    previewUIScale,
    zoomLevel,
    importModalOpen,
    exportModalOpen,
    setGridSystem,
    setGridVariant,
    setShowGrid,
    setSnapToGrid,
    setPreviewResolution,
    setPreviewUIScale,
    setZoomLevel,
    setImportModalOpen,
    setExportModalOpen,
    addDialog,
  } = useEditorStore();

  return (
    <div className="h-10 bg-surface-light border-b border-white/5 flex items-center px-2 gap-1.5 text-xs shrink-0">
      {/* Grid System */}
      <select
        className="bg-surface border border-white/10 rounded px-1.5 py-1 text-[11px] text-gray-300"
        value={gridSystem}
        onChange={(e) => setGridSystem(e.target.value as GridSystem)}
      >
        {Object.entries(GRID_SYSTEM_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      {/* Grid Variant (GUI_GRID only) */}
      {gridSystem === 'gui_grid' && (
        <select
          className="bg-surface border border-white/10 rounded px-1.5 py-1 text-[11px] text-gray-300"
          value={gridVariant}
          onChange={(e) => setGridVariant(e.target.value)}
        >
          {GUI_GRID_VARIANTS.map(v => (
            <option key={v.name} value={v.name}>{v.label}</option>
          ))}
        </select>
      )}

      <div className="w-px h-4 bg-white/10" />

      {/* Resolution */}
      <select
        className="bg-surface border border-white/10 rounded px-1.5 py-1 text-[11px] text-gray-300"
        value={`${previewResolution.w}x${previewResolution.h}`}
        onChange={(e) => {
          const [w, h] = e.target.value.split('x').map(Number);
          setPreviewResolution({ w, h });
        }}
      >
        {RESOLUTION_PRESETS.map(r => (
          <option key={r.label} value={`${r.w}x${r.h}`}>{r.label}</option>
        ))}
      </select>

      {/* UI Scale */}
      <select
        className="bg-surface border border-white/10 rounded px-1.5 py-1 text-[11px] text-gray-300"
        value={previewUIScale}
        onChange={(e) => setPreviewUIScale(e.target.value)}
      >
        {Object.entries(UI_SCALE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <div className="w-px h-4 bg-white/10" />

      {/* Toggles */}
      <button
        className={`px-2 py-1 rounded text-[11px] transition-colors ${
          showGrid ? 'bg-accent-blue/30 text-accent-cyan' : 'bg-surface text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setShowGrid(!showGrid)}
        title="Toggle grid overlay"
      >
        Grid
      </button>

      <button
        className={`px-2 py-1 rounded text-[11px] transition-colors ${
          snapToGrid ? 'bg-accent-blue/30 text-accent-cyan' : 'bg-surface text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setSnapToGrid(!snapToGrid)}
        title="Toggle snap to grid"
      >
        Snap
      </button>

      <div className="w-px h-4 bg-white/10" />

      {/* Zoom */}
      <button
        className="px-1.5 py-0.5 bg-surface rounded text-gray-400 hover:text-white text-[11px]"
        onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))}
        title="Zoom out"
      >
        −
      </button>
      <span className="text-[11px] text-gray-400 w-10 text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        className="px-1.5 py-0.5 bg-surface rounded text-gray-400 hover:text-white text-[11px]"
        onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
        title="Zoom in"
      >
        +
      </button>
      <button
        className="px-1.5 py-0.5 bg-surface rounded text-gray-400 hover:text-white text-[11px]"
        onClick={() => setZoomLevel(0.5)}
        title="Reset zoom"
      >
        Fit
      </button>

      <div className="flex-1" />

      {/* Import / Export */}
      <button
        className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-white text-[11px] font-medium"
        onClick={() => setImportModalOpen(true)}
      >
        Import
      </button>
      <button
        className="px-2 py-1 bg-accent-blue hover:bg-accent-blue/80 rounded text-white text-[11px] font-medium"
        onClick={() => setExportModalOpen(true)}
      >
        Export
      </button>
    </div>
  );
};
