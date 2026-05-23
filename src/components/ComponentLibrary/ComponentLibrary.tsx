// =============================================================================
// ComponentLibrary — Left-side panel for browsing and inserting Life_Rsc presets
// =============================================================================

import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  ARMA_PRESETS,
  LIFE_PRESETS,
  getPresetsByCategory,
  getCategoryOrder,
  type ComponentPreset,
  type ComponentCategory,
} from '../../data/componentLibrary';

const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  'Checkboxes': '☑',
  'Scrollbars': '↕',
  'Control Groups': '⊞',
  'HUD / Text': 'T',
  'Lists & Selection': '≡',
  'Buttons': '▣',
  'Visuals & Inputs': '◉',
  'Advanced / Specialized': '⚙',
};

export const ComponentLibrary: React.FC = () => {
  const {
    dialogs,
    activeDialogId,
    componentLibraryOpen,
    setComponentLibraryOpen,
    addControlFromPreset,
  } = useEditorStore();

  const [expandedCategory, setExpandedCategory] = useState<string | null>('Buttons');
  const [searchQuery, setSearchQuery] = useState('');
  const [presetSource, setPresetSource] = useState<'all' | 'arma' | 'life'>('all');

  const presetsByCategory = presetSource === 'all'
    ? getPresetsByCategory()
    : getPresetsByCategory(presetSource);
  const categories = getCategoryOrder();

  const filteredPresets = searchQuery
    ? (presetSource === 'all'
        ? [...ARMA_PRESETS, ...LIFE_PRESETS]
        : presetSource === 'arma' ? ARMA_PRESETS : LIFE_PRESETS
      ).filter(
        p =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  if (!componentLibraryOpen) return null;

  const hasActiveDialog = dialogs.some(d => d.id === activeDialogId);

  const handleInsert = (presetId: string) => {
    if (!activeDialogId) return;
    addControlFromPreset(activeDialogId, presetId, 'controls');
  };

  return (
    <div className="w-72 bg-surface border-r border-white/5 h-full flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
          Components
        </span>
        <button
          className="text-gray-500 hover:text-white text-xs"
          onClick={() => setComponentLibraryOpen(false)}
          title="Close component library"
        >
          ✕
        </button>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5">
        <input
          type="text"
          className="w-full bg-surface-light border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Source tabs */}
      <div className="flex px-2 pb-1.5 gap-1">
        {(['all', 'arma', 'life'] as const).map(src => (
          <button
            key={src}
            className={`flex-1 text-[10px] font-medium uppercase tracking-wider rounded py-1 transition-colors ${
              presetSource === src
                ? 'bg-accent-blue/30 text-accent-cyan'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => setPresetSource(src)}
          >
            {src === 'all' ? 'All' : src === 'arma' ? 'Arma' : 'Life'}
          </button>
        ))}
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto">
        {!hasActiveDialog && (
          <div className="p-3 text-xs text-gray-500 text-center">
            Open or create a dialog first.
          </div>
        )}

        {hasActiveDialog && filteredPresets && (
          <div className="p-1">
            {filteredPresets.map(preset => (
              <ComponentCard
                key={preset.id}
                preset={preset}
                onInsert={() => handleInsert(preset.id)}
              />
            ))}
            {filteredPresets.length === 0 && (
              <div className="p-3 text-xs text-gray-500 text-center">
                No components found.
              </div>
            )}
          </div>
        )}

        {hasActiveDialog && !filteredPresets && categories.map(cat => {
          const presets = presetsByCategory[cat] || [];
          if (presets.length === 0) return null;
          const isExpanded = expandedCategory === cat;

          return (
            <div key={cat}>
              <button
                className="w-full flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-400 uppercase tracking-wider"
                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
              >
                <span>{CATEGORY_ICONS[cat] || '•'}</span>
                <span>{cat}</span>
                <span className="ml-auto text-gray-600 text-[10px]">{presets.length}</span>
                <span className="text-gray-600">{isExpanded ? '▾' : '▸'}</span>
              </button>
              {isExpanded && (
                <div className="p-1">
                  {presets.map(preset => (
                    <ComponentCard
                      key={preset.id}
                      preset={preset}
                      onInsert={() => handleInsert(preset.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =============================================================================
// Component Card
// =============================================================================
function ComponentCard({
  preset,
  onInsert,
}: {
  preset: ComponentPreset;
  onInsert: () => void;
}) {
  return (
    <div className="group flex items-center gap-2 px-2 py-1.5 hover:bg-accent-blue/10 rounded cursor-pointer transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-300 font-mono truncate">{preset.label}</div>
        <div className="text-[10px] text-gray-600 truncate">{preset.description}</div>
      </div>
      <button
        className="shrink-0 px-2 py-0.5 bg-accent-blue/20 hover:bg-accent-blue text-accent-cyan hover:text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-all"
        onClick={(e) => {
          e.stopPropagation();
          onInsert();
        }}
      >
        + Add
      </button>
    </div>
  );
}
