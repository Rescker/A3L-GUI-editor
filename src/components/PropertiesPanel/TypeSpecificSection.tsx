// =============================================================================
// TypeSpecificSection — Shows type-specific properties based on control type
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import type { ControlConfig, ColorRGBA, SoundEntry } from '../../types/controls';

export const TypeSpecificSection: React.FC = () => {
  const { dialogs, activeDialogId, selectedControlIds, updateControl } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  const hasSounds =
    ctrl.type === 1 || ctrl.type === 16 || ctrl.type === 41 ||
    ctrl.type === 77 || ctrl.type === 11 ||
    ctrl.type === 4 || ctrl.type === 5 || ctrl.type === 102;

  const hasExtraColors =
    ctrl.type === 77 || ctrl.type === 1 || ctrl.type === 16;

  const hasButtonProps = ctrl.type === 1;
  const hasCheckboxTextures = ctrl.type === 77;
  const hasPeriod = ctrl.type === 16;
  const hasListProps = ctrl.type === 4 || ctrl.type === 5 || ctrl.type === 102;

  if (!hasSounds && !hasExtraColors && !hasButtonProps && !hasCheckboxTextures && !hasPeriod && !hasListProps) {
    return null;
  }

  return (
    <CollapsibleSection title="Type-Specific">
      <div className="space-y-2">
        {hasCheckboxTextures && (
          <>
            <Field label="Texture Checked">
              <input
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                value={ctrl.textureChecked ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { textureChecked: e.target.value || undefined })}
              />
            </Field>
            <Field label="Texture Unchecked">
              <input
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                value={ctrl.textureUnchecked ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { textureUnchecked: e.target.value || undefined })}
              />
            </Field>
            <Field label="Blinking Period">
              <input
                type="number"
                step="0.01"
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.blinkingPeriod ?? 0}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { blinkingPeriod: parseFloat(e.target.value) || undefined })}
              />
            </Field>
          </>
        )}

        {hasButtonProps && (
          <>
            <Field label="Offset X">
              <input type="number" step="0.001" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.offsetX ?? ''}
                placeholder="0.003"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { offsetX: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Offset Y">
              <input type="number" step="0.001" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.offsetY ?? ''}
                placeholder="0.003"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { offsetY: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Border Size">
              <input type="number" step="0.001" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.borderSize ?? ''}
                placeholder="0.0"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { borderSize: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Action">
              <input
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white font-mono"
                value={ctrl.action ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { action: e.target.value || undefined })}
              />
            </Field>
          </>
        )}

        {hasPeriod && (
          <>
            <Field label="Period">
              <input type="number" step="0.01" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.period ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { period: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Period Focus">
              <input type="number" step="0.01" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.periodFocus ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { periodFocus: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Period Over">
              <input type="number" step="0.01" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.periodOver ?? ''}
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { periodOver: parseFloat(e.target.value) || undefined })}
              />
            </Field>
          </>
        )}

        {hasListProps && (
          <>
            <Field label="Row Height">
              <input type="number" step="0.001" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.rowHeight ?? ''}
                placeholder="0.04"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { rowHeight: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Whole Height">
              <input type="number" step="0.01" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.wholeHeight ?? ''}
                placeholder="0.45"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { wholeHeight: parseFloat(e.target.value) || undefined })}
              />
            </Field>
            <Field label="Max History Delay">
              <input type="number" step="0.01" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={ctrl.maxHistoryDelay ?? ''}
                placeholder="1"
                onChange={(e) => updateControl(activeDialogId, ctrl.id, { maxHistoryDelay: parseFloat(e.target.value) || undefined })}
              />
            </Field>
          </>
        )}

        {hasExtraColors && (
          <>
            <Field label="Color Hover (RGBA)">
              <ColorEditor color={ctrl.colorHover} onChange={(c) => updateControl(activeDialogId, ctrl.id, { colorHover: c })} />
            </Field>
            <Field label="Color Pressed (RGBA)">
              <ColorEditor color={ctrl.colorPressed} onChange={(c) => updateControl(activeDialogId, ctrl.id, { colorPressed: c })} />
            </Field>
            <Field label="Bg Hover (RGBA)">
              <ColorEditor color={ctrl.colorBackgroundHover} onChange={(c) => updateControl(activeDialogId, ctrl.id, { colorBackgroundHover: c })} />
            </Field>
            <Field label="Bg Pressed (RGBA)">
              <ColorEditor color={ctrl.colorBackgroundPressed} onChange={(c) => updateControl(activeDialogId, ctrl.id, { colorBackgroundPressed: c })} />
            </Field>
            <Field label="Bg Disabled (RGBA)">
              <ColorEditor color={ctrl.colorBackgroundDisabled} onChange={(c) => updateControl(activeDialogId, ctrl.id, { colorBackgroundDisabled: c })} />
            </Field>
          </>
        )}

        {hasSounds && (
          <>
            <Field label="Sound Click">
              <SoundEditor sound={ctrl.soundClick} onChange={(s) => updateControl(activeDialogId, ctrl.id, { soundClick: s })} />
            </Field>
            <Field label="Sound Enter">
              <SoundEditor sound={ctrl.soundEnter} onChange={(s) => updateControl(activeDialogId, ctrl.id, { soundEnter: s })} />
            </Field>
            <Field label="Sound Push">
              <SoundEditor sound={ctrl.soundPush} onChange={(s) => updateControl(activeDialogId, ctrl.id, { soundPush: s })} />
            </Field>
            <Field label="Sound Escape">
              <SoundEditor sound={ctrl.soundEscape} onChange={(s) => updateControl(activeDialogId, ctrl.id, { soundEscape: s })} />
            </Field>
          </>
        )}
      </div>
    </CollapsibleSection>
  );
};

