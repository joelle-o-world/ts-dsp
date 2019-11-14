"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Hopper_1 = require("./transform-streams/Hopper");
var Windower_1 = require("./transform-streams/Windower");
var FFT_1 = require("./transform-streams/FFT");
var IFFT_1 = require("./transform-streams/IFFT");
var UnHopper_1 = require("./transform-streams/UnHopper");
var stream_1 = require("stream");
/** Shortcut function for setting up FFT/IFFT */
function quickFFT(stream, windowSize, hopSize, envelope) {
    if (windowSize === void 0) { windowSize = 2048; }
    if (hopSize === void 0) { hopSize = 441; }
    if (envelope === void 0) { envelope = 'hamming'; }
    var hopper = new Hopper_1.Hopper(windowSize, hopSize);
    var windower = new Windower_1.Windower(windowSize, envelope);
    var fft = new FFT_1.FFT(windowSize);
    hopper.pipe(windower).pipe(fft);
    if (stream instanceof stream_1.Readable)
        stream.pipe(hopper);
    else
        hopper.end(stream);
    return fft;
}
exports.quickFFT = quickFFT;
function quickIFFT(stream, windowSize, hopSize, envelope) {
    if (windowSize === void 0) { windowSize = 2048; }
    if (hopSize === void 0) { hopSize = 441; }
    if (envelope === void 0) { envelope = 'hamming'; }
    return stream
        .pipe(new IFFT_1.IFFT(windowSize))
        .pipe(new Windower_1.Windower(windowSize, envelope))
        .pipe(new UnHopper_1.UnHopper(windowSize, hopSize));
}
exports.quickIFFT = quickIFFT;
