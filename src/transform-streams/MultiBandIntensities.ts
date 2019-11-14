import { Transform, TransformCallback } from "stream";
import {SpectralBuffer} from "../SpectralBuffer";
import { frequencyToMidi } from "../util/pitchConversion";
import { FrequencyBand, Hz, MidiPitch } from "../global";

const sq = (x:number) => x * x

/** Calculate the (mean-square) intensities for multiply frequency bands given spectral data */
class MultiBandIntensities extends Transform {
  frequencyBands: FrequencyBand[];
  bandWidths: Hz[];
  semitoneBandWidths: MidiPitch[];

  constructor(frequencyBands:FrequencyBand[], divideByBandWidth=false) {
    super({objectMode: true})
    this.frequencyBands = frequencyBands
    this.bandWidths = frequencyBands.map(band => band.hi - band.lo)
    this.semitoneBandWidths = frequencyBands.map(
      band => frequencyToMidi(band.hi) - frequencyToMidi(band.lo)
    )
  }

  _transform(spectrum:SpectralBuffer, encoding:string, callback:TransformCallback) {
    const channelBandIntensities:number[][] = []
    const bandIntensities:number[] = new Array(this.frequencyBands.length).fill(0)
    for(let c=0; c<spectrum.numberOfChannels; c++) {
      const data = spectrum.getChannelData(c)
      channelBandIntensities[c] = []

      // Calculate mean square bin magnitude for each frequency band.
      for(let b in this.frequencyBands) {
        let {lo, hi} = this.frequencyBands[b]
        let bin0 = Math.floor(spectrum.binOfFrequency(lo))
        let bin1 = Math.floor(spectrum.binOfFrequency(hi))

        let sumSq = 0
        for(let bin=bin0; bin<bin1; bin++)
          sumSq += sq(data[bin*2]) + sq(data[bin*2 + 1])
        
        let meanSq = sumSq// / (bin1-bin0)
        channelBandIntensities[c][b] = meanSq
        bandIntensities[b] += meanSq
      }
    }

    // Convert square sum intensities to RMS
    for(let b in bandIntensities)
      bandIntensities[b] = bandIntensities[b] / spectrum.numberOfChannels

    callback(null, {
      time: spectrum.time,
      sampleRate: spectrum.sampleRate,
      Seconds: spectrum.time/spectrum.sampleRate,
      bandIntensities,
      channelBandIntensities,
      bandWidths: this.bandWidths,
    })
  }
}
export { MultiBandIntensities }