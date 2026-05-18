// =============================================================================
// ImportExportModal — Import and export modals with Monaco-like text editor
// =============================================================================

import React, { useState, useRef, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';

export const ImportExportModal: React.FC = () => {
  const {
    importModalOpen,
    exportModalOpen,
    activeDialogId,
    exportFormat,
    setImportModalOpen,
    setExportModalOpen,
    setExportFormat,
    importData,
    exportData,
  } = useEditorStore();

  if (!importModalOpen && !exportModalOpen) return null;

  // =============================================================================
  // Import Modal
  // =============================================================================
  if (importModalOpen) {
    return <ImportModal onClose={() => setImportModalOpen(false)} onImport={importData} />;
  }

  // =============================================================================
  // Export Modal
  // =============================================================================
  const output = activeDialogId ? exportData(activeDialogId) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => setExportModalOpen(false)} />
      <div className="relative bg-surface border border-white/10 rounded-lg shadow-2xl w-[800px] max-h-[85vh] flex flex-col">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Export Config</h3>
          <button className="text-gray-400 hover:text-white" onClick={() => setExportModalOpen(false)}>✕</button>
        </div>

        <div className="p-3 border-b border-white/5 flex items-center gap-2">
          <span className="text-xs text-gray-400">Format:</span>
          {(['full_dialog', 'hud', 'class', 'editor_format'] as const).map(f => (
            <button
              key={f}
              className={`px-2 py-1 rounded text-[11px] transition-colors ${
                exportFormat === f ? 'bg-accent text-white' : 'bg-surface-light text-gray-400 hover:text-white'
              }`}
              onClick={() => setExportFormat(f)}
            >
              {f === 'full_dialog' ? 'Dialog' : f === 'hud' ? 'RscTitles' : f === 'class' ? 'Classes' : 'Editor'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-3">
          <pre className="text-[12px] text-green-300 font-mono bg-black/40 p-3 rounded-lg whitespace-pre-wrap break-all max-h-[55vh] overflow-auto">
            {output || 'No dialog selected.'}
          </pre>
        </div>

        <div className="p-3 border-t border-white/5 flex justify-end gap-2">
          <button
            className="px-3 py-1 bg-surface-light rounded text-xs text-gray-400 hover:text-white"
            onClick={() => setExportModalOpen(false)}
          >
            Close
          </button>
          <button
            className="px-3 py-1 bg-accent-blue rounded text-xs text-white hover:bg-accent-blue/80"
            onClick={() => {
              if (output) {
                navigator.clipboard.writeText(output);
              }
            }}
          >
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Import Modal — standalone component
// =============================================================================
function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (raw: string) => void }) {
  const [text, setText] = useState('');

  const handleImport = useCallback(() => {
    if (text.trim()) {
      onImport(text);
    }
  }, [text, onImport]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface border border-white/10 rounded-lg shadow-2xl w-[700px] max-h-[85vh] flex flex-col">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Import Config</h3>
          <button className="text-gray-400 hover:text-white" onClick={onClose}>✕</button>
        </div>

        <div className="p-2 border-b border-white/5">
          <p className="text-[10px] text-gray-500">
            Paste config.cpp / description.ext content or editor $[...] format.
            Supports: class inheritance, color arrays, SQF expressions.
          </p>
        </div>

        <div className="flex-1 p-3">
          <textarea
            className="w-full h-[400px] bg-black/40 border border-white/10 rounded-lg p-3 text-[12px] text-green-300 font-mono resize-none focus:outline-none focus:border-accent-cyan"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`// Paste Arma 3 config here...\nclass MyDialog\n{\n  idd = -1;\n  // ...\n};`}
            spellCheck={false}
          />
        </div>

        <div className="p-3 border-t border-white/5 flex justify-end gap-2">
          <button
            className="px-3 py-1 bg-surface-light rounded text-xs text-gray-400 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-emerald-700 rounded text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
            onClick={handleImport}
            disabled={!text.trim()}
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
