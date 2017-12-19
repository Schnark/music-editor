/*global InputBox, Keyboard, audioInput, file, ABCJS*/
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

function getExportFileName () {
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

function onExportMidi () {
	file.save.midi(document.getElementById('midi-download').getElementsByTagName('a')[0].href, getExportFileName());
}

function onAudioInputStart () {
	showHideAudio(false);
	audioInput.start(function (note) {
		inputBox.insert(note);
	}, function () {
		showHideAudio(true);
	});
}

function onAudioInputEnd () {
	audioInput.end();
	showHideAudio(true);
}

function showHideAudio (showStart) {
	document.getElementById('button-audio-start').style.display = showStart ? '' : 'none';
	document.getElementById('button-audio-end').style.display = showStart ? 'none' : '';
}

function initEvents () {
	var resizing;

	if (navigator.mozSetMessageHandler) {
		navigator.mozSetMessageHandler('activity', function (request) {
			file.import.abc(request.source.data.blob, function (text) {
				if (text) {
					inputBox.setString(text);
				}
			});
		});
	}

	document.getElementById('button-fresh-abc').onclick = onFreshAbc;
	document.getElementById('button-import-abc').onclick = onImportAbc;
	document.getElementById('button-export-abc').onclick = onExportAbc;
	document.getElementById('button-export-png').onclick = onExportPng;
	document.getElementById('button-export-svg').onclick = onExportSvg;
	document.getElementById('button-export-midi').onclick = onExportMidi;
	document.getElementById('button-audio-start').onclick = onAudioInputStart;
	document.getElementById('button-audio-end').onclick = onAudioInputEnd;

	window.addEventListener('resize', function () {
		if (resizing) {
			clearTimeout(resizing);
		}
		resizing = setTimeout(function () {
			editor.paramChanged(getRenderOptions());
		}, 300);
	});
}

function init () {
	/*jshint nonew: false*/
	/*jshint camelcase: false*/
	//jscs:disable requireCamelCaseOrUpperCaseIdentifiers
	ABCJS.midi.soundfontUrl = 'res/lib/';

	updateL10N();
	showHideAudio(true);

	inputBox = new InputBox('input-box');
	inputBox.enableAutosave('music-editor-autosave', emptyAbc);

	new Keyboard('keyboard', inputBox);
	editor = new ABCJS.Editor(inputBox, {
		canvas_id: 'canvas',
		render_options: getRenderOptions(),
		midi_options: {
			generateInline: true,
			generateDownload: true
		},
		generate_midi: true,
		midi_id: 'midi-container',
		midi_download_id: 'midi-download',
		generate_warnings: true,
		warnings_id: 'warnings'
	});

	initEvents();
}

init();

})();