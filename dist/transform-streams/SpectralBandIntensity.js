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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var sq = function (x) { return x * x; };
/** Measure the intensity of a given frequency band in a SpectralBuffer stream. */
var SpectralBandIntensity = /** @class */ (function (_super) {
    __extends(SpectralBandIntensity, _super);
    function SpectralBandIntensity(lowerBound, upperBound) {
        if (lowerBound === void 0) { lowerBound = 0; }
        if (upperBound === void 0) { upperBound = 22100; }
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.lowerBound = lowerBound;
        _this.upperBound = upperBound;
        return _this;
    }
    SpectralBandIntensity.prototype._transform = function (spectrum, encoding, callback) {
        var e_1, _a;
        var bin0 = Math.floor(spectrum.binOfFrequency(this.lowerBound));
        var bin1 = Math.floor(spectrum.binOfFrequency(this.upperBound));
        var channelIntensities = [];
        for (var c = 0; c < spectrum.numberOfChannels; c++) {
            var data = spectrum.getChannelData(c);
            var sum = 0;
            for (var bin = bin0; bin < bin1; bin++) {
                var mag = Math.sqrt(sq(data[bin * 2]) + sq(data[bin * 2 + 1]));
                sum += mag;
            }
            channelIntensities[c] = sum / (bin1 - bin0);
        }
        var intensity = 0;
        try {
            for (var channelIntensities_1 = __values(channelIntensities), channelIntensities_1_1 = channelIntensities_1.next(); !channelIntensities_1_1.done; channelIntensities_1_1 = channelIntensities_1.next()) {
                var I = channelIntensities_1_1.value;
                intensity += I;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (channelIntensities_1_1 && !channelIntensities_1_1.done && (_a = channelIntensities_1.return)) _a.call(channelIntensities_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        intensity /= spectrum.numberOfChannels;
        callback(null, {
            time: spectrum.time,
            sampleRate: spectrum.sampleRate,
            intensity: intensity,
            bandWidthInBins: bin1 - bin0,
            channelIntensities: channelIntensities,
        });
    };
    return SpectralBandIntensity;
}(stream_1.Transform));
exports.SpectralBandIntensity = SpectralBandIntensity;
