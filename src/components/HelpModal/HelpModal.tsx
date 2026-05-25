// =============================================================================
// HelpModal — Usage documentation and keyboard shortcuts reference
// =============================================================================

import React from 'react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface border border-white/10 rounded-xl shadow-2xl w-[720px] max-h-[85vh] flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-gray-200">Documentation</h2>
          <button
            className="text-gray-500 hover:text-white text-lg leading-none"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-gray-300">

          {/* Getting Started */}
          <Section title="Getting Started">
            <Step n={1} text="Create a Dialog — click <b>+</b> in the tab bar and choose Dialog, Display, or HUD" />
            <Step n={2} text="Add Controls — open the <b>Components</b> panel and browse presets by category. Click <b>+ Add</b> on any preset to insert it." />
            <Step n={3} text="Position & Size — drag controls on the canvas, or edit <b>X / Y / W / H</b> in the Properties panel." />
            <Step n={4} text="Set Properties — select a control and edit its identity, style flags, colors, fonts, and event handlers in the right panel." />
            <Step n={5} text="Preview — press <b>F11</b> or click <b>Preview</b> in the toolbar to see the dialog at full resolution." />
            <Step n={6} text="Export — click <b>Export</b> to generate config.cpp output in your chosen format." />
          </Section>

          {/* Keyboard Shortcuts */}
          <Section title="Keyboard Shortcuts">
            <KbdRow keys="Ctrl + Click" desc="Toggle multi-select" />
            <KbdRow keys="Delete / Backspace" desc="Remove selected controls" />
            <KbdRow keys="Ctrl + C" desc="Copy selected controls" />
            <KbdRow keys="Ctrl + V" desc="Paste copied controls" />
            <KbdRow keys="Ctrl + Z" desc="Undo" />
            <KbdRow keys="Ctrl + Y" desc="Redo" />
            <KbdRow keys="Arrow Keys" desc="Nudge selected controls" />
            <KbdRow keys="Ctrl + Arrows" desc="Fine nudge (0.1 grid units)" />
            <KbdRow keys="Ctrl + Scroll" desc="Zoom in/out (cursor-centered)" />
            <KbdRow keys="Alt + Scroll" desc="Zoom in/out (cursor-centered)" />
            <KbdRow keys="F11" desc="Toggle fullscreen preview" />
            <KbdRow keys="Escape" desc="Exit preview / Clear selection" />
            <KbdRow keys="Middle mouse" desc="Pan the canvas" />
          </Section>

          {/* Coordinate Systems */}
          <Section title="Coordinate Systems">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-1.5 pr-3 text-gray-400 font-medium">System</th>
                    <th className="text-left py-1.5 pr-3 text-gray-400 font-medium">Range</th>
                    <th className="text-left py-1.5 text-gray-400 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-1.5 pr-3 text-accent-cyan font-mono">GUI_GRID</td>
                    <td className="py-1.5 pr-3 text-gray-500">0–40 (X), 0–25 (Y)</td>
                    <td className="py-1.5 text-gray-400">Standard Arma 3 safezone grid with 8 alignment variants</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-1.5 pr-3 text-accent-cyan font-mono">SafeZone</td>
                    <td className="py-1.5 pr-3 text-gray-500">0–1</td>
                    <td className="py-1.5 text-gray-400">Normalized coordinates within the safe zone area</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-1.5 pr-3 text-accent-cyan font-mono">Absolute</td>
                    <td className="py-1.5 pr-3 text-gray-500">0–1</td>
                    <td className="py-1.5 text-gray-400">Legacy absolute screen coordinates</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Layering */}
          <Section title="Layering & Render Order">
            <p className="text-gray-400 mb-2">
              Controls render in this order (bottom to top):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400 ml-1">
              <li><b className="text-gray-300">ControlsBackground</b> — rendered first (bottom layer)</li>
              <li><b className="text-gray-300">Controls</b> — rendered on top of background</li>
              <li><b className="text-gray-300">Objects</b> — rendered last (top layer)</li>
            </ol>
            <p className="text-gray-500 mt-2">
              Within each zone, controls defined later render on top. Use <b className="text-gray-400">Move Up / Move Down</b> in the Hierarchy panel to reorder.
            </p>
          </Section>

          {/* Component Library */}
          <Section title="Component Library">
            <p className="text-gray-400 mb-2">
              The component panel provides <b className="text-gray-300">Arma 3 native</b> base classes and <b className="text-gray-300">Life/RP framework</b> presets.
              Use the <b className="text-accent-cyan">All / Arma / Life</b> tabs to filter by source.
            </p>
            <p className="text-gray-400">
              Presets set up default properties (colors, fonts, sounds, texture paths) exactly as defined in the Arma 3 wiki.
              You can customize every property after insertion via the Properties panel.
            </p>
          </Section>

          {/* Inheritance */}
          <Section title="Control Inheritance">
            <p className="text-gray-400">
              When you set a <b className="text-gray-300">Parent Class</b>, only the properties you explicitly change are emitted in the export.
              This produces clean, inheritance-based config files that match Arma 3 conventions.
            </p>
          </Section>

          {/* External Resources */}
          <Section title="External Resources">
            <a
              href="https://community.bistudio.com/wiki/Arma_3:_User_Interface_Editor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent-cyan hover:underline"
            >
              Arma 3: User Interface Editor — Official Bohemia Interactive Wiki ↗
            </a>
          </Section>

        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Sub-components
// =============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-200 mb-2 pb-1 border-b border-white/5">{title}</h3>
      {children}
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-2 mb-1.5">
      <span className="text-gray-500 font-mono min-w-[16px]">{n}.</span>
      <span className="text-gray-400" dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function KbdRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 border border-white/10 rounded text-[10px] text-gray-300 font-mono min-w-[100px]">
        {keys}
      </kbd>
      <span className="text-gray-500">{desc}</span>
    </div>
  );
}
