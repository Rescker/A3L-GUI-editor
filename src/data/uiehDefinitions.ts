// =============================================================================
// Complete Arma 3 UI Event Handler Definitions
// =============================================================================

import type { UIEHDefinition } from '../types/controls';

export const UIEH_DEFINITIONS: UIEHDefinition[] = [
  // ========== DISPLAY-LEVEL EVENTS ==========
  {
    name: 'onLoad',
    scriptName: 'Load',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, [_config])',
    description: 'Fires after the dialog/display loads and all control onLoad events have completed.',
    example: '(_this select 0) displayAddEventHandler ["KeyDown", { params ["_d", "_k"]; hint str _k }];',
  },
  {
    name: 'onUnload',
    scriptName: 'Unload',
    applicableTo: ['display'],
    paramSignature: '(_display, _exitCode)',
    description: 'Fires when dialog is closed. Exit codes: 1=OK, 2=Cancel, 3=AutoCancel, 4=Abort, 5=Restart, 6=UserButton, 7=ExitToMain.',
    example: 'params ["_display", "_exitCode"]; if (_exitCode == 1) then { hint "OK pressed" };',
  },
  {
    name: 'onChildDestroyed',
    scriptName: 'ChildDestroyed',
    applicableTo: ['display'],
    paramSignature: '(_display, _closedChildDisplay, _exitCode)',
    description: 'Fires when a child display is destroyed. [Arma 3 2.14+]',
  },
  {
    name: 'onKeyDown',
    scriptName: 'KeyDown',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _key, _shift, _ctrl, _alt)',
    description: 'Fires on keyboard key press. Return true to intercept/hide the key from the engine.',
    returnDescription: 'Return true to intercept the key press.',
    example: 'params ["", "_key", "_shift", "_ctrl", "_alt"]; if (_key == 0x1C) then { hint "Enter pressed"; true };',
  },
  {
    name: 'onKeyUp',
    scriptName: 'KeyUp',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _key, _shift, _ctrl, _alt)',
    description: 'Fires on keyboard key release.',
  },
  {
    name: 'onChar',
    scriptName: 'Char',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _charCode)',
    description: 'Fires when a character key is pressed. Returns the Unicode char code.',
  },
  {
    name: 'onMouseButtonDown',
    scriptName: 'MouseButtonDown',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _button, _xPos, _yPos, _shift, _ctrl, _alt)',
    description: 'Fires on mouse button press. _button: 0=left, 1=right, 2=middle, 3..5=extra.',
  },
  {
    name: 'onMouseButtonUp',
    scriptName: 'MouseButtonUp',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _button, _xPos, _yPos, _shift, _ctrl, _alt)',
    description: 'Fires on mouse button release.',
  },
  {
    name: 'onMouseMoving',
    scriptName: 'MouseMoving',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _xDelta, _yDelta)',
    description: 'Fires continuously while mouse moves. For controls, signature is (_control, _xPos, _yPos, _mouseOver).',
  },
  {
    name: 'onMouseHolding',
    scriptName: 'MouseHolding',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _xPos, _yPos)',
    description: 'Fires repeatedly while mouse button is held down.',
  },
  {
    name: 'onMouseZChanged',
    scriptName: 'MouseZChanged',
    applicableTo: ['display', 'control'],
    paramSignature: '(_displayOrControl, _scroll)',
    description: 'Fires on mouse wheel scroll. _scroll: positive=up, negative=down.',
  },
  {
    name: 'onDraw',
    scriptName: 'Draw',
    applicableTo: ['control'],
    paramSignature: '(_controlOrDisplay)',
    description: 'Fires every frame for CT_OBJECT controls. Use for custom 3D drawing.',
    example: '(_this select 0) drawIcon ["icon.paa", [1,1,1,1], [0,0,0], 20, 20, 0];',
  },

  // ========== CONTROL-LEVEL GENERIC EVENTS ==========
  {
    name: 'onDestroy',
    scriptName: 'Destroy',
    applicableTo: ['control'],
    paramSignature: '(_control, _exitCode)',
    description: 'Fires when a control is destroyed.',
  },
  {
    name: 'onCanDestroy',
    scriptName: 'CanDestroy',
    applicableTo: ['control'],
    paramSignature: '(_control, _exitCode)',
    description: 'Fires before onDestroy. Return false to prevent control destruction.',
    returnDescription: 'Return false to prevent destruction.',
  },
  {
    name: 'onCommitted',
    scriptName: 'Committed',
    applicableTo: ['control'],
    paramSignature: '(_control, _animType, _animTime)',
    description: 'Fires when control animation commits. [Arma 3 2.14+]',
  },
  {
    name: 'onEditChanged',
    scriptName: 'EditChanged',
    applicableTo: ['control'],
    paramSignature: '(_control, _newText)',
    description: 'Fires when text in an edit control changes (CT_EDIT, CT_XEDIT).',
    example: 'params ["_ctrl", "_newText"]; if (_newText == "admin") then { _ctrl ctrlSetTextColor [1,0,0,1] };',
  },
  {
    name: 'onMouseEnter',
    scriptName: 'MouseEnter',
    applicableTo: ['control'],
    paramSignature: '(_control)',
    description: 'Fires when mouse cursor enters the control area.',
  },
  {
    name: 'onMouseExit',
    scriptName: 'MouseExit',
    applicableTo: ['control'],
    paramSignature: '(_control)',
    description: 'Fires when mouse cursor leaves the control area.',
  },
  {
    name: 'onSetFocus',
    scriptName: 'SetFocus',
    applicableTo: ['control'],
    paramSignature: '(_control)',
    description: 'Fires when control receives keyboard focus.',
  },
  {
    name: 'onKillFocus',
    scriptName: 'KillFocus',
    applicableTo: ['control'],
    paramSignature: '(_control)',
    description: 'Fires when control loses keyboard focus.',
  },

  // ========== BUTTON EVENTS ==========
  {
    name: 'onButtonClick',
    scriptName: 'ButtonClick',
    applicableTo: ['button'],
    paramSignature: '(_control)',
    description: 'Fires when a button is clicked (released after press). Return true to override default engine behavior.',
    returnDescription: 'Return true to override default engine behavior.',
    example: 'params ["_ctrl"]; hint "Button clicked!"; true;',
  },
  {
    name: 'onButtonDblClick',
    scriptName: 'ButtonDblClick',
    applicableTo: ['button'],
    paramSignature: '(_control)',
    description: 'Fires when a button is double-clicked.',
  },
  {
    name: 'onButtonDown',
    scriptName: 'ButtonDown',
    applicableTo: ['button'],
    paramSignature: '(_control)',
    description: 'Fires when mouse button is pressed down on a button.',
  },
  {
    name: 'onButtonUp',
    scriptName: 'ButtonUp',
    applicableTo: ['button'],
    paramSignature: '(_control)',
    description: 'Fires when mouse button is released on a button.',
  },

  // ========== LISTBOX / COMBO EVENTS ==========
  {
    name: 'onLBSelChanged',
    scriptName: 'LBSelChanged',
    applicableTo: ['listbox', 'combo'],
    paramSignature: '(_control, _lbCurSel, [_lbSelection])',
    description: 'Fires when the selected item changes. [_lbSelection] array only present with LB_MULTI style.',
    example: 'params ["_ctrl", "_sel"]; _ctrl lbText _sel;',
  },
  {
    name: 'onLBListSelChanged',
    scriptName: 'LBListSelChanged',
    applicableTo: ['listbox', 'combo'],
    paramSignature: '(_control, _selectedIndex)',
    description: 'Fires when listbox selection changes (used for custom selection tracking).',
  },
  {
    name: 'onLBDblClick',
    scriptName: 'LBDblClick',
    applicableTo: ['listbox', 'combo'],
    paramSignature: '(_control, _selectedIndex)',
    description: 'Fires when an item is double-clicked.',
  },
  {
    name: 'onLBDrag',
    scriptName: 'LBDrag',
    applicableTo: ['listbox'],
    paramSignature: '(_control, _listboxInfo)',
    description: 'Fires when dragging starts in a listbox.',
  },
  {
    name: 'onLBDragging',
    scriptName: 'LBDragging',
    applicableTo: ['listbox'],
    paramSignature: '(_control, _xPos, _yPos, _listboxIDC, _listboxInfo)',
    description: 'Fires continuously while dragging in a listbox.',
  },
  {
    name: 'onLBDrop',
    scriptName: 'LBDrop',
    applicableTo: ['listbox'],
    paramSignature: '(_control, _xPos, _yPos, _listboxIDC, _listboxInfo)',
    description: 'Fires when a listbox drag-drop operation completes.',
  },

  // ========== TREE EVENTS ==========
  {
    name: 'onTreeSelChanged',
    scriptName: 'TreeSelChanged',
    applicableTo: ['tree'],
    paramSignature: '(_control, _selectionPath)',
    description: 'Fires when a tree item selection changes. _selectionPath is array of indices representing the path.',
    example: 'params ["_ctrl", "_path"]; hint str _path;',
  },
  {
    name: 'onTreeLButtonDown',
    scriptName: 'TreeLButtonDown',
    applicableTo: ['tree'],
    paramSignature: '(_control)',
    description: 'Fires on mouse left button down on tree.',
  },
  {
    name: 'onTreeDblClick',
    scriptName: 'TreeDblClick',
    applicableTo: ['tree'],
    paramSignature: '(_control, _selectionPath)',
    description: 'Fires when a tree item is double-clicked.',
  },
  {
    name: 'onTreeExpanded',
    scriptName: 'TreeExpanded',
    applicableTo: ['tree'],
    paramSignature: '(_control, _selectionPath)',
    description: 'Fires when a tree node is expanded.',
  },
  {
    name: 'onTreeCollapsed',
    scriptName: 'TreeCollapsed',
    applicableTo: ['tree'],
    paramSignature: '(_control, _selectionPath)',
    description: 'Fires when a tree node is collapsed.',
  },
  {
    name: 'onTreeMouseMove',
    scriptName: 'TreeMouseMove',
    applicableTo: ['tree'],
    paramSignature: '(_control, _path)',
    description: 'Fires on mouse movement over tree items.',
  },
  {
    name: 'onTreeMouseHold',
    scriptName: 'TreeMouseHold',
    applicableTo: ['tree'],
    paramSignature: '(_control, _path)',
    description: 'Fires while mouse is held over a tree item.',
  },
  {
    name: 'onTreeMouseExit',
    scriptName: 'TreeMouseExit',
    applicableTo: ['tree'],
    paramSignature: '(_control)',
    description: 'Fires when mouse leaves the tree control.',
  },
  {
    name: 'onTreeFilterUpdated',
    scriptName: 'TreeFilterUpdated',
    applicableTo: ['tree'],
    paramSignature: '(_treeControl, _searchControl, _searchString)',
    description: 'Fires when a tree filter/search is updated. [Arma 3 2.12+]',
  },

  // ========== CHECKBOX EVENTS ==========
  {
    name: 'onCheckedChanged',
    scriptName: 'CheckedChanged',
    applicableTo: ['checkbox'],
    paramSignature: '(_control, _checked)',
    description: 'Fires when checkbox state changes. _checked: 0=unchecked, 1=checked.',
    example: 'params ["_ctrl", "_checked"]; if (_checked == 1) then { hint "Enabled" };',
  },
  {
    name: 'onCheckBoxesSelChanged',
    scriptName: 'CheckBoxesSelChanged',
    applicableTo: ['checkbox'],
    paramSignature: '(_control, _selectedIndex, _currentState)',
    description: 'Fires when CT_CHECKBOXES selection changes (for multi-checkbox control type 7).',
  },

  // ========== TOOLBOX EVENTS ==========
  {
    name: 'onToolBoxSelChanged',
    scriptName: 'ToolBoxSelChanged',
    applicableTo: ['misc'],
    paramSignature: '(_control, _selectedIndex)',
    description: 'Fires when a CT_TOOLBOX selection changes.',
  },

  // ========== HTML EVENTS ==========
  {
    name: 'onHTMLLink',
    scriptName: 'HTMLLink',
    applicableTo: ['misc'],
    paramSignature: '(_control, _url)',
    description: 'Fires when a hyperlink is clicked in a CT_HTML control.',
  },

  // ========== SLIDER EVENTS ==========
  {
    name: 'onSliderPosChanged',
    scriptName: 'SliderPosChanged',
    applicableTo: ['slider'],
    paramSignature: '(_control, _newValue)',
    description: 'Fires when slider position changes.',
    example: 'params ["_ctrl", "_val"]; hint format ["Volume: %1", _val];',
  },

  // ========== MISC EVENTS ==========
  {
    name: 'onObjectMoved',
    scriptName: 'ObjectMoved',
    applicableTo: ['misc'],
    paramSignature: '(_control, _offset)',
    description: 'Fires when an object in CT_OBJECT_CONTAINER is moved.',
  },
  {
    name: 'onMenuSelected',
    scriptName: 'MenuSelected',
    applicableTo: ['misc'],
    paramSignature: '(_control, _commandId)',
    description: 'Fires when a context menu item is selected (CT_CONTEXT_MENU).',
  },
  {
    name: 'onVideoStopped',
    scriptName: 'VideoStopped',
    applicableTo: ['misc'],
    paramSignature: '(_control)',
    description: 'Fires when a video (CT_HTML with video/OGV) finishes playing.',
  },
];
