/*global caches, fetch, Promise */
(function (worker) {
"use strict";

var PREFIX = 'music-editor',
	VERSION = '1.10',
	FILES = [
		'index.html',
		'res/app.css',
		'res/app.js',
		'res/file.js',
		'res/fixKeyboard.js',
		'res/inputbox.css',
		'res/inputbox.js',
		'res/keyboard.css',
		'res/keyboard.js',
		'res/lib/abc.js',
		'res/lib/abcjs-midi.css',
		'res/lib/acoustic_grand_piano-ogg.js',
		'res/lib/font.css',
		'res/lib/scroll.js'
	];

worker.addEventListener('install', function (e) {
	e.waitUntil(
		caches.open(PREFIX + ':' + VERSION).then(function (cache) {
			return cache.addAll(FILES);
		})
	);
});

worker.addEventListener('activate', function (e) {
	e.waitUntil(
		caches.keys().then(function (keys) {
			return Promise.all(keys.map(function (key) {
				if (key.indexOf(PREFIX + ':') === 0 && key !== PREFIX + ':' + VERSION) {
					return caches.delete(key);
				}
			}));
		})
	);
});

worker.addEventListener('fetch', function (e) {
	e.respondWith(caches.match(e.request, {ignoreSearch: true})
		.then(function (response) {
			return response || fetch(e.request);
		})
	);
});

})(this);