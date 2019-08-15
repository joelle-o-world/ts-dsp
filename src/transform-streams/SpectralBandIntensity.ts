import SpectralBuffer from "../SpectralBuffer";
import { Transform, TransformCallback } from "stream";

const sq = (x:number) => x*x

/** Measure the intensity of a given frequency band in a SpectralBuffer stream. */
class SpectralBandIntensity extends Transform {
  lowerBound: number;
  upperBound: number;
  constructor(lowerBound=0, upperBound=22100) {
    super({objectMode: true})
    this.lowerBound = lowerBound
    this.upperBound = upperBound
  }

  _transform(spectrum:SpectralBuffer, encoding:string, callback:TransformCallback) {
    let bin0 = Math.floor(spectrum.binOfFrequency(this.lowerBound))
    let bin1 = Math.floor(spectrum.binOfFrequency(this.upperBound))

    let channelIntensities = []
    for(let c=0; c<spectrum.numberOfChannels; c++) {
      let data = spectrum.getChannelData(c)
      let sum = 0
      for(let bin=bin0; bin<bin1; bin++) {
        let mag = Math.sqrt(sq(data[bin*2]) + sq(data[bin*2+1]))
        sum += mag
      }
      channelIntensities[c] = sum/(bin1-bin0)
    }

    let intensity = 0
    for(let I of channelIntensities)
      intensity += I
    intensity /= spectrum.numberOfChannels

    callback(null, {
      time: spectrum.time,
      sampleRate: spectrum.sampleRate,
      intensity: intensity,
      bandWidthInBins: bin1-bin0,
      channelIntensities: channelIntensities,
    })
  }
}

export default SpectralBandIntensity
