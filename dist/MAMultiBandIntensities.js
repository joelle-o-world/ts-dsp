"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
var MovingAverageBandPassFilter_1 = require("./transform-streams/MovingAverageBandPassFilter");
var RMS_1 = require("./transform-streams/RMS");
var Hopper_1 = require("./transform-streams/Hopper");
var assertAudioBuffer_1 = require("./assertAudioBuffer");
/** Get multi band intensity stream using moving average filters. */
function multiBandIntensitiesMA(audio, bands, windowSize, hopSize, calculateOverallIntensity) {
    if (hopSize === void 0) { hopSize = windowSize; }
    if (calculateOverallIntensity === void 0) { calculateOverallIntensity = true; }
    if (assertAudioBuffer_1.assertAudioBuffer(audio))
        audio = Hopper_1.Hopper.streamifyBuffer(audio);
    // Set up combination queue and output stream,
    var bandWidths = bands.map(function (_a) {
        var lo = _a.lo, hi = _a.hi;
        return hi - lo;
    });
    var waitingChunks = bands.map(function () { return []; });
    var outStream = new stream_1.PassThrough({ objectMode: true });
    function combineChunks() {
        var _loop_2 = function () {
            // Shift the first item off each queue,
            var toCombine = waitingChunks.map(function (queue) { return queue.shift(); });
            // Check that the times match,
            var time = toCombine[0].time;
            if (toCombine.some(function (chunk) { return chunk.time != time; }))
                throw 'Something went wrong with the multiband intensities queue';
            // Check for NaN error,
            if (toCombine.some(function (chunk) { return isNaN(chunk.rms); }))
                throw 'multiBandIntensitiesMA() produced NaN value: '
                    + toCombine.map(function (chunk) { return JSON.stringify(chunk); });
            // Pop overall intensity if exists,
            var intensity = null;
            if (calculateOverallIntensity)
                intensity = toCombine.pop().rms;
            // Combine
            var out = {
                time: time,
                sampleRate: toCombine[0].sampleRate,
                Seconds: time / toCombine[0].sampleRate,
                intensity: intensity,
                bandIntensities: toCombine.map(function (chunk) { return chunk.rms; }),
                // TODO: add channel band intensities
                bandWidths: bandWidths,
            };
            outStream.write(out);
        };
        // While there are items in each queue,
        while (waitingChunks.every(function (queue) { return queue.length; })) {
            _loop_2();
        }
    }
    var _loop_1 = function (b) {
        var _a = bands[b], lo = _a.lo, hi = _a.hi;
        var filter = new MovingAverageBandPassFilter_1.MovingAverageBandPassFilter(lo, hi);
        var hopper = new Hopper_1.Hopper(windowSize, hopSize);
        var rms = new RMS_1.RMS;
        audio.pipe(filter).pipe(hopper).pipe(rms);
        rms.on('data', function (chunk) {
            waitingChunks[b].push(chunk);
            combineChunks();
        });
    };
    // Create filters,
    for (var b in bands) {
        _loop_1(b);
    }
    if (calculateOverallIntensity) {
        var b_1 = bands.length;
        waitingChunks.push([]);
        var hopper = new Hopper_1.Hopper(windowSize, hopSize);
        var rms = new RMS_1.RMS;
        audio.pipe(hopper).pipe(rms);
        rms.on('data', function (chunk) {
            waitingChunks[b_1].push(chunk);
            combineChunks();
        });
    }
    // At end of data
    audio.on('finish', function () { return outStream.end(); });
    return outStream;
}
exports.multiBandIntensitiesMA = multiBandIntensitiesMA;
