// =============================================================================
// App — Root component with three-panel layout
// =============================================================================

import React from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { TabBar } from './components/TabBar/TabBar';
import { Canvas } from './components/Canvas/Canvas';
import { HierarchyPanel } from './components/HierarchyPanel/HierarchyPanel';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { ImportExportModal } from './components/ImportExportModal/ImportExportModal';
import { ComponentLibrary } from './components/ComponentLibrary/ComponentLibrary';
import { useEditorStore } from './store/editorStore';

const App: React.FC = () => {
  const { cursorGridX, cursorGridY, zoomLevel, selectedControlIds, activeDialogId, dialogs, gridSystem } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const selectedControl = selectedControlIds.length === 1
    ? findControlInDialog(activeDialog, selectedControlIds[0])
    : null;

  return (
    <div className="h-screen w-screen flex flex-col bg-surface overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Project Tabs (Photoshop-style) */}
      <TabBar />

      {/* Main content: three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Library (conditional) */}
        <ComponentLibrary />

        {/* Left: Hierarchy */}
        <HierarchyPanel />

        {/* Center: Canvas */}
        <Canvas />

        {/* Right: Properties */}
        <PropertiesPanel />
      </div>

      {/* Status Bar */}
      <StatusBar
        cursorGridX={cursorGridX}
        cursorGridY={cursorGridY}
        zoomLevel={zoomLevel}
        selectedControl={selectedControl}
        gridSystem={gridSystem}
        dialogCount={dialogs.length}
      />

      {/* Modals */}
      <ImportExportModal />
    </div>
  );
};

// =============================================================================
// Status Bar
// =============================================================================
function StatusBar({
  cursorGridX,
  cursorGridY,
  zoomLevel,
  selectedControl,
  gridSystem,
  dialogCount,
}: {
  cursorGridX: string;
  cursorGridY: string;
  zoomLevel: number;
  selectedControl: import('./types/controls').ControlConfig | null;
  gridSystem: string;
  dialogCount: number;
}) {
  return (
    <div className="h-6 bg-surface-light border-t border-white/5 flex items-center px-3 text-[10px] text-gray-500 gap-4 shrink-0">
      <span>
        Grid: <span className="text-gray-400">{gridSystem}</span>
      </span>
      <span>
        Pos: <span className="text-gray-400">{cursorGridX}, {cursorGridY}</span>
      </span>
      <span>
        Zoom: <span className="text-gray-400">{Math.round(zoomLevel * 100)}%</span>
      </span>
      {selectedControl && (
        <span>
          Selected: <span className="text-accent-cyan">{selectedControl.className}</span>
          <span className="text-gray-600 ml-1">(IDC: {selectedControl.idc}, Type: CT_{selectedControl.type})</span>
        </span>
      )}
      <div className="flex-1" />
      <span>Dialogs: <span className="text-gray-400">{dialogCount}</span></span>
    </div>
  );
}

// =============================================================================
// Helper
// =============================================================================
function findControlInDialog(
  dialog: import('./types/controls').DialogConfig | undefined,
  controlId: string
): import('./types/controls').ControlConfig | null {
  if (!dialog) return null;
  const search = (controls: import('./types/controls').ControlConfig[]): import('./types/controls').ControlConfig | null => {
    for (const c of controls) {
      if (c.id === controlId) return c;
      if (c.children) {
        const f = search(c.children);
        if (f) return f;
      }
    }
    return null;
  };
  return search([...dialog.controlsBackground, ...dialog.controls, ...dialog.objects]);
}

export default App;
