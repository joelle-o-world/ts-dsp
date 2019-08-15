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
/**
 * Measures the spectral flux of a SpectralBuffer object-stream.
 */
var SpectralFlux = /** @class */ (function (_super) {
    __extends(SpectralFlux, _super);
    function SpectralFlux() {
        var _this = _super.call(this, { objectMode: true }) || this;
        _this.previousSpectrum = null;
        return _this;
    }
    SpectralFlux.prototype._transform = function (spectrum, encoding, callback) {
        var sum = 0;
        if (this.previousSpectrum) {
            for (var c = 0; c < spectrum.numberOfChannels; c++) {
                var A = spectrum.getChannelData(c);
                var B = this.previousSpectrum.getChannelData(c);
                for (var bin = 0; bin < A.length; bin++)
                    sum += sq(A[bin] - B[bin]);
            }
            var flux = Math.sqrt(sum / (spectrum.frameSize * spectrum.numberOfChannels));
            this.push({
                time: spectrum.time,
                spectralFlux: flux,
            });
        }
        this.previousSpectrum = spectrum;
        callback();
    };
    return SpectralFlux;
}(stream_1.Transform));
exports.default = SpectralFlux;
