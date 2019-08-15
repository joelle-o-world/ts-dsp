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
var Speaker = require('speaker');
var Transform = require("stream").Transform;
var ToBuffer = /** @class */ (function (_super) {
    __extends(ToBuffer, _super);
    function ToBuffer(bitDepth) {
        if (bitDepth === void 0) { bitDepth = 16; }
        var _this = _super.call(this, { readableObjectMode: false, writableObjectMode: true }) || this;
        _this.bitDepth = bitDepth;
        _this.byteDepth = _this.bitDepth / 8;
        _this.scaleFloats = Math.pow(2, _this.bitDepth - 3);
        return _this;
    }
    ToBuffer.prototype._transform = function (audio, encoding, callback) {
        var buffer = new Buffer(this.byteDepth * audio.length);
        var signal = audio.getChannelData(0);
        for (var i = 0; i < signal.length; i++) {
            buffer.writeInt16LE(signal[i] * this.scaleFloats, i * this.byteDepth);
        }
        callback(null, buffer);
    };
    return ToBuffer;
}(Transform));
/**
 * Play an AudioBuffer stream to the node speakers.
 * Use for line checking/debugging only.
 */
function lineCheck(stream, sampleRate, bitDepth) {
    if (sampleRate === void 0) { sampleRate = 44100; }
    if (bitDepth === void 0) { bitDepth = 16; }
    stream.pipe(new ToBuffer(bitDepth))
        .pipe(new Speaker({
        channels: 1,
        sampleRate: sampleRate,
        bitDepth: bitDepth,
    }));
}
exports.default = lineCheck;
