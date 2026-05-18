// =============================================================================
// Validation Engine — Runs on every store update, returns issues
// =============================================================================

import type { DialogConfig, ControlConfig, ValidationIssue } from '../types/controls';
import { hasStyleFlag, hasObsoleteStyle } from './styleUtils';

const SPECIAL_IDCS: Record<number, string> = {
  1: 'IDC_OK — closes dialog with exit code 1',
  2: 'IDC_CANCEL — closes dialog with exit code 2',
  3: 'IDC_AUTOCANCEL',
  4: 'IDC_ABORT',
  5: 'IDC_RESTART',
  6: 'IDC_USER_BUTTON',
  7: 'IDC_EXIT_TO_MAIN',
};

export function validateDialog(dialog: DialogConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const did = dialog.id;

  // 1. IDC collision within dialog
  const idcMap = new Map<number, string[]>();
  const allControls = collectControls(dialog);
  for (const ctrl of allControls) {
    if (ctrl.idc === -1) continue;
    if (!idcMap.has(ctrl.idc)) idcMap.set(ctrl.idc, []);
    idcMap.get(ctrl.idc)!.push(ctrl.className);
  }
  for (const [idc, names] of idcMap) {
    if (names.length > 1) {
      issues.push({
        severity: 'error',
        message: `IDC ${idc} collision: used by ${names.join(', ')}. IDCs must be unique per dialog.`,
        dialogId: did,
      });
    }
  }

  // 2. Special IDC used on non-close button
  for (const ctrl of allControls) {
    if (ctrl.idc in SPECIAL_IDCS && ctrl.type !== 1 && ctrl.type !== 16 && ctrl.type !== 41) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" uses reserved IDC ${ctrl.idc} (${SPECIAL_IDCS[ctrl.idc]}). Only buttons should use these.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  // 3. GUI_GRID bounds: 0..40 wide, 0..25 tall
  for (const ctrl of allControls) {
    const gx = typeof ctrl.x === 'number' ? ctrl.x : 0;
    const gy = typeof ctrl.y === 'number' ? ctrl.y : 0;
    const gw = typeof ctrl.w === 'number' ? ctrl.w : 0;
    const gh = typeof ctrl.h === 'number' ? ctrl.h : 0;
    if (gx < 0) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" has negative X (${gx}) in grid units. May render off-screen.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
    if (gy < 0) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" has negative Y (${gy}) in grid units. May render off-screen.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
    if (gx + gw > 40) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" exceeds GUI_GRID width (${gx + gw} > 40). Will be clipped in-game.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
    if (gy + gh > 25) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" exceeds GUI_GRID height (${gy + gh} > 25). Will be clipped in-game.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  // 4. CT_CONTROLS_GROUP children overflow
  for (const ctrl of allControls) {
    if (ctrl.type === 15 && ctrl.children) {
      const gW = typeof ctrl.w === 'number' ? ctrl.w : 0;
      const gH = typeof ctrl.h === 'number' ? ctrl.h : 0;
      for (const child of ctrl.children) {
        const cx = typeof child.x === 'number' ? child.x : 0;
        const cy = typeof child.y === 'number' ? child.y : 0;
        const cw = typeof child.w === 'number' ? child.w : 0;
        const ch = typeof child.h === 'number' ? child.h : 0;
        if (cx + cw > gW || cy + ch > gH) {
          issues.push({
            severity: 'warning',
            message: `Child "${child.className}" exceeds group "${ctrl.className}" bounds. Scrollbars will appear in-game.`,
            dialogId: did,
            controlId: ctrl.id,
          });
        }
      }
    }
  }

  // 5. Obsolete style flags
  for (const ctrl of allControls) {
    const obsolete = hasObsoleteStyle(ctrl.style);
    if (obsolete) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" uses obsolete style ${obsolete.name} (${styleFlagsToHex(obsolete.flag)}). This causes .rpt spam in Arma 3.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  // 6. ST_MULTI without lineSpacing
  for (const ctrl of allControls) {
    if (hasStyleFlag(ctrl.style, 0x10) && !ctrl.lineSpacing) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" has ST_MULTI (0x10) but no lineSpacing property. Text rendering is undefined in RV engine.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  // 7. ST_TILE_PICTURE without tileH/tileW
  for (const ctrl of allControls) {
    if (hasStyleFlag(ctrl.style, 0x90) && (!ctrl.tileH || !ctrl.tileW)) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" has ST_TILE_PICTURE (0x90) but missing tileH/tileW properties.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  // 8. IDD collision across dialogs
  // (handled in validateAll)

  // 9. HUD duration not set to large number
  if (dialog.containerType === 'hud' && (!dialog.duration || dialog.duration < 1e10)) {
    issues.push({
      severity: 'info',
      message: `HUD "${dialog.className}" duration is small. For permanent HUD, use 1e+011 (100 billion seconds).`,
      dialogId: did,
    });
  }

  // 10. Moving control without movingEnable or ST_TITLE_BAR
  for (const ctrl of allControls) {
    if (ctrl.moving && !dialog.movingEnable && !hasStyleFlag(ctrl.style, 0x20)) {
      issues.push({
        severity: 'warning',
        message: `Control "${ctrl.className}" has moving=true but dialog movingEnable=0 and no ST_TITLE_BAR style. Dialog will NOT be draggable.`,
        dialogId: did,
        controlId: ctrl.id,
      });
    }
  }

  return issues;
}

export function validateAll(dialogs: DialogConfig[]): ValidationIssue[] {
  const allIssues: ValidationIssue[] = [];
  const iddMap = new Map<number, string[]>();

  // Per-dialog validation
  for (const dialog of dialogs) {
    allIssues.push(...validateDialog(dialog));

    // Track idd for cross-dialog collision
    if (dialog.idd !== -1) {
      if (!iddMap.has(dialog.idd)) iddMap.set(dialog.idd, []);
      iddMap.get(dialog.idd)!.push(dialog.className);
    }
  }

  // Cross-dialog idd collision
  for (const [idd, names] of iddMap) {
    if (names.length > 1) {
      allIssues.push({
        severity: 'warning',
        message: `IDD ${idd} collision across dialogs: ${names.join(', ')}.`,
      });
    }
  }

  return allIssues;
}

function collectControls(dialog: DialogConfig): ControlConfig[] {
  const collect = (controls: ControlConfig[]): ControlConfig[] => {
    const result: ControlConfig[] = [];
    for (const ctrl of controls) {
      result.push(ctrl);
      if (ctrl.children) {
        result.push(...collect(ctrl.children));
      }
    }
    return result;
  };
  return [
    ...collect(dialog.controlsBackground),
    ...collect(dialog.controls),
    ...collect(dialog.objects),
  ];
}

function styleFlagsToHex(style: number): string {
  return `0x${style.toString(16).toUpperCase()}`;
}
