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
var AudioBuffer = require("audiobuffer");
/**
 * Transform stream for preparing overlapping/spaced chunks of audio for FFT.
 */
var Hopper = /** @class */ (function (_super) {
    __extends(Hopper, _super);
    function Hopper(windowSize, hopSize) {
        if (hopSize === void 0) { hopSize = windowSize; }
        var _this = _super.call(this, { objectMode: true }) || this;
        if (!windowSize || !hopSize)
            throw 'Hopper: constructor expects windowSize and hopSize';
        _this.iWindow = 0; // index within buffer
        _this.windowSize = windowSize;
        _this.windowBuffer = new Float32Array(_this.windowSize);
        _this.hopSize = hopSize;
        _this.iHop = 0;
        _this.hopCount = 0;
        return _this;
    }
    Hopper.prototype._transform = function (audio, encoding, callback) {
        // TODO: update to support multichannel.
        var signal = audio.getChannelData(0);
        for (var t = 0; t < signal.length; t++) {
            this.windowBuffer[this.iWindow] = signal[t];
            this.iWindow = (this.iWindow + 1) % this.windowSize;
            if (++this.iHop >= this.hopSize) {
                this.iHop = 0;
                var newBuffer = new Float32Array(this.windowSize);
                for (var i = this.iWindow, j = 0; i < this.windowSize; i++, j++)
                    newBuffer[j] = this.windowBuffer[i];
                for (var i = 0, j = this.windowSize - this.iWindow; i < this.iWindow; i++, j++)
                    newBuffer[j] = this.windowBuffer[i];
                var out = AudioBuffer.fromArray([newBuffer], audio.sampleRate);
                out.time = this.hopSize * this.hopCount;
                this.hopCount++;
                this.push(out);
            }
        }
        // TODO: Implement _flush().
        // TODO: Consider using zero-filled buffer to begin with.
        callback();
    };
    Hopper.streamifyBuffer = function (buffer, chunkSize) {
        if (chunkSize === void 0) { chunkSize = 8192; }
        var hopper = new Hopper(chunkSize, chunkSize);
        hopper.end(buffer);
        return hopper;
    };
    return Hopper;
}(stream_1.Transform));
exports.default = Hopper;
