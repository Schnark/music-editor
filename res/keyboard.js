/*global Keyboard: true*/
/*global getKey, addKeyDownListener*/
Keyboard =
(function () {
"use strict";

function Keyboard (id, input) {
	this.element = document.getElementById(id);
	this.input = input;
	this.hiddenInput = this.element.getElementsByTagName('input')[0];
	this.useNativeKeyboard = false;
	this.element.addEventListener('click', this.onClick.bind(this));
	addKeyDownListener(this.hiddenInput, this.onKey.bind(this));
	this.hiddenInput.addEventListener('blur', this.onBlur.bind(this));
}

Keyboard.prototype.onClick = function (e) {
	var target = e.target;
	if (target.nodeName.toLowerCase() === 'button') {
		if (target.dataset.exec) {
			this.execCommand(target.dataset.exec);
		} else {
			this.insertStr(target.dataset.str || target.textContent);
		}
	}
};

Keyboard.prototype.onKey = function (e) {
	var key = getKey(e);
	if (key.length === 1) {
		this.insertStr(key);
	} else {
		switch (key) {
		case 'Backspace':
			this.execCommand('del');
			break;
		case 'Enter':
			this.insertStr('\n');
			break;
		case 'PageUp':
			this.execCommand('page-up', e.shiftKey);
			break;
		case 'PageDown':
			this.execCommand('page-down', e.shiftKey);
			break;
		case 'End':
			this.execCommand('end', e.shiftKey);
			break;
		case 'Home':
			this.execCommand('start', e.shiftKey);
			break;
		case 'ArrowLeft':
			this.execCommand('left', e.shiftKey);
			break;
		case 'ArrowUp':
			this.execCommand('up', e.shiftKey);
			break;
		case 'ArrowRight':
			this.execCommand('right', e.shiftKey);
			break;
		case 'ArrowDown':
			this.execCommand('down', e.shiftKey);
			break;
		case 'Delete':
			this.execCommand('del-right');
			break;
		//default: console.log(key);
		}
	}
	e.preventDefault();
};

Keyboard.prototype.onBlur = function () {
	if (this.useNativeKeyboard) {
		setTimeout(function () {
			if (this.useNativeKeyboard) {
				this.hiddenInput.focus();
			}
		}.bind(this), 0);
	}
};

Keyboard.prototype.toggleNativeKeyboard = function (on) {
	if (on) {
		this.element.className = 'native-keyboard';
		this.useNativeKeyboard = true;
		this.hiddenInput.focus();
	} else {
		this.element.className = '';
		this.useNativeKeyboard = false;
		this.hiddenInput.blur();
	}
};

Keyboard.prototype.insertStr = function (str) {
	this.input.insert(str);
};

Keyboard.prototype.execCommand = function (command, selecting) {
	switch (command) {
	case 'keyboard':
		this.toggleNativeKeyboard(!this.useNativeKeyboard);
		break;
	case 'del':
		this.input.remove();
		break;
	case 'del-right':
		this.input.remove(true);
		break;
	case 'start':
	case 'end':
	case 'left':
	case 'right':
	case 'up':
	case 'down':
	case 'page-up':
	case 'page-down':
		this.input.handleCursorKey(command, selecting);
		break;
	}
};

return Keyboard;
})();