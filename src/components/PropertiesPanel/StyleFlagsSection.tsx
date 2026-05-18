// =============================================================================
// StyleFlagsSection — Bitwise style flag toggles in a visual checkbox grid
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import { getApplicableStyles, hasStyleFlag, styleFlagsToHex, hasObsoleteStyle } from '../../utils/styleUtils';

export const StyleFlagsSection: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    toggleStyleFlag,
    updateControl,
  } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  const styles = getApplicableStyles(ctrl.type);
  const obsolete = hasObsoleteStyle(ctrl.style);

  return (
    <CollapsibleSection title="Style Flags">
      <div className="space-y-2">
        <Field label="Combined Style">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-accent-cyan font-mono">
              {styleFlagsToHex(ctrl.style)}
            </code>
            <span className="text-[10px] text-gray-500">({ctrl.style})</span>
          </div>
        </Field>

        {obsolete && (
          <div className="text-[10px] text-yellow-400 bg-yellow-900/20 p-1 rounded">
            ⚠ Obsolete style: {obsolete.name} — causes .rpt spam
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 max-h-60 overflow-y-auto">
          {styles.map(sf => {
            const active = hasStyleFlag(ctrl.style, sf.flag);
            return (
              <label
                key={sf.flag}
                className={`flex items-center gap-1 text-[10px] p-1 rounded cursor-pointer hover:bg-white/5 ${
                  active ? 'text-accent-cyan' : 'text-gray-500'
                }`}
              >
                <input
                  type="checkbox"
                  className="w-3 h-3"
                  checked={active}
                  onChange={() => toggleStyleFlag(activeDialogId, ctrl.id, sf.flag)}
                />
                <span className="truncate" title={sf.description}>{sf.constant}</span>
              </label>
            );
          })}
        </div>

        {/* Conditional inputs based on active flags */}
        {hasStyleFlag(ctrl.style, 0x10) && (
          <Field label="Line Spacing (ST_MULTI required)">
            <input
              type="number"
              step="0.1"
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={ctrl.lineSpacing ?? 1.0}
              onChange={(e) => updateControl(activeDialogId, ctrl.id, { lineSpacing: parseFloat(e.target.value) })}
            />
          </Field>
        )}

        {hasStyleFlag(ctrl.style, 0x90) && (
          <>
            <Field label="Tile W (ST_TILE_PICTURE)">
              <input
                type="number"
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.tileW ?? 1}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { tileW: parseInt(e.target.value) })}
              />
            </Field>
            <Field label="Tile H (ST_TILE_PICTURE)">
              <input
                type="number"
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.tileH ?? 1}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { tileH: parseInt(e.target.value) })}
              />
            </Field>
          </>
        )}
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
