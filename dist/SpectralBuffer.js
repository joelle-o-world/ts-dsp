"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Stores a single frame of multichannel FFT data. */
var SpectralBuffer = /** @class */ (function () {
    function SpectralBuffer() {
        this.sampleRate;
        this._data = [];
    }
    Object.defineProperty(SpectralBuffer.prototype, "numberOfChannels", {
        get: function () {
            return this._data.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpectralBuffer.prototype, "frameSize", {
        get: function () {
            return this._data[0].length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpectralBuffer.prototype, "windowSize", {
        get: function () {
            return this.frameSize / 2;
        },
        enumerable: true,
        configurable: true
    });
    SpectralBuffer.prototype.getChannelData = function (c) {
        if (this._data[c])
            return this._data[c].slice();
        else
            throw "Channel doesn't exist";
    };
    SpectralBuffer.prototype.binFrequency = function (bin) {
        return bin * this.sampleRate / this.frameSize;
    };
    SpectralBuffer.prototype.binOfFrequency = function (f) {
        return f * this.frameSize / this.sampleRate;
    };
    SpectralBuffer.fromArray = function (channelData, sampleRate) {
        if (!sampleRate)
            throw 'SpectralBuffer.fromArray expects sample rate';
        var buffer = new SpectralBuffer;
        buffer.sampleRate = sampleRate;
        buffer._data = channelData;
        return buffer;
    };
    return SpectralBuffer;
}());
exports.SpectralBuffer = SpectralBuffer;
