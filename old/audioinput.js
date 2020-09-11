/*
Based on PitchDetect by Chris Wilson (https://github.com/cwilso/PitchDetect):

The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/*global audioInput: true*/
/*global AudioContext*/
audioInput =
(function () {
"use strict";

if (!window.AudioContext) {
	return {
		start: function (onNote, onError) {
			onError();
		},
		end: function () {
		}
	};
}

var GOOD_ENOUGH_CORRELATION = 0.9,
	audioContext = new AudioContext(),
	buffer = new Float32Array(1024),
	mediaStreamSource, analyser,
	prevNote, intervalId, noteCallback;

function getUserMedia (constraints, success, error) {
	if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices.getUserMedia(constraints).then(success, error);
	} else if (navigator.getUserMedia) {
		navigator.getUserMedia(constraints, success, error);
	} else if (navigator.mozGetUserMedia) {
		navigator.mozGetUserMedia(constraints, success, error);
	} else if (navigator.webkitGetUserMedia) {
		navigator.webkitGetUserMedia(constraints, success, error);
	} else {
		error();
	}
}

function initAudioInput (callback) {
	if (!mediaStreamSource) {
		getUserMedia({audio: true}, function (stream) {
			analyser = audioContext.createAnalyser();
			mediaStreamSource = audioContext.createMediaStreamSource(stream);
			analyser.fftSize = 2048;
			mediaStreamSource.connect(analyser);
			callback(true);
		}, function () {
			callback(false);
		});
	} else {
		mediaStreamSource.connect(analyser);
		callback(true);
	}
}

function exitAudioInput () {
	mediaStreamSource.disconnect(analyser);
}

function autoCorrelate (buf, sampleRate) {
	var bufferSize = buf.length,
		totalSamples = Math.floor(bufferSize / 2),
		bestOffset = -1,
		bestCorrelation = 0,
		rms = 0,
		foundGoodCorrelation = false,
		correlations = new Array(totalSamples),
		lastCorrelation = 1,
		i, val, offset, correlation, shift;

	for (i = 0; i < bufferSize; i++) {
		val = buf[i];
		rms += val * val;
	}
	rms = Math.sqrt(rms / bufferSize);
	if (rms < 0.01) {
		return -1;
	}

	for (offset = 0; offset < totalSamples; offset++) {
		correlation = 0;
		for (i = 0; i < totalSamples; i++) {
			correlation += Math.abs(buf[i] - buf[i + offset]);
		}
		correlation = 1 - correlation / totalSamples;
		correlations[offset] = correlation;
		if ((correlation > GOOD_ENOUGH_CORRELATION) && (correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
			if (correlation > bestCorrelation) {
				bestCorrelation = correlation;
				bestOffset = offset;
			}
		} else if (foundGoodCorrelation) {
			shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
			return sampleRate / (bestOffset + 8 * shift);
		}
		lastCorrelation = correlation;
	}
	if (bestCorrelation > 0.01) {
		return sampleRate / bestOffset;
	}
	return -1;
}

function repeat (str, count) {
	return new Array(count + 1).join(str);
}

function octave (note, oct) {
	oct = -1; //implementation has great troubles to determine the correct octave
	if (oct < 0) {
		return note + repeat(',', -oct - 1);
	} else {
		return note.toLowerCase() + repeat('\'', oct);
	}
}

function getCurrentNote () {
	var frequency, noteNum,
		noteStr = ['C', '^C', 'D', '^D', 'E', 'F', '^F', 'G', '^G', 'A', '^A', 'B'];
	analyser.getFloatTimeDomainData(buffer);
	frequency = autoCorrelate(buffer, audioContext.sampleRate);
	if (frequency === -1) {
		return '';
	} else {
		noteNum = Math.round(12 * Math.log(frequency / 440) / Math.log(2)) + 21;
		return octave(noteStr[(noteNum % 12 + 12) % 12], Math.floor(noteNum / 12));
	}
}

function callNoteCallback () {
	var note = getCurrentNote();
	if (note !== prevNote) {
		prevNote = note;
		noteCallback(note);
	}
}

function startAudioInput (onNote, onError) {
	initAudioInput(function (success) {
		if (success) {
			noteCallback = onNote;
			prevNote = '';
			intervalId = setInterval(callNoteCallback, 100);
		} else {
			onError();
		}
	});
}

function endAudioInput () {
	clearInterval(intervalId);
	exitAudioInput();
}

return {
	start: startAudioInput,
	end: endAudioInput
};

})();