# A3L GUI Editor

A **visual editor** for creating Arma 3 `config.cpp` UI dialogs, designed specifically for Life/RP server frameworks. Build complex layered UIs with a canvas-based editor, real-time preview, and full Arma 3 coordinate system support.

## Screenshot / Overview

The editor provides a **three-panel layout**:

```
┌──────────────────────────────────────────────────┐
│ Toolbar (grid, resolution, zoom, snap, preview)  │
├──────────┬───────────────────────┬────────────────┤
│ Component│                       │   Properties   │
│ Library  │     Canvas            │   Panel        │
│ Hierarchy│     (drag & resize)   │   (edit props) │
├──────────┴───────────────────────┴────────────────┤
│ Status Bar (position, zoom %, selection info)     │
└──────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **React 18** + **TypeScript** |
| State Management | **Zustand** |
| Build | **Vite** |
| Styling | **Tailwind CSS** |
| Code Editor | **Monaco Editor** (for event handlers) |

## Features

### Core
- **Visual canvas** — Drag, resize, and position UI controls visually
- **Multiple grid systems** — `GUI_GRID` (40×25), `SafeZone`, `Absolute` (legacy), `Pixel Grid`
- **Expression-based coordinates** — Full support for Arma 3 grid expressions like `4.7 * GUI_GRID_CENTER_W + GUI_GRID_CENTER_X`
- **Zoom** — Ctrl+Scroll or Alt+Scroll zoom (0.1× – 3.0×)
- **Full-screen Preview** — F11 or toolbar button to hide all chrome and auto-scale the canvas to fill the viewport at the selected resolution's aspect ratio
- **Multi-select** — Ctrl+click to select multiple controls, then drag or resize them as a group
- **Smart Alignment** — Green guide lines appear when component edges or centers align during drag/resize. Snaps to canvas boundaries, safe zone edges, and other components.
- **Layer Reorder** — Right-click → Move Up / Move Down, or drag-and-drop controls in the Hierarchy panel to change render order (last = topmost)
- **Copy/Paste** — Ctrl+C / Ctrl+V to duplicate controls with all properties preserved. Offsets pasted copies slightly for visibility.
- **Duplicate** — Right-click → Duplicate in the Hierarchy panel
- **Undo/Redo** — Ctrl+Z / Ctrl+Y with coalesced history
- **Config generation** — Export to `class`, `full_dialog`, `hud`, or editor format
- **Config import** — Parse existing Arma config files into editable controls
- **Component library** — 60+ `Life_Rsc*` presets based on popular Life/RP server frameworks
- **Inheritance** — Controls inherit from parent classes; only explicitly-set properties are emitted
- **ST_PICTURE image support** — Upload PNG preview images; set real Arma texture paths in the dedicated Texture Path field

### Canvas
- Per-control type rendering (buttons, edit boxes, listboxes, sliders, trees, etc.)
- Safe zone overlay with dimmed exterior
- Grid overlay with major/minor tick lines
- Resize handles (8-direction)
- Group bounding box for multi-selection
- Image preview for ST_PICTURE controls
- Controls group (CT_CONTROLS_GROUP) editing

### Properties Panel
- **Identity** — Class name, IDC, type, parent class
- **Position & Size** — X, Y, W, H with expression support, font size
- **Style Flags** — Bitwise flag toggles (ST_CENTER, ST_PICTURE, ST_FRAME, etc.)
- **Appearance** — Font, colors (RGBA with color pickers), shadow, text content, tooltip, URL, fade, access, moving, deletable
- **Texture Path** — Dedicated field for Arma `.paa`/`.jpg` texture paths
- **Type-specific** — Properties unique to each control type (button offsets, listbox row height, slider textures, etc.)
- **Event Handlers** — UI Event Handler picker with code editor

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type-check
npx tsc --noEmit
```

## Usage

1. **Create a Dialog** — Click +D (Dialog), +P (Display), or +H (HUD) in the Hierarchy panel
2. **Add Controls** — Right-click a dialog → Add Control, or use the Component Library
3. **Position & Size** — Drag controls on the canvas, or edit X/Y/W/H in the Properties panel
4. **Set Properties** — Select a control, edit its properties in the right panel
5. **Layering** — Controls in `ControlsBackground` render below `Controls`. Within a zone, use Move Up/Down or drag-and-drop in the Hierarchy to reorder (last = topmost)
6. **Preview** — Press F11 to see how the dialog looks at the selected resolution
7. **Export** — Click Export to generate `config.cpp` output in `class`, `full_dialog`, `hud`, or editor format

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Click | Toggle multi-select |
| Delete / Backspace | Remove selected controls |
| Ctrl+C | Copy selected controls |
| Ctrl+V | Paste copied controls |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| Arrow keys | Nudge selected controls (hold Ctrl for fine nudge) |
| Ctrl+Scroll / Alt+Scroll | Zoom in/out |
| F11 | Toggle full-screen preview |
| Escape | Exit preview / Clear selection |

## Coordinate Systems

| System | Range | Description |
|--------|-------|-------------|
| `GUI_GRID` | 0–40 (X), 0–25 (Y) | Standard Arma 3 safezone grid with 8 variants (Center, TopLeft, BottomRight, etc.) |
| `SafeZone` | 0–1 relative to safe zone | Normalized coordinates within the safe zone |
| `Absolute` | 0–1 relative to screen | Legacy absolute screen coordinates |
| `Pixel Grid` | 5px increments | Pixel-aligned grid |

