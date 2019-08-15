"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FFTJS = require("fft.js");
var stream_1 = require("stream");
var SpectralBuffer_1 = require("../SpectralBuffer");
/**
 *  Transform stream for converting a pre-windowed AudioBuffer object-stream to spectral data.
 *  @returns SpectralBuffer object-stream
 */
var FFT = /** @class */ (function (_super) {
    __extends(FFT, _super);
    function FFT(windowSize) {
        if (windowSize === void 0) { windowSize = 2048; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.windowSize = windowSize;
        _this.frameSize = _this.windowSize * 2;
        _this.fftFunction = new FFTJS(_this.windowSize);
        return _this;
    }
    FFT.prototype._transform = function (audio, encoding, callback) {
        if (audio.numberOfChannels != 1)
            throw "FastFourierTransform expects mono input";
        if (audio.length != this.windowSize)
            throw "FastFourierTransform recieved chunk of incorrect size: " + audio.length;
        var channelData = [];
        for (var c = 0; c < audio.numberOfChannels; c++) {
            var signal = audio.getChannelData(c);
            var bins = new Array(this.frameSize);
            this.fftFunction.realTransform(bins, signal);
            this.fftFunction.completeSpectrum(bins);
            channelData[c] = bins;
        }
        var spectrum = SpectralBuffer_1.SpectralBuffer.fromArray(channelData, audio.sampleRate);
        // @ts-ignore
        spectrum.time = audio.time;
        callback(null, spectrum);
    };
    return FFT;
}(stream_1.Transform));
exports.FFT = FFT;
