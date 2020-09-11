/*global InputBox, Keyboard, file, ABCJS*/
(function () {
"use strict";

var inputBox, editor,
	emptyAbc = 'X:1\nT:\nM:4/4\nL:1/4\nK:C\n';

function updateL10N () {
	var langs = {
		de: 'Musikeditor'
	}, lang;
	lang = (navigator.language || '').replace(/-.*/, '');
	if (langs[lang]) {
		document.documentElement.lang = lang;
		document.title = langs[lang];
		document.body.className = 'lang-' + lang;
	}
}

function getRenderOptions () {
	return {
		staffwidth: document.getElementById('warnings').clientWidth - 15,
		paddingtop: 0,
		paddingbottom: 0,
		paddingleft: 0,
		paddingright: 15
	};
}

//TODO
function getExportFileName () {
	//editor.tunes[0].metaText.title
	var name = document.getElementById('midi-download').getElementsByTagName('a')[0].download || 'untitled.midi';
	return name.replace(/\.midi$/, '');
}

function onFreshAbc () {
	inputBox.setString(emptyAbc);
}

function onImportAbc () {
	file.open.abc(function (text) {
		if (text) {
			inputBox.setString(text);
		}
	});
}

function onExportAbc () {
	file.save.abc(inputBox.getString(), getExportFileName());
}

function onExportPng () {
	inputBox.unsetCursor(function () {
		file.save.png(document.getElementById('canvas').getElementsByTagName('svg')[0], getExportFileName());
	});
}

function onExportSvg () {
	inputBox.unsetCursor(function () {
		file.save.svg(document.getElementById('canvas').getElementsByTagName('svg')[0], getExportFileName());
	});
}

//TODO
function onExportMidi () {
	file.save.midi(document.getElementById('midi-download').getElementsByTagName('a')[0].href, getExportFileName());
}

function initEvents (inputBox) {
	var init, resizing;

	if (navigator.mozSetMessageHandler) {
		navigator.mozSetMessageHandler('activity', function (request) {
			clearTimeout(init);
			file.import.abc(request.source.data.blob, function (text) {
				if (text) {
					inputBox.setString(text);
				}
				initEditor(inputBox);
			});
		});
		init = setTimeout(function () {
			initEditor(inputBox);
		}, 300);
	} else {
		initEditor(inputBox);
	}

	document.getElementById('button-fresh-abc').onclick = onFreshAbc;
	document.getElementById('button-import-abc').onclick = onImportAbc;
	document.getElementById('button-export-abc').onclick = onExportAbc;
	document.getElementById('button-export-png').onclick = onExportPng;
	document.getElementById('button-export-svg').onclick = onExportSvg;
	document.getElementById('button-export-midi').onclick = onExportMidi; //TODO

	window.addEventListener('resize', function () {
		if (resizing) {
			clearTimeout(resizing);
		}
		resizing = setTimeout(function () {
			if (editor) {
				editor.paramChanged(getRenderOptions());
			}
		}, 300);
	});
}

function initEditor (inputBox) {
	/*jshint camelcase: false*/
	//jscs:disable requireCamelCaseOrUpperCaseIdentifiers
	if (editor) {
		return;
	}
	editor = new ABCJS.Editor(inputBox, {
		canvas_id: 'canvas',
		abcjsParams: getRenderOptions(),

		//TODO
		midi_options: {
			generateInline: true,
			generateDownload: true
		},
		generate_midi: true,
		midi_id: 'midi-container',
		midi_download_id: 'midi-download',
		/*
		synth: {
			el: '#audio',
			options: {
				displayLoop: true,
				displayRestart: true,
				displayPlay: true,
				displayProgress: true,
				displayWarp: true
			}
		},
		*/

		generate_warnings: true,
		warnings_id: 'warnings'
	});
}

function init () {
	/*jshint nonew: false*/

	//TODO
	ABCJS.midi.setSoundFont('res/lib/');
	/*if (window.AudioContext && window.Promise && !window.AudioContext.prototype.resume) {
		window.AudioContext.prototype.resume = function () {
			return window.Promise.resolve();
		};
	}*/

	updateL10N();

	inputBox = new InputBox('input-box');
	inputBox.enableAutosave('music-editor-autosave', emptyAbc);

	new Keyboard('keyboard', inputBox);
	initEvents(inputBox);
}

init();

})();