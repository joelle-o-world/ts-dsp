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
/** Calculate the RMS of incoming audio chunks */
var RMS = /** @class */ (function (_super) {
    __extends(RMS, _super);
    function RMS() {
        return _super.call(this, { objectMode: true }) || this;
    }
    RMS.prototype._transform = function (chunk, encoding, callback) {
        // Calculate mean square for each channel
        var meanSqByChannel = new Array(chunk.numberOfChannels);
        for (var c = 0; c < chunk.numberOfChannels; c++) {
            var pcmdata = chunk.getChannelData(c);
            var sumSq = 0;
            for (var i = 0; i < pcmdata.length; i++)
                sumSq += sq(pcmdata[i]);
            meanSqByChannel[c] = sumSq / pcmdata.length;
        }
        var overallMeanSq = meanSqByChannel
            .reduce(function (a, b) { return a + b; })
            / chunk.numberOfChannels;
        var rms = Math.sqrt(overallMeanSq);
        var rmsByChannel = meanSqByChannel.map(Math.sqrt);
        // Check for NaN error
        if (isNaN(rms)) {
            console.error(
            // @ts-ignore
            'RMS stream produced NaN value at ', chunk.time + 'smp', 
            //@ts-ignore
            '(' + chunk.time / chunk.sampleRate + ') seconds');
        }
        callback(null, {
            rms: rms,
            rmsByChannel: rmsByChannel,
            // @ts-ignore
            time: chunk.time,
            sampleRate: chunk.sampleRate
        });
    };
    return RMS;
}(stream_1.Transform));
exports.RMS = RMS;
