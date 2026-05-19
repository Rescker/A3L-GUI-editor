// =============================================================================
// PropertiesPanel — Right sidebar with all property editing sections
// Collapsible sections: Identity, Position, Style Flags, Appearance, Content,
// Behavior, Event Handlers.
// =============================================================================

import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { IdentitySection } from './IdentitySection';
import { PositionSection } from './PositionSection';
import { StyleFlagsSection } from './StyleFlagsSection';
import { AppearanceSection } from './AppearanceSection';
import { TypeSpecificSection } from './TypeSpecificSection';
import { EventHandlersSection } from './EventHandlersSection';
import { UIEHPicker } from './UIEHPicker';
import { UIEH_DEFINITIONS as uiehDefs } from '../../data/uiehDefinitions';
import { getEventCategories as getEvtCats } from '../../utils/styleUtils';

type Tab = 'properties' | 'events' | 'validation';

export const PropertiesPanel: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    uiehPickerOpen,
    setUiehPickerOpen,
    validationIssues,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<Tab>('properties');

  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const selectedControl = selectedControlIds.length === 1
    ? findControl(activeDialog, selectedControlIds[0])
    : null;

  const dialogIssues = validationIssues.filter(i =>
    i.dialogId === activeDialogId
  );

  return (
    <div className="w-80 bg-surface flex flex-col border-l border-white/5 h-full">
      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(['properties', 'events', 'validation'] as Tab[]).map(tab => (
          <button
            key={tab}
            className={`flex-1 text-xs py-2 font-medium uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-accent border-b-2 border-accent'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'properties' ? 'Properties' : tab === 'events' ? 'Events' : 'Issues'}
            {tab === 'validation' && dialogIssues.length > 0 && (
              <span className={`ml-1 px-1 rounded text-[10px] ${
                dialogIssues.some(i => i.severity === 'error') ? 'bg-red-600' : 'bg-yellow-600'
              }`}>
                {dialogIssues.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          selectedControl ? (
            <div className="p-2 space-y-1">
              <IdentitySection />
              <PositionSection />
              <StyleFlagsSection />
              <AppearanceSection />
              <TypeSpecificSection />
              <EventHandlersSection />
            </div>
          ) : activeDialog ? (
            <DialogProperties />
          ) : (
            <div className="p-4 text-center text-xs text-gray-500">
              Select a control to edit its properties.
            </div>
          )
        )}

        {activeTab === 'events' && (
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2">Available UI Event Handlers</div>
            <UIEHReferenceMini />
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="p-2">
            {dialogIssues.length === 0 ? (
              <div className="text-xs text-emerald-400">No issues found.</div>
            ) : (
              dialogIssues.map((issue, i) => (
                <div
                  key={i}
                  className={`text-xs p-2 mb-1 rounded ${
                    issue.severity === 'error' ? 'bg-red-900/30 border border-red-700/30 text-red-300' :
                    issue.severity === 'warning' ? 'bg-yellow-900/30 border border-yellow-700/30 text-yellow-300' :
                    'bg-blue-900/30 border border-blue-700/30 text-blue-300'
                  }`}
                >
                  <span className={`font-semibold uppercase text-[10px]`}>
                    {issue.severity}
                  </span>
                  <p className="mt-0.5">{issue.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* UIEH Picker Modal */}
      {uiehPickerOpen && <UIEHPicker />}
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
  return search([
    ...dialog.controlsBackground,
    ...dialog.controls,
    ...dialog.objects,
  ]);
}

// =============================================================================
// Dialog-level properties (when no control is selected)
// =============================================================================
function DialogProperties() {
  const { dialogs, activeDialogId, updateControl } = useEditorStore();
  const dialog = dialogs.find(d => d.id === activeDialogId);
  if (!dialog) return null;

  return (
    <div className="p-2 space-y-3">
      <CollapsibleSection title="Dialog Identity" defaultOpen>
        <div className="space-y-2">
          <Field label="Class Name">
            <input
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={dialog.className}
              onChange={(e) => {
                // Update dialog className
                const store = useEditorStore.getState();
                const newDialogs = store.dialogs.map(d =>
                  d.id === dialog.id ? { ...d, className: e.target.value } : d
                );
                useEditorStore.setState({ dialogs: newDialogs });
              }}
            />
          </Field>
          <Field label="IDD">
            <input
              type="number"
              className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
              value={dialog.idd}
              onChange={(e) => {
                useEditorStore.setState(s => ({
                  dialogs: s.dialogs.map(d =>
                    d.id === dialog.id ? { ...d, idd: parseInt(e.target.value) || -1 } : d
                  ),
                }));
              }}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={dialog.movingEnable}
              onChange={(e) => {
                useEditorStore.setState(s => ({
                  dialogs: s.dialogs.map(d =>
                    d.id === dialog.id ? { ...d, movingEnable: e.target.checked } : d
                  ),
                }));
              }}
            />
            movingEnable
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={dialog.enableSimulation}
              onChange={(e) => {
                useEditorStore.setState(s => ({
                  dialogs: s.dialogs.map(d =>
                    d.id === dialog.id ? { ...d, enableSimulation: e.target.checked } : d
                  ),
                }));
              }}
            />
            enableSimulation
          </label>
        </div>
      </CollapsibleSection>

      {dialog.containerType === 'hud' && (
        <CollapsibleSection title="HUD Settings">
          <div className="space-y-2">
            <Field label="Fade In (s)">
              <input type="number" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={dialog.fadeIn ?? 0}
                onChange={(e) => {
                  useEditorStore.setState(s => ({
                    dialogs: s.dialogs.map(d =>
                      d.id === dialog.id ? { ...d, fadeIn: parseFloat(e.target.value) } : d
                    ),
                  }));
                }}
              />
            </Field>
            <Field label="Fade Out (s)">
              <input type="number" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={dialog.fadeOut ?? 0}
                onChange={(e) => {
                  useEditorStore.setState(s => ({
                    dialogs: s.dialogs.map(d =>
                      d.id === dialog.id ? { ...d, fadeOut: parseFloat(e.target.value) } : d
                    ),
                  }));
                }}
              />
            </Field>
            <Field label="Duration (s)">
              <input type="text" className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white"
                value={String(dialog.duration ?? 1e11)}
                onChange={(e) => {
                  useEditorStore.setState(s => ({
                    dialogs: s.dialogs.map(d =>
                      d.id === dialog.id ? { ...d, duration: parseFloat(e.target.value) } : d
                    ),
                  }));
                }}
              />
            </Field>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// =============================================================================
// Reusable components
// =============================================================================
export function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-2 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-semibold uppercase tracking-wider text-gray-400"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="p-2">{children}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 uppercase font-semibold block mb-0.5">{label}</label>
      {children}
    </div>
  );
}

// =============================================================================
// Mini UIEH Reference for the Events tab
// =============================================================================
function UIEHReferenceMini() {
  const { selectedControlIds, dialogs, activeDialogId, updateControl } = useEditorStore();
  const activeDialog = dialogs.find(d => d.id === activeDialogId);
  const selectedControl = selectedControlIds.length === 1
    ? findControl(activeDialog, selectedControlIds[0])
    : null;

  const applicableCategories = selectedControl ? getEvtCats(selectedControl.type) : ['display', 'control'];

  const filteredEvents = uiehDefs.filter((def: { applicableTo: string[] }) =>
    def.applicableTo.some((cat: string) => applicableCategories.includes(cat))
  );

  return (
    <div className="space-y-1">
      {filteredEvents.map((def: { name: string; scriptName: string; description: string; paramSignature: string; applicableTo: string[]; example?: string }) => (
        <div key={def.name} className="text-xs p-2 bg-white/5 rounded border border-white/5 hover:border-accent/30 cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="font-mono text-accent-cyan">{def.name}</span>
            <span className="text-[10px] text-gray-500">{def.scriptName}</span>
          </div>
          <p className="text-gray-400 mt-0.5">{def.description}</p>
          <code className="text-[10px] text-gray-500 block mt-0.5">{def.paramSignature}</code>
          {def.example && (
            <code className="text-[10px] text-green-400/70 block mt-0.5 bg-black/30 p-1 rounded">{def.example}</code>
          )}
        </div>
      ))}
    </div>
  );
}