## Project Structure

```
src/
├── App.tsx                            # Root layout (3-panel)
├── main.tsx                           # Entry point
├── components/
│   ├── Canvas/
│   │   ├── Canvas.tsx                 # Main canvas: drag, resize, zoom, alignment
│   │   ├── ControlRenderer.tsx        # Single control renderer
│   │   ├── SelectionOverlay.tsx       # Selection handles + group bounding box
│   │   ├── GridOverlay.tsx            # Grid lines overlay
│   │   ├── AlignmentGuideOverlay.tsx  # Green guide lines for smart alignment
│   ├── Toolbar/
│   │   └── Toolbar.tsx                # Top toolbar: grid, zoom, snap, preview
│   ├── HierarchyPanel/
│   │   └── HierarchyPanel.tsx         # Left sidebar: dialog/control tree + context menu
│   ├── PropertiesPanel/
│   │   ├── PropertiesPanel.tsx        # Right sidebar: tabbed property editor
│   │   ├── IdentitySection.tsx        # Class name, IDC, type
│   │   ├── PositionSection.tsx        # X, Y, W, H, grid system
│   │   ├── StyleFlagsSection.tsx      # Bitwise style flags
│   │   ├── AppearanceSection.tsx      # Font, colors, shadow, text, images
│   │   ├── TypeSpecificSection.tsx    # Control-type-specific properties
│   │   └── EventHandlersSection.tsx   # UI Event Handlers
│   ├── ComponentLibrary/
│   │   └── ComponentLibrary.tsx       # Left panel: Life_Rsc* preset browser
│   └── ImportExportModal/
│       └── ImportExportModal.tsx      # Modal for config import/export
├── store/
│   └── editorStore.ts                 # Zustand store: all state + actions
├── types/
│   └── controls.ts                    # TypeScript interfaces for all control types
├── utils/
│   ├── gridUtils.ts                   # Coordinate conversion, safe zone, grid math
│   ├── alignmentUtils.ts              # Smart alignment detection engine
│   ├── styleUtils.ts                  # Style flag helpers, color utilities
│   ├── configGenerator.ts             # Arma config.cpp generation
│   ├── configParser.ts                # Arma config.cpp parsing
│   ├── validation.ts                  # Control validation rules
│   ├── projectSerializer.ts           # Project file save/load
│   └── copyUtils.ts                   # Clipboard helpers
└── data/
    ├── componentLibrary.ts            # 60+ Life_Rsc* presets
    ├── controlDefaults.ts             # Control type metadata
    ├── gridVariants.ts                # GUI_GRID variant definitions
    ├── uiehDefinitions.ts             # UI Event Handler definitions
    └── fontList.ts                    # Available fonts
```

## Control Inheritance

Controls use Arma 3's class inheritance system. For example:

```cpp
class CellphoneBackground {
    type = 0;
    style = 48;  // ST_PICTURE
    text = "yourimage.paa";
    x = safeZoneX + safeZoneW * 0.62597657;
    y = safeZoneY + safeZoneH * 0.21701389;
    w = safeZoneW * 0.16796875;
    h = safeZoneH * 0.58333334;
};
```

Then in dialogs:
```cpp
class Fundo : CellphoneBackground {
    idc = 15019;
    // Inherits all properties from CellphoneBackground
};
```

The editor supports this: when a parent class is set, only **explicitly-modified properties** are emitted in the export, producing clean, inheritance-based config output.

## Layering

In Arma 3, the render order is determined by:

1. **Zone order**: `ControlsBackground` → `Controls` → (objects)
2. **Definition order within a zone**: later = on top

The Hierarchy panel shows controls in their definition order. Use **Move Up / Move Down** (right-click) or **drag-and-drop** to reorder. The last control in each zone renders on top of the others.

For a phone UI wallpapers + frame:
```cpp
class ControlsBackground
{
    class Wallpaper : life_RscPicture { ... };  // bottom layer
};
class Controls
{
    class Frame : life_RscPicture { ... };      // on top of wallpaper
    class Button : life_RscButton { ... };        // topmost, clickable
};
```

## Textures / Images

For controls with `ST_PICTURE` (style 0x30):
1. **Upload PNG** — Loads an image for **canvas preview only** (stored as `imageDataUrl`)
2. **Texture Path** — Type the actual Arma path (e.g., `textures\phone\phone.paa`) in the dedicated field

The texture path is what gets exported as `text = "path";`. The PNG upload is strictly for visual reference on the canvas.

## Development

### Adding a new control type

1. Add it to `CONTROL_TYPES` in `src/data/controlDefaults.ts`
2. Add a render branch in `ControlRenderer.tsx`
3. Add default properties in the appropriate section
4. If it's a new `Life_Rsc*` preset, add it to `src/data/componentLibrary.ts`

### Adding a style flag

Add it to `STYLE_FLAGS` in `src/utils/styleUtils.ts` with the flag value, name, constant, description, and applicable types.

### Adding a grid variant

Add it to `GUI_GRID_VARIANTS` in `src/data/gridVariants.ts` with X/Y/W/H expressions.

---

## Credits

Developed and maintained by **[@Rescker](https://github.com/Rescker)** — Arma 3 Life/RP UI modding tools for the community.
