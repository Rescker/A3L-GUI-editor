// =============================================================================
// TabBar — Photoshop-style project tabs above the canvas
// Shows all open dialogs/displays/HUDs as tabs. Click to switch active dialog.
// Middle-click or scroll-down to close tabs (like a browser).
// Always visible — shows create prompt when no dialogs exist.
// =============================================================================

import React, { useCallback, useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { downloadProjectFile } from '../../utils/projectSerializer';
import type { UIContainerType } from '../../types/controls';

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  dialog: { label: 'D', color: 'bg-purple-600' },
  display: { label: 'P', color: 'bg-blue-600' },
  hud: { label: 'H', color: 'bg-emerald-600' },
};

function dialogHasControls(dialogId: string): boolean {
  const state = useEditorStore.getState();
  const dialog = state.dialogs.find(d => d.id === dialogId);
  if (!dialog) return false;
  return (
    dialog.controlsBackground.length > 0 ||
    dialog.controls.length > 0 ||
    dialog.objects.length > 0
  );
}

export const TabBar: React.FC = () => {
  const { dialogs, activeDialogId, setActiveDialog, removeDialog, addDialog } = useEditorStore();
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; dialogId: string } | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  const handleCreate = useCallback((type: UIContainerType) => {
    addDialog(type);
    setShowNewMenu(false);
  }, [addDialog]);

  const handleTabContext = useCallback((e: React.MouseEvent, dialogId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, dialogId });
  }, []);

  const toggleNewMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowNewMenu(prev => !prev);
  }, []);

  const closeNewMenu = useCallback(() => {
    setShowNewMenu(false);
  }, []);

  const handleCloseRequest = useCallback((dialogId: string) => {
    if (dialogHasControls(dialogId)) {
      setCloseConfirm(dialogId);
    } else {
      removeDialog(dialogId);
    }
  }, [removeDialog]);

  const handleConfirmClose = useCallback((dialogId: string) => {
    removeDialog(dialogId);
    setCloseConfirm(null);
  }, [removeDialog]);

  const handleSave = useCallback((dialogId: string) => {
    const store = useEditorStore.getState();
    const dialog = store.dialogs.find(d => d.id === dialogId);
    const name = dialog?.className ?? 'project';
    const json = store.exportProject();
    downloadProjectFile(json, `${name}.a3l.json`);
    setCloseConfirm(null);
  }, []);

  const handleCancelClose = useCallback(() => {
    setCloseConfirm(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent, dialogId: string) => {
    if (e.deltaY > 0) {
      e.preventDefault();
      e.stopPropagation();
      handleCloseRequest(dialogId);
    }
  }, [handleCloseRequest]);

  const handleMiddleClick = useCallback((e: React.MouseEvent, dialogId: string) => {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      handleCloseRequest(dialogId);
    }
  }, [handleCloseRequest]);

  const closeDialog = closeConfirm ? dialogs.find(d => d.id === closeConfirm) : null;

  return (
    <>
      <div className="h-9 bg-surface-light border-b border-white/5 flex items-center shrink-0 overflow-visible">
        {/* Tabs container */}
        <div className="flex items-center h-full min-w-0 flex-1">
          {dialogs.length === 0 ? (
            <div className="flex items-center gap-2 px-3 h-full text-xs text-gray-500">
              <span className="text-gray-400">No projects open.</span>
              <button
                className="px-2 py-0.5 bg-accent-blue hover:bg-accent-blue/80 rounded text-white text-[10px] font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  addDialog('dialog');
                }}
              >
                + New Dialog
              </button>
              <span className="text-gray-600">or click</span>
              <button
                ref={plusBtnRef}
                className="w-6 h-5 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-sm font-bold"
                onClick={toggleNewMenu}
                onMouseDown={(e) => e.preventDefault()}
              >
                +
              </button>
            </div>
          ) : (
            <>
              {dialogs.map(dialog => {
                const isActive = dialog.id === activeDialogId;
                const badge = TYPE_BADGES[dialog.containerType] ?? TYPE_BADGES.dialog;
                return (
                  <div
                    key={dialog.id}
                    className={`flex items-center h-full px-3 gap-1.5 cursor-pointer text-xs border-r border-white/5 shrink-0 transition-colors ${
                      isActive
                        ? 'bg-surface border-b-2 border-b-accent-cyan text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                    onClick={() => setActiveDialog(dialog.id)}
                    onContextMenu={(e) => handleTabContext(e, dialog.id)}
                    onWheel={(e) => handleWheel(e, dialog.id)}
                    onMouseDown={(e) => handleMiddleClick(e, dialog.id)}
                    title={`${dialog.className} (IDD: ${dialog.idd}) — Scroll down or middle-click to close`}
                  >
                    <span className={`text-[10px] px-1 py-0 rounded-sm font-bold uppercase text-white ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span className="truncate max-w-[140px]">{dialog.className}</span>
                    <button
                      className="ml-1 w-4 h-4 flex items-center justify-center rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseRequest(dialog.id);
                      }}
                      title="Close"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
              {/* + New Tab — inline after the last project tab */}
              <button
                ref={plusBtnRef}
                className="h-6 w-6 ml-1 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white text-sm font-bold shrink-0 transition-colors self-center"
                onClick={toggleNewMenu}
                onMouseDown={(e) => e.preventDefault()}
                title="New Dialog / Display / HUD"
              >
                +
              </button>
            </>
          )}
        </div>
      </div>

      {/* New dialog dropdown — rendered at top level to avoid overflow clipping */}
      {showNewMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={closeNewMenu} />
          <div
            className="fixed z-40 bg-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[130px]"
            style={{
              top: plusBtnRef.current ? plusBtnRef.current.getBoundingClientRect().bottom + 4 : 100,
              left: plusBtnRef.current ? plusBtnRef.current.getBoundingClientRect().left : 16,
            }}
          >
            <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">New</div>
            <button
              className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 flex items-center gap-2"
              onClick={() => handleCreate('dialog')}
            >
              <span className="text-[10px] px-1 py-0 rounded-sm font-bold text-white bg-purple-600">D</span>
              Dialog
            </button>
            <button
              className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 flex items-center gap-2"
              onClick={() => handleCreate('display')}
            >
              <span className="text-[10px] px-1 py-0 rounded-sm font-bold text-white bg-blue-600">P</span>
              Display
            </button>
            <button
              className="w-full text-left px-3 py-1 text-xs hover:bg-white/10 flex items-center gap-2"
              onClick={() => handleCreate('hud')}
            >
              <span className="text-[10px] px-1 py-0 rounded-sm font-bold text-white bg-emerald-600">H</span>
              HUD
            </button>
          </div>
        </>
      )}

      {/* Tab right-click context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-surface border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-2 py-0.5 text-[10px] text-gray-500 uppercase">Project</div>
            <button
              className="w-full text-left px-3 py-1 text-xs hover:bg-white/10"
              onClick={() => {
                handleCloseRequest(contextMenu.dialogId);
                setContextMenu(null);
              }}
            >
              🗑 Close
            </button>
          </div>
        </>
      )}

      {/* Close confirmation modal */}
      {closeConfirm && closeDialog && (
        <>
          <div className="fixed inset-0 z-50" onClick={handleCancelClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-surface border border-white/10 rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 pointer-events-auto">
              <h3 className="text-lg font-semibold text-white mb-2">
                Close &ldquo;{closeDialog.className}&rdquo;?
              </h3>
              <p className="text-sm text-gray-300 mb-6">
                This project has controls. Closing will discard unsaved work.
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-700/30 rounded-lg text-sm text-red-300 font-medium transition-colors"
                  onClick={() => handleConfirmClose(closeConfirm)}
                >
                  Yes, close
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 font-medium transition-colors"
                  onClick={handleCancelClose}
                >
                  No, keep open
                </button>
                <button
                  className="flex-1 px-4 py-2.5 bg-accent-purple/70 hover:bg-accent-purple border border-accent-purple/30 rounded-lg text-sm text-white font-medium transition-colors"
                  onClick={() => handleSave(closeConfirm)}
                >
                  Save project
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
