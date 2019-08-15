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
var stream_1 = require("stream");
var sq = function (x) { return x * x; };
var SpectralMagnitudes = /** @class */ (function (_super) {
    __extends(SpectralMagnitudes, _super);
    function SpectralMagnitudes() {
        return _super.call(this, { objectMode: true }) || this;
    }
    SpectralMagnitudes.prototype._transform = function (chunk, encoding, callback) {
        // Calculate the magnitude of each complex pair
        var magnitudesByChannel = [];
        for (var c = 0; c < chunk.numberOfChannels; c++) {
            var binData = chunk.getChannelData(c);
            var magnitudes = new Array(chunk.windowSize);
            magnitudesByChannel[c] = magnitudes;
            for (var bin = 0, i = 0; bin < chunk.windowSize; bin++, i += 2)
                magnitudes[bin] = Math.sqrt(sq(binData[i] + binData[i + 1]));
        }
        callback(null, {
            magnitudes: magnitudesByChannel[0],
            magnitudesByChannel: magnitudesByChannel,
            time: chunk.time,
            sampleRate: chunk.sampleRate
        });
    };
    return SpectralMagnitudes;
}(stream_1.Transform));
exports.SpectralMagnitudes = SpectralMagnitudes;
var MonoSpectralMagnitudes = /** @class */ (function (_super) {
    __extends(MonoSpectralMagnitudes, _super);
    function MonoSpectralMagnitudes() {
        return _super.call(this, { objectMode: true }) || this;
    }
    MonoSpectralMagnitudes.prototype._transform = function (chunk, encoding, callback) {
        // Calculate the magnitude of each complex pair
        var binData = chunk.getChannelData(0);
        var magnitudes = new Array(chunk.windowSize);
        for (var bin = 0, i = 0; bin < chunk.windowSize; bin++, i += 2)
            magnitudes[bin] = Math.sqrt(sq(binData[i] + binData[i + 1]));
        callback(null, {
            magnitudes: magnitudes,
            time: chunk.time,
            sampleRate: chunk.sampleRate
        });
    };
    return MonoSpectralMagnitudes;
}(stream_1.Transform));
exports.MonoSpectralMagnitudes = MonoSpectralMagnitudes;
