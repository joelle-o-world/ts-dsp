const k1 = 12 / Math.log(2)
const k2 = 4/55 * Math.pow(2,(3/4))

/** Convert a frequency in Hz into a MIDI pitch number */
function frequencyToMidi(f:Hz):MidiPitch {
  return k1 * Math.log(k2 * f)
}
export {frequencyToMidi}