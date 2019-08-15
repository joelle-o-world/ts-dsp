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
/** Recombines overlapping AudioBuffer chunks (probably from IFFT). */
var UnHopper = /** @class */ (function (_super) {
    __extends(UnHopper, _super);
    function UnHopper(frameSize, hopSize) {
        if (frameSize === void 0) { frameSize = 2048; }
        if (hopSize === void 0) { hopSize = 441; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.frameSize = frameSize;
        _this.hopSize = hopSize;
        _this.time = 0;
        _this.buffer = new Array(frameSize).fill(0);
        _this.writeHead = 0;
        return _this;
    }
    UnHopper.prototype._transform = function (audio, encoding, callback) {
        // TODO: multichannel support
        var signal = audio.getChannelData(0);
        for (var t = 0; t < audio.length; t++)
            this.buffer[(this.writeHead + t) % this.buffer.length] += signal[t];
        this.writeHead += this.hopSize;
        if (this.writeHead > this.hopSize) { // surely this is never false?
            var from = (this.writeHead - this.hopSize) % this.buffer.length;
            var to = this.writeHead % this.buffer.length;
            var out = void 0;
            if (from > to) {
                // concatting two slices
                out = this.buffer.slice(from)
                    .concat(this.buffer.slice(0, to));
                this.buffer
                    .fill(0, from)
                    .fill(0, 0, to);
            }
            else {
                // use just one slice
                out = this.buffer.slice(from, to);
                this.buffer.fill(0, from, to);
            }
            var audio2 = AudioBuffer.fromArray([out], audio.sampleRate);
            audio2.time = this.time;
            this.time += audio2.length;
            this.push(audio2);
        }
        callback();
    };
    return UnHopper;
}(stream_1.Transform));
exports.default = UnHopper;
