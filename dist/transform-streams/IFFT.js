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
var FFT = require("fft.js");
var stream_1 = require("stream");
var AudioBuffer = require("audiobuffer");
/**
 * Inverse fast fourier transform stream. Convert SpectralBuffer object stream to overlapping AudioBuffer stream.
 */
var IFFT = /** @class */ (function (_super) {
    __extends(IFFT, _super);
    function IFFT(windowSize) {
        if (windowSize === void 0) { windowSize = 2048; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.windowSize = windowSize;
        _this.frameSize = 2 * _this.windowSize;
        _this.fftFunction = new FFT(_this.windowSize);
        return _this;
    }
    IFFT.prototype._transform = function (spectrum, encoding, callback) {
        if (spectrum.frameSize != this.frameSize)
            throw "IFFT recieved chunk of unexpected size: " + spectrum.frameSize;
        var channelData = [];
        for (var c = 0; c < spectrum.numberOfChannels; c++) {
            var pcmBuffer = new Array(this.frameSize);
            this.fftFunction.inverseTransform(pcmBuffer, spectrum.getChannelData(c));
            var realBuffer = new Array(this.windowSize);
            for (var i = 0; i < this.windowSize; i++)
                realBuffer[i] = pcmBuffer[2 * i];
            channelData[c] = realBuffer;
        }
        var outBuffer = AudioBuffer.fromArray(channelData, spectrum.sampleRate);
        outBuffer.time = spectrum.time;
        callback(null, outBuffer);
    };
    return IFFT;
}(stream_1.Transform));
exports.IFFT = IFFT;
