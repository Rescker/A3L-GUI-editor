// =============================================================================
// AppearanceSection — Font, colors, shadow, text, tooltip
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import { FONT_LIST } from '../../data/fontList';

export const AppearanceSection: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    updateControl,
  } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  return (
    <CollapsibleSection title="Appearance">
      <div className="space-y-2">
        <Field label="Font">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.font}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { font: e.target.value })}
          >
            {FONT_LIST.map(f => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Text Color (RGBA)">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded cursor-pointer border border-white/10"
              value={rgbaToHex(ctrl.colorText)}
              onChange={(e) => {
                const rgba = hexToRgba(e.target.value, ctrl.colorText[3]);
                updateControl(activeDialogId, ctrl.id, { colorText: rgba });
              }}
            />
            <div className="flex-1 grid grid-cols-4 gap-1">
              {ctrl.colorText.map((v, i) => (
                <input
                  key={i}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white text-center"
                  value={v}
                  onChange={(e) => {
                    const newColor = [...ctrl.colorText] as [number, number, number, number];
                    newColor[i] = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
                    updateControl(activeDialogId, ctrl.id, { colorText: newColor });
                  }}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field label="Background Color (RGBA)">
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="w-8 h-8 rounded cursor-pointer border border-white/10"
              value={rgbaToHex(ctrl.colorBackground)}
              onChange={(e) => {
                const rgba = hexToRgba(e.target.value, ctrl.colorBackground[3]);
                updateControl(activeDialogId, ctrl.id, { colorBackground: rgba });
              }}
            />
            <div className="flex-1 grid grid-cols-4 gap-1">
              {ctrl.colorBackground.map((v, i) => (
                <input
                  key={i}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="w-full bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white text-center"
                  value={v}
                  onChange={(e) => {
                    const newColor = [...ctrl.colorBackground] as [number, number, number, number];
                    newColor[i] = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
                    updateControl(activeDialogId, ctrl.id, { colorBackground: newColor });
                  }}
                />
              ))}
            </div>
          </div>
        </Field>

        <Field label="Shadow">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.shadow}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { shadow: parseInt(e.target.value) as 0 | 1 | 2 })}
          >
            <option value={0}>0 — None</option>
            <option value={1}>1 — Soft Drop Shadow</option>
            <option value={2}>2 — Stroke</option>
          </select>
        </Field>

        <Field label="Text Content">
          <textarea
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white resize-none h-16 font-mono"
            value={ctrl.text}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { text: e.target.value })}
          />
        </Field>

        <Field label="Tooltip">
          <input
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.tooltip}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { tooltip: e.target.value })}
          />
        </Field>

        <Field label="URL">
          <input
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.url ?? ''}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { url: e.target.value || undefined })}
          />
        </Field>

        <Field label="Overlay Mode">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.overlayMode ?? 0}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { overlayMode: parseInt(e.target.value) as 0 | 1 | 2 })}
          >
            <option value={0}>0 — Default</option>
            <option value={1}>1 — Steam Overlay Preferred</option>
            <option value={2}>2 — Steam Overlay Required</option>
          </select>
        </Field>

        <Field label="Fade">
          <input
            type="number"
            step="0.01"
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.fade ?? 0}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { fade: parseFloat(e.target.value) })}
          />
        </Field>

        <Field label="Access">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.access ?? 0}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { access: parseInt(e.target.value) as 0 | 1 | 2 | 3 })}
          >
            <option value={0}>0 — Read & Write</option>
            <option value={1}>1 — Read & Create</option>
            <option value={2}>2 — Read Only</option>
            <option value={3}>3 — Read Only (Verified)</option>
          </select>
        </Field>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={ctrl.moving}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { moving: e.target.checked })}
          />
          Moving
        </label>

        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={ctrl.canDrag ?? false}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { canDrag: e.target.checked })}
          />
          Can Drag
        </label>

        <Field label="Deletable">
          <select
            className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={ctrl.deletable ?? 0}
            onChange={(e) => updateControl(activeDialogId, ctrl.id, { deletable: parseInt(e.target.value) as 0 | 1 })}
          >
            <option value={0}>0 — Default</option>
            <option value={1}>1 — Deletable</option>
          </select>
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

function rgbaToHex([r, g, b]: [number, number, number, number]): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [roundFloat(r), roundFloat(g), roundFloat(b), alpha];
}

function roundFloat(v: number): number {
  return Math.round(v * 100) / 100;
}
