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
var pitchConversion_1 = require("../util/pitchConversion");
var sq = function (x) { return x * x; };
/** Calculate the (mean-square) intensities for multiply frequency bands given spectral data */
var MultiBandIntensities = /** @class */ (function (_super) {
    __extends(MultiBandIntensities, _super);
    function MultiBandIntensities(frequencyBands, divideByBandWidth) {
        if (divideByBandWidth === void 0) { divideByBandWidth = false; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.frequencyBands = frequencyBands;
        _this.bandWidths = frequencyBands.map(function (band) { return band.hi - band.lo; });
        _this.semitoneBandWidths = frequencyBands.map(function (band) { return pitchConversion_1.frequencyToMidi(band.hi) - pitchConversion_1.frequencyToMidi(band.lo); });
        return _this;
    }
    MultiBandIntensities.prototype._transform = function (spectrum, encoding, callback) {
        var channelBandIntensities = [];
        var bandIntensities = new Array(this.frequencyBands.length).fill(0);
        for (var c = 0; c < spectrum.numberOfChannels; c++) {
            var data = spectrum.getChannelData(c);
            channelBandIntensities[c] = [];
            // Calculate mean square bin magnitude for each frequency band.
            for (var b in this.frequencyBands) {
                var _a = this.frequencyBands[b], lo = _a.lo, hi = _a.hi;
                var bin0 = Math.floor(spectrum.binOfFrequency(lo));
                var bin1 = Math.floor(spectrum.binOfFrequency(hi));
                var sumSq = 0;
                for (var bin = bin0; bin < bin1; bin++)
                    sumSq += sq(data[bin * 2]) + sq(data[bin * 2 + 1]);
                var meanSq = sumSq; // / (bin1-bin0)
                channelBandIntensities[c][b] = meanSq;
                bandIntensities[b] += meanSq;
            }
        }
        // Convert square sum intensities to RMS
        for (var b in bandIntensities)
            bandIntensities[b] = bandIntensities[b] / spectrum.numberOfChannels;
        callback(null, {
            time: spectrum.time,
            sampleRate: spectrum.sampleRate,
            Seconds: spectrum.time / spectrum.sampleRate,
            bandIntensities: bandIntensities,
            channelBandIntensities: channelBandIntensities,
            bandWidths: this.bandWidths,
        });
    };
    return MultiBandIntensities;
}(stream_1.Transform));
exports.MultiBandIntensities = MultiBandIntensities;
