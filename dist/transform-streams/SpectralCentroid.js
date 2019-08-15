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
/*The spectral centroid is a measure used in digital signal processing to characterise a spectrum. It indicates where the "center of mass" of the spectrum is located. Perceptually, it has a robust connection with the impression of "brightness" of a sound. [Wikipedia]*/
var sq = function (x) { return x * x; };
var twelveOverLog2 = 12 / Math.log(2);
var c = 1;
/** Measures the spectral centroid of a SpectralBuffer stream */
var SpectralCentroid = /** @class */ (function (_super) {
    __extends(SpectralCentroid, _super);
    function SpectralCentroid() {
        return _super.call(this, { objectMode: true }) || this;
    }
    SpectralCentroid.prototype._transform = function (spectrum, encoding, callback) {
        var binsum = 0;
        var sum = 0;
        var frame = spectrum.getChannelData(0);
        for (var bin = 0; bin + 1 < frame.length / 2; bin += 2) {
            var mag = Math.sqrt(sq(frame[bin]) + sq(frame[bin + 1]));
            binsum += bin / 2 * mag;
            sum += mag;
        }
        var centroidBin = sum > 0 ? binsum / sum : frame.length / 8;
        var centroidFrequency = spectrum.binFrequency(centroidBin);
        var centroidPitch = twelveOverLog2 * Math.log(centroidFrequency * c);
        callback(null, {
            time: spectrum.time,
            centroidBin: centroidBin,
            centroidFrequency: centroidFrequency,
            centroidPitch: centroidPitch,
        });
    };
    return SpectralCentroid;
}(stream_1.Transform));
exports.SpectralCentroid = SpectralCentroid;
exports.default = SpectralCentroid;
