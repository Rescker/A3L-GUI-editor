import type { DialogConfig, GridSystem } from '../types/controls';

export const PROJECT_FILE_VERSION = '1.0.0';

export interface ProjectFile {
  version: string;
  exportedAt: string;
  editorSettings: {
    gridSystem: GridSystem;
    gridVariant: string;
    showGrid: boolean;
    snapToGrid: boolean;
    previewResolution: { w: number; h: number };
    previewUIScale: string;
    zoomLevel: number;
    showAlignmentGuides: boolean;
    snapToAlignment: boolean;
    exportFormat: string;
  };
  dialogs: DialogConfig[];
}

export function serializeProject(
  dialogs: DialogConfig[],
  editorSettings: ProjectFile['editorSettings'],
): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    editorSettings,
    dialogs: structuredClone(dialogs),
  };
}

export function deserializeProject(json: string): ProjectFile | null {
  try {
    const data = JSON.parse(json);

    if (!data || typeof data !== 'object') return null;
    if (data.version !== PROJECT_FILE_VERSION) return null;
    if (!Array.isArray(data.dialogs)) return null;
    if (!data.editorSettings || typeof data.editorSettings !== 'object') return null;

    if (
      typeof data.editorSettings.previewResolution?.w !== 'number' ||
      typeof data.editorSettings.previewResolution?.h !== 'number'
    ) {
      return null;
    }

    return data as ProjectFile;
  } catch {
    return null;
  }
}

export function downloadProjectFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
