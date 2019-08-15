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
/** Calculate the flatness of a SpectralMagnitudes stream. Please pipe directly
 * from a (Mono)SpectralMagnitudes object.
 * Can be used as a measure of noisiness.
*/
var MonoSpectralFlatness = /** @class */ (function (_super) {
    __extends(MonoSpectralFlatness, _super);
    function MonoSpectralFlatness() {
        return _super.call(this, { objectMode: true }) || this;
    }
    MonoSpectralFlatness.prototype._transform = function (chunk, encoding, callback) {
        var e_1, _a;
        var magnitudes = chunk.magnitudes;
        // Calculate arithmetic & geometric means of spectral magnitudes.
        var sum = 0;
        var product = 1;
        try {
            for (var magnitudes_1 = __values(magnitudes), magnitudes_1_1 = magnitudes_1.next(); !magnitudes_1_1.done; magnitudes_1_1 = magnitudes_1.next()) {
                var m = magnitudes_1_1.value;
                sum += m;
                product *= m;
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (magnitudes_1_1 && !magnitudes_1_1.done && (_a = magnitudes_1.return)) _a.call(magnitudes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        var arithmeticMean = sum / magnitudes.length;
        var geometricMean = Math.pow(product, 1 / magnitudes.length);
        // Spectral flatness is the ratio of arithmetic to geometric mean
        var flatness = geometricMean / arithmeticMean;
        callback(null, {
            flatness: flatness,
            time: chunk.time,
            sampleRate: chunk.sampleRate,
        });
    };
    return MonoSpectralFlatness;
}(stream_1.Transform));
exports.MonoSpectralFlatness = MonoSpectralFlatness;
