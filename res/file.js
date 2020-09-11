/*global file: true*/
/*global Blob, URL, MozActivity*/
file =
(function () {
"use strict";

function saveAbc (text, name) {
	fileSaveAs(createTextFile(text), name + '.abc');
}

function savePng (svg, name) {
	createPngFile(svg, function (blob) {
		fileSaveAs(blob, name + '.png');
	});
}

function saveSvg (svg, name) {
	fileSaveAs(createSvgFile(svg), name + '.svg');
}

function saveMidi (midi, name) {
	fileSaveAs(midi, name + '.midi');
}

function createTextFile (text, type) {
	return new Blob([text], {type: type || 'image/png'}); //stupid, but yes
}

function createSvgFile (svg) {
	var str = (new XMLSerializer().serializeToString(svg));
	return 'data:image/svg+xml,' + encodeURIComponent(str);
}

function createPngFile (svg, callback) {
	var img = new Image();
	img.onload = function () {
		var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
		img.width = img.naturalWidth;
		img.height = img.naturalHeight;
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.fillStyle = 'white';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0);
		if (canvas.toBlob) {
			canvas.toBlob(callback);
		} else {
			callback(canvas.toDataURL());
		}
	};
	img.src = createSvgFile(svg);
}

function fileSaveAs (file, name) {
	var a = document.createElement('a');
	if (typeof file !== 'string') {
		file = URL.createObjectURL(file);
	}
	a.href = file;
	if ('download' in a) {
		a.download = name || '';
	} else {
		a.target = '_blank';
	}
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function readAbc (file, callback) {
	if (!file) {
		callback();
		return;
	}
	var reader = new FileReader();
	reader.onload = function (e) {
		callback(e.target.result);
	};
	reader.onerror = function () {
		callback();
	};
	reader.readAsText(file);
}

function openAbc (callback) {
	var pick;
	if (window.MozActivity) {
		pick = new MozActivity({
			name: 'pick',
			data: {
				type: [
					'text/vnd.abc',
					'text/plain',
					'application/pdf' //this is ridiculous, but it does work
				]
			}
		});

		pick.onsuccess = function () {
			readAbc(this.result.blob, callback);
		};

		pick.onerror = function () {
			callback();
		};
	} else {
		pick = document.createElement('input');
		pick.type = 'file';
		pick.style.display = 'none';
		document.getElementsByTagName('body')[0].appendChild(pick);
		pick.addEventListener('change', function () {
			readAbc(pick.files[0], callback);
			document.getElementsByTagName('body')[0].removeChild(pick);
		}, false);
		pick.click();
	}
}

return {
	open: {
		abc: openAbc
	},
	import: {
		abc: readAbc
	},
	save: {
		abc: saveAbc,
		png: savePng,
		svg: saveSvg,
		midi: saveMidi
	}
};

})();