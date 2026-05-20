// =============================================================================
// Toolbar — Top bar above the canvas with grid, resolution, zoom controls
// =============================================================================

import React, { useRef, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { GRID_SYSTEM_LABELS, GUI_GRID_VARIANTS, RESOLUTION_PRESETS, UI_SCALE_LABELS } from '../../data/gridVariants';
import { downloadProjectFile } from '../../utils/projectSerializer';
import type { GridSystem } from '../../types/controls';

export const Toolbar: React.FC = () => {
  const {
    gridSystem,
    gridVariant,
    showGrid,
    snapToGrid,
    showAlignmentGuides,
    snapToAlignment,
    previewResolution,
    previewUIScale,
    zoomLevel,
    componentLibraryOpen,
    history,
    historyIndex,
    setGridSystem,
    setGridVariant,
    setShowGrid,
    setSnapToGrid,
    setShowAlignmentGuides,
    setSnapToAlignment,
    setPreviewResolution,
    setPreviewUIScale,
    setZoomLevel,
    setImportModalOpen,
    setExportModalOpen,
    setComponentLibraryOpen,
    addDialog,
    undo,
    redo,
  } = useEditorStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProject = useCallback(() => {
    const json = useEditorStore.getState().exportProject();
    const firstDialog = useEditorStore.getState().dialogs[0];
    const filename = firstDialog
      ? `${firstDialog.className.replace(/[^a-zA-Z0-9_-]/g, '_')}-project.json`
      : 'gui-editor-project.json';
    downloadProjectFile(json, filename);
  }, []);

  const handleOpenProject = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        const success = useEditorStore.getState().importProject(text);
        if (!success) {
          alert('Failed to load project file. The file may be corrupted or in an unsupported format.');
        }
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be re-loaded
    e.target.value = '';
  }, []);

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

      <button
        className={`px-2 py-1 rounded text-[11px] transition-colors ${
          showAlignmentGuides ? 'bg-emerald-700/30 text-emerald-400' : 'bg-surface text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setShowAlignmentGuides(!showAlignmentGuides)}
        title="Toggle alignment guides"
      >
        Align
      </button>

      {showAlignmentGuides && (
        <button
          className={`px-2 py-1 rounded text-[11px] transition-colors ${
            snapToAlignment ? 'bg-emerald-700/30 text-emerald-400' : 'bg-surface text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => setSnapToAlignment(!snapToAlignment)}
          title="Toggle snap to alignment"
        >
          Snap Align
        </button>
      )}

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

      <div className="w-px h-4 bg-white/10" />

      {/* Undo / Redo */}
      <button
        className="px-2 py-1 rounded text-[11px] bg-surface text-gray-400 hover:text-white disabled:opacity-30"
        onClick={undo}
        disabled={historyIndex <= 0}
        title="Undo (Ctrl+Z)"
      >
        ↶
      </button>
      <button
        className="px-2 py-1 rounded text-[11px] bg-surface text-gray-400 hover:text-white disabled:opacity-30"
        onClick={redo}
        disabled={historyIndex >= history.length - 1}
        title="Redo (Ctrl+Y)"
      >
        ↷
      </button>

      <div className="flex-1" />

      {/* Components Toggle */}
      <button
        className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
          componentLibraryOpen
            ? 'bg-accent-purple/30 text-accent-purple'
            : 'bg-surface text-gray-500 hover:text-gray-300'
        }`}
        onClick={() => setComponentLibraryOpen(!componentLibraryOpen)}
        title="Toggle component library"
      >
        Components
      </button>

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

      <div className="w-px h-4 bg-white/10" />

      {/* Project Save / Load */}
      <button
        className="px-2 py-1 bg-surface hover:bg-surface-light rounded text-gray-300 text-[11px] font-medium"
        onClick={handleOpenProject}
        title="Open project file"
      >
        Open
      </button>
      <button
        className="px-2 py-1 bg-accent-purple/70 hover:bg-accent-purple rounded text-white text-[11px] font-medium"
        onClick={handleSaveProject}
        title="Save project file"
      >
        Save
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
