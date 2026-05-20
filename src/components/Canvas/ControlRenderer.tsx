// =============================================================================
// ControlRenderer — Pure presentational component
// Renders a single control on the canvas. No drag/resize state.
// =============================================================================

import React, { useCallback } from 'react';
import type { ControlConfig, GridSystem } from '../../types/controls';
import { controlToCanvasCoords } from '../../utils/gridUtils';
import { hasStyleFlag, resolveColorValue } from '../../utils/styleUtils';

interface Props {
  control: ControlConfig;
  dialogId: string;
  isSelected: boolean;
  gridSystem: GridSystem;
  gridVariant: string;
  canvasW: number;
  canvasH: number;
  scale: number;
  safeZone: { x: number; y: number; w: number; h: number };
  uiScale: string;
  onMouseDownCapture: (e: React.MouseEvent) => void;
}

export const ControlRenderer: React.FC<Props> = ({
  control,
  isSelected,
  gridSystem,
  gridVariant,
  canvasW,
  canvasH,
  scale,
  safeZone,
  uiScale,
  onMouseDownCapture,
}) => {
  const coords = controlToCanvasCoords(control, gridSystem, gridVariant, canvasW, canvasH, uiScale);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: coords.x * scale,
    top: coords.y * scale,
    width: coords.w * scale,
    height: coords.h * scale,
    border: isSelected ? '2px solid #e94560' : '1px solid rgba(255,255,255,0.2)',
    boxSizing: 'border-box',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'border-color 0.15s',
    overflow: 'hidden',
  };

  // Text color
  const textColor = `rgba(${control.colorText.map(v => Math.round(v * 255)).join(',')})`;
  const bgColor = `rgba(${resolveColorValue(control.colorBackground[0]) * 255 >> 0},${resolveColorValue(control.colorBackground[1]) * 255 >> 0},${resolveColorValue(control.colorBackground[2]) * 255 >> 0},${resolveColorValue(control.colorBackground[3])})`;
  const fontSize = (typeof control.sizeEx === 'number' ? control.sizeEx : 4) * scale * 3;

  // Configure rendering based on control type
  const renderContent = () => {
    const ft = control.type;
    const text = control.text || '';
    const isPicture = hasStyleFlag(control.style, 0x30);
    const isFrame = hasStyleFlag(control.style, 0x40);

    // All controls with ST_PICTURE + loaded image
    if (isPicture && control.imageDataUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <img
            src={control.imageDataUrl}
            alt={text || 'Picture'}
            className="max-w-full max-h-full pointer-events-none"
            style={{ objectFit: 'contain' }}
          />
        </div>
      );
    }

    // All controls with ST_PICTURE but no image uploaded yet
    if (isPicture) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: textColor }}>
          {text ? `[IMG: ${text}]` : '[Picture]'}
        </div>
      );
    }

    // CT_STATIC with ST_FRAME
    if (ft === 0 && isFrame) {
      return (
        <div className="w-full h-full border-2 flex items-start p-1" style={{ borderColor: textColor }}>
          <span className="text-xs px-1 -mt-3 bg-surface" style={{ color: textColor }}>{text || 'Frame'}</span>
        </div>
      );
    }

    // CT_STATIC
    if (ft === 0) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-xs px-1"
          style={{ color: textColor, backgroundColor: bgColor !== 'rgba(0,0,0,0)' ? bgColor : undefined }}
        >
          <span className="truncate">{text || 'Static'}</span>
        </div>
      );
    }

    // CT_BUTTON / CT_SHORTCUTBUTTON / CT_XBUTTON
    if (ft === 1 || ft === 16 || ft === 41) {
      return (
        <div
          className="w-full h-full flex items-center justify-center text-xs font-bold rounded"
          style={{ color: textColor, backgroundColor: bgColor !== 'rgba(0,0,0,0)' ? bgColor : 'rgba(59,130,246,0.3)' }}
        >
          {text || 'Button'}
        </div>
      );
    }

    // CT_EDIT
    if (ft === 2) {
      return (
        <div className="w-full h-full" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <input
            type="text"
            className="w-full h-full bg-transparent text-xs px-1 outline-none pointer-events-none"
            style={{ color: textColor }}
            defaultValue={text || 'Edit'}
            readOnly
          />
        </div>
      );
    }

    // CT_SLIDER / CT_XSLIDER
    if (ft === 3 || ft === 43) {
      return (
        <div className="w-full h-full flex items-center px-1">
          <div className="w-full h-1.5 rounded" style={{ backgroundColor: bgColor !== 'rgba(0,0,0,0)' ? bgColor : '#374151' }}>
            <div className="h-full w-1/3 rounded" style={{ backgroundColor: '#e94560' }} />
          </div>
        </div>
      );
    }

    // CT_COMBO / CT_XCOMBO
    if (ft === 4 || ft === 44) {
      return (
        <div className="w-full h-full flex items-center px-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <span className="text-xs flex-1" style={{ color: textColor }}>{text || 'Combo'}</span>
          <span className="text-xs ml-1" style={{ color: textColor }}>▼</span>
        </div>
      );
    }

    // CT_LISTBOX / CT_LISTNBOX / CT_XLISTBOX
    if (ft === 5 || ft === 102 || ft === 45) {
      return (
        <div className="w-full h-full" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="p-1 text-xs" style={{ color: textColor }}>
            {['Item 1', 'Item 2', 'Item 3'].slice(0, Math.max(1, Math.floor(coords.h * scale / 20))).map((item, i) => (
              <div key={i} className="px-1 py-0.5" style={i === 0 ? { backgroundColor: 'rgba(233,69,96,0.3)' } : {}}>{item}</div>
            ))}
          </div>
        </div>
      );
    }

    // CT_CHECKBOX / CT_CHECKBOXES
    if (ft === 77 || ft === 7) {
      return (
        <div className="w-full h-full flex items-center gap-2 px-2">
          <input type="checkbox" className="pointer-events-none" readOnly />
          <span className="text-xs" style={{ color: textColor }}>{text || 'Checkbox'}</span>
        </div>
      );
    }

    // CT_PROGRESS
    if (ft === 8) {
      return (
        <div className="w-full h-full flex items-center px-1">
          <div className="w-full h-2 rounded" style={{ backgroundColor: '#374151' }}>
            <div className="h-full w-3/5 rounded" style={{ backgroundColor: '#3b82f6' }} />
          </div>
        </div>
      );
    }

    // CT_TREE
    if (ft === 12) {
      return (
        <div className="w-full h-full p-1 text-xs" style={{ color: textColor, backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div>├─ Root</div>
          <div className="pl-3">├─ Child 1</div>
          <div className="pl-3">└─ Child 2</div>
        </div>
      );
    }

    // CT_CONTROLS_GROUP
    if (ft === 15) {
      return (
        <div className="w-full h-full border-2 border-dashed border-yellow-500/50 p-2 overflow-hidden">
          <span className="text-xs text-yellow-500/70">Group: {text || control.className}</span>
          {control.children?.map(child => (
            <div key={child.id} className="text-xs text-gray-500 mt-0.5 ml-2">
              ↳ {child.className}
            </div>
          ))}
        </div>
      );
    }

    // CT_HTML
    if (ft === 9) {
      return (
        <div className="w-full h-full p-1 text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <span style={{ color: textColor }}>[HTML: {text || 'web content'}]</span>
        </div>
      );
    }

    // CT_STRUCTURED_TEXT
    if (ft === 13) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs p-1" style={{ color: textColor }}>
          <span className="text-center">{text || 'Structured Text'}</span>
        </div>
      );
    }

    // CT_TOOLBOX
    if (ft === 6) {
      return (
        <div className="w-full h-full flex items-center gap-1 p-1">
          {['Opt 1', 'Opt 2', 'Opt 3'].map((o, i) => (
            <div key={i} className="px-1 py-0.5 text-xs rounded" style={{
              backgroundColor: i === 0 ? '#e94560' : '#374151',
              color: textColor,
            }}>{o}</div>
          ))}
        </div>
      );
    }

    // Default/fallback
    return (
      <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: textColor }}>
        {text || `CT_${ft}`}
      </div>
    );
  };

  return (
    <div
      ref={undefined}
      style={style}
      onMouseDown={onMouseDownCapture}
      className="hover:border-accent-cyan/50"
      data-control-id={control.id}
      data-control-type={control.type}
    >
      {renderContent()}
    </div>
  );
};
