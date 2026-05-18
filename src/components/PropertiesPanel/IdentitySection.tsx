// =============================================================================
// IdentitySection — Control identity properties (IDC, type, parent class)
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import { CONTROL_TYPES, getControlTypesByCategory } from '../../data/controlDefaults';
import type { ControlType } from '../../types/controls';

export const IdentitySection: React.FC = () => {
  const { dialogs, activeDialogId, selectedControlIds, updateControl } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  const typeCategories = getControlTypesByCategory();

  return (
    <CollapsibleSection title="Identity" defaultOpen>
      <div className="space-y-2">
        <Field label="IDC">
          <div className="flex gap-1">
            <input
              type="number"
              className="flex-1 bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={ctrl.idc}
              onChange={(e) => updateControl(activeDialogId, ctrl.id, { idc: parseInt(e.target.value) || -1 })}
            />
          </div>
          {ctrl.idc >= 1 && ctrl.idc <= 7 && ctrl.type !== 1 && (
            <p className="text-[10px] text-yellow-400 mt-0.5">
              ⚠ IDC {ctrl.idc} is reserved (IDC_OK=1, IDC_CANCEL=2, etc.)
            </p>
          )}
        </Field>

        <Field label="Type">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.type}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { type: parseInt(e.target.value) as ControlType })}
          >
            {Object.entries(typeCategories).map(([cat, types]) => (
              <optgroup key={cat} label={cat.toUpperCase()}>
                {types.map(t => (
                  <option key={t.type} value={t.type}>
                    {t.constantName} — {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Parent Class">
          <input
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
            value={ctrl.parentClass}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { parentClass: e.target.value })}
          />
        </Field>

        <Field label="Class Name">
          <input
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
            value={ctrl.className}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { className: e.target.value })}
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
