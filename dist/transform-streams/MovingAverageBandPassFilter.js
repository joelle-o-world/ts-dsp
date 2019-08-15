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
 * A band pass filter using simple moving average low pass filters.
 * https://www.gaussianwaves.com/2010/11/moving-average-filter-ma-filter-2/
 * (To support old waveforms, not a very good audio filter.)
 * */
var MovingAverageBandPassFilter = /** @class */ (function (_super) {
    __extends(MovingAverageBandPassFilter, _super);
    function MovingAverageBandPassFilter(lo, hi) {
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.lo = lo;
        _this.hi = hi;
        return _this;
    }
    /** Calculate moving average lengths based on sample rate of incoming PCM audio. */
    MovingAverageBandPassFilter.prototype.setup = function (sr, numberOfChannels) {
        this.sampleRate = sr;
        this.loAvLen = Math.ceil(sr * 0.443 / this.lo);
        this.hiAvLen = Math.ceil(sr * 0.443 / this.hi);
        this.loBuffer = [];
        this.hiBuffer = [];
        this.loSum = [];
        this.hiSum = [];
        for (var c = 0; c < numberOfChannels; c++) {
            this.loBuffer[c] = [];
            this.hiBuffer[c] = [];
            this.loSum[c] = 0;
            this.hiSum[c] = 0;
        }
    };
    /** Apply filter to incoming audio chunk. */
    MovingAverageBandPassFilter.prototype._transform = function (audio, encoding, callback) {
        if (!this.sampleRate)
            this.setup(audio.sampleRate, audio.numberOfChannels);
        var outChannelData = [];
        for (var c = 0; c < audio.numberOfChannels; c++) {
            var pcmdata = audio.getChannelData(c);
            var outdata = outChannelData[c] = new Float32Array(pcmdata.length);
            for (var t = 0; t < pcmdata.length; t++) {
                var y = pcmdata[t];
                this.loSum[c] += y;
                this.loBuffer[c].push(y);
                if (this.loBuffer[c].length > this.loAvLen)
                    this.loSum[c] -= this.loBuffer[c].shift();
                this.hiSum[c] += y;
                this.hiBuffer[c].push(y);
                if (this.hiBuffer[c].length > this.hiAvLen)
                    this.hiSum[c] -= this.hiBuffer[c].shift();
                outdata[t] = (this.hiSum[c] / this.hiAvLen) - (this.loSum[c] / this.loAvLen);
            }
        }
        var audioOut = AudioBuffer.fromArray(outChannelData, this.sampleRate);
        // @ts-ignore
        audioOut.time = audio.time;
        callback(null, audioOut);
    };
    return MovingAverageBandPassFilter;
}(stream_1.Transform));
exports.MovingAverageBandPassFilter = MovingAverageBandPassFilter;