// =============================================================================
// Color Editor (compact)
// =============================================================================
function ColorEditor({ color, onChange }: { color?: ColorRGBA; onChange: (c: ColorRGBA | undefined) => void }) {
  const vals = color ?? [1, 1, 1, 1];
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        className="w-6 h-6 rounded cursor-pointer border border-white/10"
        value={rgbaToHex(vals)}
        onChange={(e) => {
          onChange(hexToRgba(e.target.value, vals[3]));
        }}
      />
      <div className="flex-1 grid grid-cols-4 gap-1">
        {vals.map((v, i) => (
          <input
            key={i}
            type="number"
            min="0" max="1" step="0.01"
            className="w-full bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white text-center"
            value={v}
            onChange={(e) => {
              const newColor = [...vals] as ColorRGBA;
              newColor[i] = Math.min(1, Math.max(0, parseFloat(e.target.value) || 0));
              onChange(newColor);
            }}
          />
        ))}
      </div>
      <button
        className="text-[9px] text-gray-500 hover:text-red-400"
        onClick={() => onChange(undefined)}
        title="Remove color"
      >
        ✕
      </button>
    </div>
  );
}

// =============================================================================
// Sound Editor
// =============================================================================
function SoundEditor({ sound, onChange }: { sound?: SoundEntry; onChange: (s: SoundEntry | undefined) => void }) {
  if (!sound) {
    return (
      <button
        className="text-[10px] text-accent-cyan hover:underline"
        onClick={() => onChange(['', 0.09, 1])}
      >
        + Add sound
      </button>
    );
  }
  return (
    <div className="space-y-1">
      <input
        className="w-full bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"
        value={sound[0]}
        placeholder="Sound path..."
        onChange={(e) => onChange([e.target.value, sound[1], sound[2]])}
      />
      <div className="flex gap-1">
        <input
          type="number" step="0.01" min="0" max="1"
          className="w-16 bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"
          value={sound[1]}
          title="Volume"
          onChange={(e) => onChange([sound[0], parseFloat(e.target.value) || 0, sound[2]])}
        />
        <input
          type="number" step="0.01"
          className="w-12 bg-surface-light border border-white/10 rounded px-1 py-0.5 text-[10px] text-white"
          value={sound[2]}
          title="Pitch"
          onChange={(e) => onChange([sound[0], sound[1], parseFloat(e.target.value) || 1])}
        />
        <button
          className="text-[9px] text-gray-500 hover:text-red-400 ml-1"
          onClick={() => onChange(undefined)}
          title="Remove sound"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================
function findControl(dialog: import('../../types/controls').DialogConfig | undefined, controlId: string): ControlConfig | null {
  if (!dialog) return null;
  const search = (controls: ControlConfig[]): ControlConfig | null => {
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

function rgbaToHex([r, g, b]: ColorRGBA): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number): ColorRGBA {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [Math.round(r * 100) / 100, Math.round(g * 100) / 100, Math.round(b * 100) / 100, alpha];
}
