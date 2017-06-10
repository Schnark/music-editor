/*global InputBox: true*/
InputBox =
(function () {
"use strict";

function InputBox (id) {
	this.element = document.getElementById(id);
	this.text = '';
	this.cursorPos = 0;
	this.selectionPos = 0;
	this.initialText = '';
	if (document.caretPositionFromPoint) {
		this.initMouse();
	}
}

//these methods exist for abcjs
InputBox.prototype.addSelectionListener = function (listener) {
	this.changeListener = listener;
};

InputBox.prototype.addChangeListener = function (listener) {
	this.changeListener = listener;
};

InputBox.prototype.getSelection = function () {
	return {
		start: Math.min(this.cursorPos, this.selectionPos),
		end: Math.max(this.cursorPos, this.selectionPos)
	};
};

InputBox.prototype.setSelection = function (start, end) {
	this.selectionPos = Math.min(Math.max(0, start || 0), this.text.length);
	this.cursorPos = Math.min(Math.max(0, end || 0), this.text.length);
	this.updateDisplay();
};

InputBox.prototype.getString = function () {
	return this.text;
};

InputBox.prototype.setString = function (str) {
	this.text = str;
	this.initialText = str;
	this.cursorPos = str.length;
	this.selectionPos = str.length;
	this.updateDisplay();
	this.fireChanged();
};

InputBox.prototype.getElem = function () {
	return this.element;
};

//other methods
InputBox.prototype.fireChanged = function () {
	if (this.changeListener) {
		this.changeListener.fireChanged();
	}
	if (this.autosave) {
		try {
			localStorage[this.autosave] = this.text;
		} catch (e) {
		}
	}
};

InputBox.prototype.fireSelectionChanged = function () {
	if (this.changeListener) {
		this.changeListener.fireSelectionChanged();
	}
};

InputBox.prototype.enableAutosave = function (key, defaultStr) {
	var str;
	this.autosave = key;
	try {
		str = localStorage[this.autosave];
	} catch (e) {
	}
	this.setString(str || defaultStr);
};

InputBox.prototype.insert = function (str) {
	this.text =
		this.text.slice(0, Math.min(this.cursorPos, this.selectionPos)) +
		str +
		this.text.slice(Math.max(this.cursorPos, this.selectionPos));
	this.cursorPos = Math.min(this.cursorPos, this.selectionPos) + str.length;
	this.selectionPos = this.cursorPos;
	this.updateDisplay();
	this.fireChanged();
};

InputBox.prototype.setCursor = function (pos, selecting) {
	if (pos >= 0 && pos <= this.text.length) {
		this.cursorPos = pos;
	}
	if (!selecting) {
		this.selectionPos = this.cursorPos;
	}
	this.updateDisplay();
	this.fireSelectionChanged();
};

InputBox.prototype.unsetCursor = function (callback) {
	var cursorPos = this.cursorPos, selectionPos = this.selectionPos;
	this.setCursor(0);
	callback();
	this.setCursor(selectionPos);
	this.setCursor(cursorPos, true);
};

InputBox.prototype.moveCursor = function (d, selecting) {
	this.setCursor(this.cursorPos + d, selecting);
};

InputBox.prototype.handleCursorKey = function (key, shift) {
	function linePosFromPos (pos, text) {
		var start = text.lastIndexOf('\n', pos - 1) + 1;
		return {
			start: start,
			pos: pos - start
		};
	}

	function posFromLinePos (linePos, text) {
		var end = text.indexOf('\n', linePos.start),
			pos = linePos.start + linePos.pos;
		if (end === -1) {
			end = text.length;
		}
		return Math.min(pos, end);
	}

	var d, pos;
	switch (key) {
	case 'left':
		d = -1;
		break;
	case 'right':
		d = 1;
		break;
	case 'start':
		pos = linePosFromPos(this.cursorPos, this.text);
		pos.pos = 0;
		d = posFromLinePos(pos, this.text) - this.cursorPos;
		break;
	case 'end':
		pos = linePosFromPos(this.cursorPos, this.text);
		pos.pos = Infinity;
		d = posFromLinePos(pos, this.text) - this.cursorPos;
		break;
	case 'page-up':
	case 'up':
		pos = linePosFromPos(this.cursorPos, this.text);
		pos.start = this.text.lastIndexOf('\n', pos.start - 2) + 1;
		d = posFromLinePos(pos, this.text) - this.cursorPos;
		break;
	case 'page-down':
	case 'down':
		pos = linePosFromPos(this.cursorPos, this.text);
		pos.start = this.text.indexOf('\n', pos.start) + 1;
		d = pos.start ? posFromLinePos(pos, this.text) - this.cursorPos : 0;
		break;
	}
	this.moveCursor(d, shift);
};

InputBox.prototype.remove = function (toRight) {
	if (this.cursorPos !== this.selectionPos) {
		this.insert('');
		return;
	}
	if (
		(!toRight && this.cursorPos === 0) ||
		(toRight && this.cursorPos === this.text.length)
	) {
		return;
	}
	if (toRight) {
		this.text = this.text.slice(0, this.cursorPos) + this.text.slice(this.cursorPos + 1);
	} else {
		this.text = this.text.slice(0, this.cursorPos - 1) + this.text.slice(this.cursorPos);
		this.cursorPos--;
		this.selectionPos--;
	}
	this.updateDisplay();
	this.fireChanged();
};

InputBox.prototype.updateDisplay = function () {
	var start = Math.min(this.cursorPos, this.selectionPos), end = Math.max(this.cursorPos, this.selectionPos);
	function escape (str) {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}
	this.element.innerHTML = escape(this.text.slice(0, start)) +
		'<span class="highlight">' + escape(this.text.slice(start, end)) + '</span>' +
		escape(this.text.slice(end));
	this.element.getElementsByClassName('highlight')[0].scrollIntoViewIfNeeded();
};

InputBox.prototype.initMouse = function () {
	function getIndex (e, parent) {
		if (e.button !== 0) {
			return -1;
		}
		var range = document.caretPositionFromPoint(e.clientX, e.clientY),
			node = range.offsetNode, offset = range.offset, i;
		if (node.parentNode !== parent) {
			node = node.parentNode;
			if (node.parentNode !== parent) {
				return -1; //shouldn't happen
			}
		}
		for (i = 0; i < parent.childNodes.length; i++) {
			if (parent.childNodes[i] === node) {
				break;
			}
			offset += parent.childNodes[i].textContent.length;
		}
		return offset;
	}

	this.element.addEventListener('mousedown', function (e) {
		var index = getIndex(e, this.element);
		if (index > -1) {
			this.setCursor(index);
		}
	}.bind(this));
	//causes more problems than it solves
	/*this.element.addEventListener('mousemove', function (e) {
		var index = getIndex(e);
		if (index > -1) {
			this.setCursor(index, true);
		}
	}.bind(this));*/
};

return InputBox;
})();