"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var k1 = 12 / Math.log(2);
var k2 = 4 / 55 * Math.pow(2, (3 / 4));
/** Convert a frequency in Hz into a MIDI pitch number */
function frequencyToMidi(f) {
    return k1 * Math.log(k2 * f);
}
exports.frequencyToMidi = frequencyToMidi;
