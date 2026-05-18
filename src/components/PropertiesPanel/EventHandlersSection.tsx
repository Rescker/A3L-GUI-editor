// =============================================================================
// EventHandlersSection — Per-control event handler list
// =============================================================================

import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { CollapsibleSection, Field } from './PropertiesPanel';
import { UIEH_DEFINITIONS } from '../../data/uiehDefinitions';
import { getEventCategories } from '../../utils/styleUtils';
import type { EventHandlerConfig } from '../../types/controls';

export const EventHandlersSection: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    updateControl,
    setUiehPickerOpen,
  } = useEditorStore();

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const ctrl = selectedControlIds.length === 1 ? findControl(activeDialog, selectedControlIds[0]) : null;
  if (!ctrl || !activeDialogId) return null;

  const applicableCategories = getEventCategories(ctrl.type)
    .filter((c: string) => c !== 'display') // display events only for dialogs
    .filter((c: string) => c !== 'control'); // filter duplicates

  const addHandler = (eventName: string) => {
    const def = UIEH_DEFINITIONS.find(d => d.name === eventName);
    const newHandler: EventHandlerConfig = {
      id: `eh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      event: eventName,
      code: def ? `// ${def.paramSignature}\n` : '',
    };
    updateControl(activeDialogId, ctrl.id, {
      eventHandlers: [...ctrl.eventHandlers, newHandler],
    });
  };

  const removeHandler = (handlerId: string) => {
    updateControl(activeDialogId, ctrl.id, {
      eventHandlers: ctrl.eventHandlers.filter(h => h.id !== handlerId),
    });
  };

  const updateHandlerCode = (handlerId: string, code: string) => {
    updateControl(activeDialogId, ctrl.id, {
      eventHandlers: ctrl.eventHandlers.map(h =>
        h.id === handlerId ? { ...h, code } : h
      ),
    });
  };

  return (
    <CollapsibleSection title="Event Handlers">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-500">
            {ctrl.eventHandlers.length} handler{ctrl.eventHandlers.length !== 1 ? 's' : ''}
          </span>
          <button
            className="text-[10px] px-2 py-0.5 bg-accent-blue rounded hover:bg-accent-blue/80"
            onClick={() => setUiehPickerOpen(true)}
          >
            + Add Handler
          </button>
        </div>

        <div className="text-[9px] text-yellow-400/70 bg-yellow-900/10 p-1 rounded">
          When using ctrlAddEventHandler, omit the "on" prefix (e.g. "ButtonClick" not "onButtonClick").
        </div>

        {ctrl.eventHandlers.map((handler) => {
          const def = UIEH_DEFINITIONS.find(d => d.name === handler.event);
          return (
            <div key={handler.id} className="border border-white/10 rounded overflow-hidden">
              <div className="flex items-center justify-between bg-white/5 px-2 py-1">
                <div>
                  <span className="text-xs font-mono text-accent-cyan">{handler.event}</span>
                  {def && (
                    <span className="text-[9px] text-gray-500 ml-2">{def.paramSignature}</span>
                  )}
                </div>
                <button
                  className="text-[10px] text-red-400 hover:text-red-300"
                  onClick={() => removeHandler(handler.id)}
                >
                  ✕
                </button>
              </div>
              <div className="p-1">
                <textarea
                  className="w-full bg-surface-light border border-white/5 rounded px-2 py-1 text-[11px] text-green-300 font-mono resize-none h-20"
                  value={handler.code}
                  onChange={(e) => updateHandlerCode(handler.id, e.target.value)}
                  placeholder="// SQF code here..."
                  spellCheck={false}
                />
              </div>
            </div>
          );
        })}
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
