// =============================================================================
// HierarchyPanel — Left sidebar tree view of dialogs and controls
// Supports drag reorder, reparenting, right-click context menus.
// =============================================================================

import React, { useCallback, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { ControlConfig, ControlZone, UIContainerType } from '../../types/controls';
import { CONTROL_TYPES } from '../../data/controlDefaults';
import { getControlTypeInfo } from '../../data/controlDefaults';

export const HierarchyPanel: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    selectedControlIds,
    editingControlId,
    setActiveDialog,
    addControl,
    removeControl,
    removeDialog,
    selectControl,
    clearSelection,
    updateControl,
    addDialog,
    addControlFromTemplate,
    copyControls,
    moveControlUp,
    moveControlDown,
    swapControlOrder,
    setExportSelectedOnly,
    setExportModalOpen,
  } = useEditorStore();

  type ContextTarget =
    | { type: 'control'; controlId: string; dialogId: string }
    | { type: 'dialog'; dialogId: string }
    | { type: 'empty' };

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; target: ContextTarget } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, controlId: string) => {
    e.dataTransfer.setData('text/plain', controlId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, controlId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(controlId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== targetId && activeDialogId) {
      swapControlOrder(activeDialogId, draggedId, targetId);
    }
  }, [activeDialogId, swapControlOrder]);

  const activeDialog = dialogs.find(d => d.id === activeDialogId);

  const handleRightClick = useCallback((e: React.MouseEvent, target: ContextTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, target });
  }, []);

  const containerTypeBadge = (type: UIContainerType) => {
    const colors: Record<string, string> = {
      dialog: 'bg-purple-600',
      display: 'bg-blue-600',
      hud: 'bg-emerald-600',
    };
    const labels: Record<string, string> = {
      dialog: 'Dialog',
      display: 'Display',
      hud: 'HUD',
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${colors[type]}`}>
        {labels[type]}
      </span>
    );
  };

  const controlIcon = (type: number) => {
    const icons: Record<number, string> = {
      0: 'T', 1: '▣', 2: '✎', 3: '≡', 4: '▾', 5: '☰',
      6: '◈', 7: '☑', 8: '▬', 9: '◉', 11: '↗',
      12: '🌳', 13: '¶', 14: '☰', 15: '⊞', 16: '▣',
      41: '▣', 43: '≡', 44: '▾', 45: '☰',
      77: '☑', 80: '⬡', 81: '🔍', 82: '⬡', 83: '⬡',
      100: '◫', 101: '◫', 102: '☰',
    };
    return icons[type] ?? '?';
  };

  const renderZone = (controls: ControlConfig[], zone: ControlZone, dialogId: string) => {
    if (controls.length === 0) return null;
    return (
      <div className="ml-3">
        <div className="text-[11px] text-gray-500 font-semibold uppercase py-1 px-1">
          {zone === 'controlsBackground' ? 'Background' : zone === 'controls' ? 'Controls' : 'Objects'}
        </div>
        {controls.map((ctrl) => renderControlNode(ctrl, dialogId, zone))}
      </div>
    );
  };

  const renderControlNode = (ctrl: ControlConfig, dialogId: string, zone?: ControlZone) => {
    const isSelected = selectedControlIds.includes(ctrl.id);
    const typeInfo = getControlTypeInfo(ctrl.type);
    const showChildren = ctrl.type === 15 && ctrl.children && ctrl.children.length > 0;

    return (
      <div key={ctrl.id}>
        <div
          className={`flex items-center gap-1 px-1 py-0.5 ml-2 text-xs rounded cursor-pointer group hover:bg-white/5 ${
            isSelected ? 'bg-accent/20 border border-accent/40' : 'border border-transparent'
          } ${dragOverId === ctrl.id ? 'bg-accent-cyan/30 border border-accent-cyan/60' : ''}`}
          draggable="true"
          onDragStart={(e) => handleDragStart(e, ctrl.id)}
          onDragOver={(e) => handleDragOver(e, ctrl.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, ctrl.id)}
          onClick={(e) => {
            e.stopPropagation();
            selectControl(ctrl.id, e.ctrlKey || e.metaKey);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (ctrl.type === 15 && showChildren) {
              // Enter group editing mode
              // Toggle expand state
              setExpandedGroups(prev => {
                const next = new Set(prev);
                if (next.has(ctrl.id)) next.delete(ctrl.id); else next.add(ctrl.id);
                return next;
              });
            }
          }}
          onContextMenu={(e) => handleRightClick(e, { type: 'control', controlId: ctrl.id, dialogId })}
        >
          <span className="text-[10px] w-4 text-center opacity-70">{controlIcon(ctrl.type)}</span>
          <span className="truncate flex-1 font-mono">{ctrl.className}</span>
          <span className="text-[10px] text-gray-500">IDC:{ctrl.idc}</span>
          {showChildren && (
            <span className="text-[10px] text-gray-500">
              {expandedGroups.has(ctrl.id) ? '▾' : '▸'}
            </span>
          )}
        </div>
        {showChildren && expandedGroups.has(ctrl.id) && (
          <div className="ml-4 border-l border-white/10 pl-1">
            {ctrl.children!.map(child => renderControlNode(child, dialogId))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-60 bg-surface flex flex-col border-r border-white/5 h-full">
      <div className="p-2 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hierarchy</span>
        {selectedControlIds.length > 0 && activeDialogId && (
          <button
            className="text-[10px] px-2 py-0.5 bg-accent-cyan/20 text-accent-cyan rounded hover:bg-accent-cyan/30 transition-colors"
            title={`Export ${selectedControlIds.length} selected control(s)`}
            onClick={() => {
              setExportSelectedOnly(true);
              setExportModalOpen(true);
            }}
          >
            ⬇ Export {selectedControlIds.length > 1 ? `(${selectedControlIds.length})` : ''}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!activeDialog ? (
          <div
            className="p-4 text-center text-xs text-gray-500"
            onContextMenu={(e) => handleRightClick(e, { type: 'empty' })}
          >
            No dialog open. Create one via the + tab above.
          </div>
        ) : (
          <div>
            {/* Active dialog header */}
            <div
              className="flex items-center gap-1 px-2 py-1.5 text-xs border-b border-white/5 bg-surface-light"
              onContextMenu={(e) => handleRightClick(e, { type: 'dialog', dialogId: activeDialog.id })}
            >
              {containerTypeBadge(activeDialog.containerType)}
              <span className="truncate flex-1 font-medium">{activeDialog.className}</span>
              <span className="text-[10px] text-gray-500">IDD:{activeDialog.idd}</span>
            </div>

            {/* Zones */}
            {renderZone(activeDialog.controlsBackground, 'controlsBackground', activeDialog.id)}
            {renderZone(activeDialog.controls, 'controls', activeDialog.id)}
            {renderZone(activeDialog.objects, 'objects', activeDialog.id)}

            {/* Show empty state when dialog has no controls */}
            {activeDialog.controlsBackground.length === 0 &&
              activeDialog.controls.length === 0 &&
              activeDialog.objects.length === 0 && (
              <div
                className="p-4 text-center text-xs text-gray-500"
                onContextMenu={(e) => handleRightClick(e, { type: 'dialog', dialogId: activeDialog.id })}
              >
                Right-click here or on the header to add controls.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        (() => {
          const t = contextMenu.target;
          return (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setContextMenu(null)}
              />
              <div
                className="fixed z-50 bg-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                {t.type === 'control' && (
                  <>
                    <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">Control Actions</div>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        const store = useEditorStore.getState();
                        const dialog = store.dialogs.find(d => d.id === t.dialogId);
                        if (!dialog) { setContextMenu(null); return; }
                        const found = findControlWithZone(dialog, t.controlId);
                        if (found) {
                          const clone = structuredClone(found.control);
                          // Offset position slightly to avoid overlap
                          const xExpr = offsetExpression(found.control.x, 1);
                          const yExpr = offsetExpression(found.control.y, 1);
                          clone.x = xExpr;
                          clone.y = yExpr;
                          addControlFromTemplate(t.dialogId, clone, found.zone);
                        }
                        setContextMenu(null);
                      }}
                    >
                      ✂ Duplicate
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        setExportSelectedOnly(true);
                        setExportModalOpen(true);
                        setContextMenu(null);
                      }}
                    >
                      📦 Export Selected{selectedControlIds.length > 1 ? ` (${selectedControlIds.length})` : ''}
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        const store = useEditorStore.getState();
                        const dialog = store.dialogs.find(d => d.id === t.dialogId);
                        if (!dialog) { setContextMenu(null); return; }
                        const found = findControlWithZone(dialog, t.controlId);
                        if (found) {
                          copyControls([found.control], found.zone);
                        }
                        setContextMenu(null);
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        const store = useEditorStore.getState();
                        if (store.clipboard.length === 0) { setContextMenu(null); return; }
                        const zone = store.clipboardSourceZone ?? 'controls';
                        for (const copy of store.clipboard) {
                          const clone = structuredClone(copy);
                          const xExpr = offsetExpression(copy.x, 1);
                          const yExpr = offsetExpression(copy.y, 1);
                          clone.x = xExpr;
                          clone.y = yExpr;
                          addControlFromTemplate(t.dialogId, clone, zone);
                        }
                        setContextMenu(null);
                      }}
                    >
                      📄 Paste
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        moveControlUp(t.dialogId, t.controlId);
                        setContextMenu(null);
                      }}
                    >
                      ↑ Move Up
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        moveControlDown(t.dialogId, t.controlId);
                        setContextMenu(null);
                      }}
                    >
                      ↓ Move Down
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 text-red-400"
                      onClick={() => {
                        removeControl(t.dialogId, t.controlId);
                        setContextMenu(null);
                      }}
                    >
                      🗑 Delete
                    </button>
                    <div className="border-t border-white/10 my-1" />
                    <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">Add Control</div>
                    {CONTROL_TYPES.slice(0, 12).map(ct => (
                      <button
                        key={ct.type}
                        className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                        onClick={() => {
                          addControl(t.dialogId, ct.type, 'controls');
                          setContextMenu(null);
                        }}
                      >
                        {controlIcon(ct.type)} {ct.label}
                      </button>
                    ))}
                    <div className="border-t border-white/10 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 text-red-400"
                      onClick={() => {
                        removeDialog(t.dialogId);
                        setContextMenu(null);
                      }}
                    >
                      🗑 Delete Dialog
                    </button>
                  </>
                )}

                {t.type === 'dialog' && (
                  <>
                    <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">Dialog Actions</div>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        addControl(t.dialogId, 0, 'controls');
                        setContextMenu(null);
                      }}
                    >
                      + Add Static Text
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        addControl(t.dialogId, 1, 'controls');
                        setContextMenu(null);
                      }}
                    >
                      + Add Button
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        const store = useEditorStore.getState();
                        if (store.clipboard.length === 0) { setContextMenu(null); return; }
                        const zone = store.clipboardSourceZone ?? 'controls';
                        for (const copy of store.clipboard) {
                          const clone = structuredClone(copy);
                          const xExpr = offsetExpression(copy.x, 1);
                          const yExpr = offsetExpression(copy.y, 1);
                          clone.x = xExpr;
                          clone.y = yExpr;
                          addControlFromTemplate(t.dialogId, clone, zone);
                        }
                        setContextMenu(null);
                      }}
                    >
                      📄 Paste
                    </button>
                    {selectedControlIds.length > 0 && (
                      <>
                        <button
                          className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                          onClick={() => {
                            setExportSelectedOnly(true);
                            setExportModalOpen(true);
                            setContextMenu(null);
                          }}
                        >
                          📦 Export Selected ({selectedControlIds.length})
                        </button>
                      </>
                    )}
                    <div className="border-t border-white/10 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 text-red-400"
                      onClick={() => {
                        removeDialog(t.dialogId);
                        setContextMenu(null);
                      }}
                    >
                      🗑 Delete Dialog
                    </button>
                  </>
                )}

                {t.type === 'empty' && (
                  <>
                    <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">Create</div>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => { addDialog('dialog'); setContextMenu(null); }}
                    >
                      + New Dialog
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => { addDialog('display'); setContextMenu(null); }}
                    >
                      + New Display
                    </button>
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => { addDialog('hud'); setContextMenu(null); }}
                    >
                      + New HUD
                    </button>
                    <div className="border-t border-white/5 my-1" />
                    <button
                      className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
                      onClick={() => {
                        const store = useEditorStore.getState();
                        const targetDialogId = store.activeDialogId;
                        if (!targetDialogId || store.clipboard.length === 0) { setContextMenu(null); return; }
                        const zone = store.clipboardSourceZone ?? 'controls';
                        for (const copy of store.clipboard) {
                          const clone = structuredClone(copy);
                          const xExpr = offsetExpression(copy.x, 1);
                          const yExpr = offsetExpression(copy.y, 1);
                          clone.x = xExpr;
                          clone.y = yExpr;
                          addControlFromTemplate(targetDialogId, clone, zone);
                        }
                        setContextMenu(null);
                      }}
                    >
                      📄 Paste
                    </button>
                  </>
                )}
              </div>
            </>
          );
        })()
      )}
    </div>
  );
};

// =============================================================================
// Helpers
// =============================================================================
function findControlWithZone(
  dialog: import('../../types/controls').DialogConfig,
  controlId: string
): { zone: import('../../types/controls').ControlZone; control: import('../../types/controls').ControlConfig } | null {
  for (const zone of ['controlsBackground', 'controls', 'objects'] as import('../../types/controls').ControlZone[]) {
    for (const ctrl of dialog[zone]) {
      if (ctrl.id === controlId) return { zone, control: ctrl };
      if (ctrl.children) {
        const found = findInChildren(ctrl.children, controlId);
        if (found) return { zone, control: found };
      }
    }
  }
  return null;
}

function findInChildren(children: import('../../types/controls').ControlConfig[], controlId: string): import('../../types/controls').ControlConfig | null {
  for (const ctrl of children) {
    if (ctrl.id === controlId) return ctrl;
    if (ctrl.children) {
      const found = findInChildren(ctrl.children, controlId);
      if (found) return found;
    }
  }
  return null;
}

function offsetExpression(expr: string | number, delta: number): string | number {
  if (typeof expr === 'number') return expr + delta;
  const trimmed = expr.trim();
  const numMatch = trimmed.match(/^([\d.-]+)\s*(\s*[+\-*/]\s*.+)$/);
  if (numMatch) {
    const baseVal = parseFloat(numMatch[1]);
    const rest = numMatch[2];
    if (!isNaN(baseVal)) return `${Math.round((baseVal + delta) * 10000) / 10000}${rest}`;
  }
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return Math.round((num + delta) * 10000) / 10000;
  return expr;
}
