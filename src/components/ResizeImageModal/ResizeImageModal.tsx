import React, { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { pixelToGridExpr } from '../../utils/gridUtils';
import type { ControlConfig, DialogConfig } from '../../types/controls';

interface ResizeImageModalProps {
  onClose: () => void;
}

export const ResizeImageModal: React.FC<ResizeImageModalProps> = ({ onClose }) => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    updateControl,
    gridSystem,
    gridVariant,
    previewResolution,
    previewUIScale,
  } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  const imageDataUrl = ctrl?.imageDataUrl;

  const POW_TWO = [64, 128, 256, 512, 1024, 2048];

  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [targetW, setTargetW] = useState(0);
  const [targetH, setTargetH] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageDataUrl) return;
    const img = new Image();
    img.onload = () => {
      setNaturalW(img.width);
      setNaturalH(img.height);
      setTargetW(img.width);
      setTargetH(img.height);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  const handlePreview = () => {
    if (!imageDataUrl || !isValid) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, targetW, targetH);
      setPreviewUrl(canvas.toDataURL('image/png'));
    };
    img.src = imageDataUrl;
  };

  const handleApply = () => {
    if (!imageDataUrl || !activeDialogId || !ctrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const newDataUrl = canvas.toDataURL('image/png');

      const expr = pixelToGridExpr(0, 0, targetW, targetH, gridSystem, gridVariant, previewResolution.w, previewResolution.h, previewUIScale);
      updateControl(activeDialogId, ctrl.id, {
        imageDataUrl: newDataUrl,
        w: expr.w,
        h: expr.h,
      });
      onClose();
    };
    img.src = imageDataUrl;
  };

  if (!ctrl || !imageDataUrl) return null;

  const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0;
  const isValid = isPow2(targetW) && isPow2(targetH) && targetW >= 4 && targetH >= 4 && targetW <= 4096 && targetH <= 4096;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-surface border border-white/10 rounded-xl shadow-2xl w-[420px] max-h-[85vh] flex flex-col overflow-hidden z-10">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-200">Resize Image</h2>
          <button className="text-gray-500 hover:text-white text-lg leading-none" onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-3 text-xs text-gray-300">
          <div className="text-gray-400">
            Current: <span className="text-white font-mono">{naturalW} × {naturalH}</span>
          </div>

          <div className="flex gap-2">
            <label className="flex-1">
              <div className="text-gray-400 mb-1">Width</div>
              <select
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={targetW}
                onChange={(e) => { setTargetW(parseInt(e.target.value)); setPreviewUrl(null); }}
              >
                {POW_TWO.map(d => (
                  <option key={d} value={d}>{d}px</option>
                ))}
              </select>
            </label>
            <label className="flex-1">
              <div className="text-gray-400 mb-1">Height</div>
              <select
                className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={targetH}
                onChange={(e) => { setTargetH(parseInt(e.target.value)); setPreviewUrl(null); }}
              >
                {POW_TWO.map(d => (
                  <option key={d} value={d}>{d}px</option>
                ))}
              </select>
            </label>
          </div>

          {!isValid && (
            <p className="text-red-400 text-[10px]">
              Both dimensions must be power of 2 (64, 128, 256, 512, 1024, 2048).
            </p>
          )}

          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 bg-accent-blue hover:bg-accent-blue/80 rounded text-xs text-white disabled:opacity-50"
              onClick={handlePreview}
              disabled={!isValid}
            >
              Preview
            </button>
          </div>

          {previewUrl && (
            <div className="flex justify-center border border-white/10 rounded p-2 bg-black/20">
              <img src={previewUrl} alt="Resized preview" className="max-w-full max-h-48 object-contain" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-white/10">
          <button
            className="px-3 py-1.5 bg-surface-light hover:bg-white/10 rounded text-xs text-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-xs text-white disabled:opacity-50"
            onClick={handleApply}
            disabled={!isValid}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

function findControl(dialog: DialogConfig | undefined, controlId: string): ControlConfig | null {
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
