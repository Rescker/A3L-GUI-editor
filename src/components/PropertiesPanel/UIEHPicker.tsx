// =============================================================================
// UIEHPicker — Modal dialog for selecting UI event handlers
// Groups events by category, filtered by applicable control type.
// =============================================================================

import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { UIEH_DEFINITIONS } from '../../data/uiehDefinitions';
import { getEventCategories } from '../../utils/styleUtils';
import type { EventHandlerConfig, UIEHDefinition } from '../../types/controls';

export const UIEHPicker: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    updateControl,
    setUiehPickerOpen,
  } = useEditorStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;

  const applicableCategories = ctrl
    ? getEventCategories(ctrl.type)
    : ['display', 'control', 'button', 'listbox', 'tree', 'checkbox', 'misc', 'combo', 'slider'];

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const def of UIEH_DEFINITIONS) {
      for (const cat of def.applicableTo) {
        cats.add(cat);
      }
    }
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredEvents = useMemo(() => {
    return UIEH_DEFINITIONS.filter(def => {
      // Must be applicable to this control type
      if (!def.applicableTo.some(cat => applicableCategories.includes(cat))) return false;
      // Category filter
      if (selectedCategory !== 'all' && !def.applicableTo.includes(selectedCategory as 'display')) return false;
      // Search filter
      if (search && !def.name.toLowerCase().includes(search.toLowerCase()) && !def.description.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [applicableCategories, selectedCategory, search]);

  const handleAdd = (def: UIEHDefinition) => {
    if (!ctrl || !activeDialogId) return;
    const handler: EventHandlerConfig = {
      id: `eh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      event: def.name,
      code: def.example ?? `// ${def.paramSignature}\n`,
    };
    updateControl(activeDialogId, ctrl.id, {
      eventHandlers: [...ctrl.eventHandlers, handler],
    });
    setUiehPickerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={() => setUiehPickerOpen(false)} />
      <div className="relative bg-surface border border-white/10 rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Add Event Handler</h3>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setUiehPickerOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="p-2 flex gap-2 border-b border-white/5">
          <input
            className="flex-1 bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredEvents.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">No events match your filters.</div>
          ) : (
            filteredEvents.map((def) => (
              <button
                key={def.name}
                className="w-full text-left p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                onClick={() => handleAdd(def)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-accent-cyan">{def.name}</span>
                  <span className="text-[10px] text-gray-500">
                    Script: <code className="text-green-400/70">{def.scriptName}</code>
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">{def.description}</p>
                <code className="text-[10px] text-gray-500 block mt-0.5">{def.paramSignature}</code>
                {def.returnDescription && (
                  <p className="text-[10px] text-yellow-400/70 mt-0.5">Returns: {def.returnDescription}</p>
                )}
                {def.example && (
                  <pre className="text-[10px] text-green-400/60 mt-1 bg-black/30 p-1 rounded overflow-x-auto">{def.example}</pre>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
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
