/*
In an ideal world we could just use the keydown event
and the key property of the event.

Unfortunately, this is not an ideal world.
In Firefox OS e.key exists, but is always "Unidentified".
Additionally, the event for keydown (and keyup) does not
contain any information about the key for printable keys.
Other older browsers without e.key at least have e.keycode
which can be used to determine the key. But even there this
works reliably only for non-printable keys.
For printable keys there is e.charCode, but only for keypress
events. On the other hand, keypress is deprecated and modern
browsers no longer send it in all cases.

We solve these problems in the following way:
We register event handlers for both keydown and keypress.
When the event for keydown is good enough we use it, else
we wait for keypress instead.
Good enough means that we can derive a proper value for e.key,
which we do from charCode or keyCode.

This code does not cover all possible keys. It already covers
much more keys than I will ever use or even can press.
If you need more, adding them is easy.
This code also does not provide a similar replacement for keyup.
This could be done the same way: On keyup either use that event,
or the event from the previous keypress.
*/
(function (global) {
"use strict";

var deprecatedKeys = {
	Esc: 'Escape',
	Spacebar: ' ',
	Left: 'ArrowLeft',
	Up: 'ArrowUp',
	Right: 'ArrowRight',
	Down: 'ArrowDown',
	Del: 'Delete',
	OS: 'Meta',
	Scroll: 'ScrollLock',
	Multiply: '*',
	Add: '+',
	Divide: '/',
	Subtract: '-',
	Menu: 'ContextMenu'
}, keys = {
	8: 'Backspace',
	9: 'Tab',
	12: 'Clear',
	13: 'Enter',
	16: 'Shift',
	17: 'Control',
	18: 'Alt',
	19: 'Pause',
	20: 'CapsLock',
	27: 'Escape',
	32: ' ',
	33: 'PageUp',
	34: 'PageDown',
	35: 'End',
	36: 'Home',
	37: 'ArrowLeft',
	38: 'ArrowUp',
	39: 'ArrowRight',
	40: 'ArrowDown',
	41: 'Select',
	42: 'Print',
	43: 'Execute',
	44: 'PrintScreen',
	45: 'Insert',
	46: 'Delete',
	91: 'Meta',
	92: 'Meta',
	93: 'ContextMenu',
	112: 'F1',
	113: 'F2',
	114: 'F3',
	115: 'F4',
	116: 'F5',
	117: 'F6',
	118: 'F7',
	119: 'F8',
	120: 'F9',
	121: 'F10',
	122: 'F11',
	123: 'F12',
	124: 'F13',
	125: 'F14',
	126: 'F15',
	127: 'F16',
	128: 'F17',
	129: 'F18',
	130: 'F19',
	131: 'F20',
	132: 'F21',
	133: 'F22',
	134: 'F23',
	135: 'F24',
	144: 'NumLock',
	145: 'ScrollLock',
	225: 'AltGraph'
};

function getKey (e) {
	if (e.key && e.key !== 'Unidentified') {
		return deprecatedKeys[e.key] || e.key;
	}
	if (e.charCode) {
		return String.fromCharCode(e.charCode);
	}
	return keys[e.keyCode] || 'Unidentified';
}

function addKeyDownListener (el, handler) {
	var ignoreKeypress;
	el.addEventListener('keydown', function (e) {
		if (getKey(e) !== 'Unidentified') {
			handler(e);
			ignoreKeypress = true;
		} else {
			ignoreKeypress = false;
		}
	});
	el.addEventListener('keypress', function (e) {
		if (ignoreKeypress) {
			ignoreKeypress = false;
		} else {
			handler(e);
		}
	});
}

global.getKey = getKey;
global.addKeyDownListener = addKeyDownListener;
})(this);