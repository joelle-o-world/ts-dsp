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
var AudioBuffer = require("audiobuffer");
var stream_1 = require("stream");
/** Applies an envelope to AudioChunks to prepare them for FFT. */
var Windower = /** @class */ (function (_super) {
    __extends(Windower, _super);
    function Windower(windowSize, envelopeType) {
        if (windowSize === void 0) { windowSize = 2048; }
        if (envelopeType === void 0) { envelopeType = "hamming"; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.windowSize = windowSize;
        _this.envelopeType = envelopeType;
        _this.envelopeName = _this.envelopeType + _this.windowSize;
        _this.envelope = Windower.getEnvelope(_this.windowSize, _this.envelopeType);
        return _this;
    }
    Windower.prototype._transform = function (audio, encoding, callback) {
        if (audio.length != this.windowSize)
            throw "Windower has recieved chunk of wrong size (" + audio.length + ")";
        var out = [];
        for (var c = 0; c < audio.numberOfChannels; c++) {
            var signal = audio.getChannelData(c);
            out[c] = new Array(audio.length);
            for (var t = 0; t < this.windowSize; t++)
                out[c][t] = signal[t] * this.envelope[t];
        }
        var audio2 = AudioBuffer.fromArray(out, audio.sampleRate);
        // @ts-ignore
        audio2.time = audio.time;
        callback(null, audio2);
    };
    Windower.getEnvelope = function (size, type) {
        var F = Windower.envelopeFunctions[type];
        if (!F)
            throw "Window type \'" + type + "\' is not defined.";
        var name = type + size;
        if (Windower.envelopes[name])
            return Windower.envelopes[name];
        var env = new Float32Array(size);
        for (var n = 0; n < size; n++)
            env[n] = F(n, size);
        Windower.envelopes[name] = env;
        return env;
    };
    return Windower;
}(stream_1.Transform));
exports.Windower = Windower;
Windower.envelopes = {};
Windower.envelopeFunctions = {
    "hamming": function (n, N) {
        return Math.pow(Math.sin((Math.PI * n) / (N - 1)), 2);
    }
};
