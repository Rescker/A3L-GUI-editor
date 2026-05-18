// =============================================================================
// PositionSection — Grid system, coordinates, and size properties
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import { GRID_SYSTEM_LABELS, GUI_GRID_VARIANTS, UI_SCALE_LABELS } from '../../data/gridVariants';
import type { GridSystem } from '../../types/controls';

export const PositionSection: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    gridSystem,
    gridVariant,
    updateControl,
    setGridSystem,
    setGridVariant,
  } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  return (
    <CollapsibleSection title="Position & Size" defaultOpen>
      <div className="space-y-2">
        <Field label="Grid System">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={gridSystem}
            onChange={(e) => setGridSystem(e.target.value as GridSystem)}
          >
            {Object.entries(GRID_SYSTEM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </Field>

        {gridSystem === 'gui_grid' && (
          <Field label="Grid Variant">
            <select
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={gridVariant}
              onChange={(e) => setGridVariant(e.target.value)}
            >
              {GUI_GRID_VARIANTS.map(v => (
                <option key={v.name} value={v.name}>{v.label}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-1">
          <Field label="X">
            <input
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
              value={typeof ctrl.x === 'number' ? ctrl.x : ctrl.x}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                updateControl(activeDialogId, ctrl.id, { x: isNaN(num) ? val : num });
              }}
            />
          </Field>
          <Field label="Y">
            <input
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
              value={typeof ctrl.y === 'number' ? ctrl.y : ctrl.y}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                updateControl(activeDialogId, ctrl.id, { y: isNaN(num) ? val : num });
              }}
            />
          </Field>
          <Field label="W">
            <input
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
              value={typeof ctrl.w === 'number' ? ctrl.w : ctrl.w}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                updateControl(activeDialogId, ctrl.id, { w: isNaN(num) ? val : num });
              }}
            />
          </Field>
          <Field label="H">
            <input
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
              value={typeof ctrl.h === 'number' ? ctrl.h : ctrl.h}
              onChange={(e) => {
                const val = e.target.value;
                const num = parseFloat(val);
                updateControl(activeDialogId, ctrl.id, { h: isNaN(num) ? val : num });
              }}
            />
          </Field>
        </div>

        <Field label="Font Size (sizeEx)">
          <input
            type="number"
            step="0.1"
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.sizeEx}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { sizeEx: parseFloat(e.target.value) || 4 })}
          />
        </Field>
      </div>
    </CollapsibleSection>
  );
};

function findControl(dialog: import('../../types/controls').DialogConfig | undefined, controlId: string): import('../../types/controls').ControlConfig | null {
  if (!dialog) return null;
  const search = (controls: import('../../types/controls').ControlConfig[]): import('../../types/controls').ControlConfig | null => {
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
