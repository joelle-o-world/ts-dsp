import {SpectralBuffer} from "../SpectralBuffer";
import {Transform, TransformCallback} from 'stream'

/*The spectral centroid is a measure used in digital signal processing to characterise a spectrum. It indicates where the "center of mass" of the spectrum is located. Perceptually, it has a robust connection with the impression of "brightness" of a sound. [Wikipedia]*/

const sq = (x:number) => x * x
const twelveOverLog2 = 12 / Math.log(2)
const c = 1

declare interface SpectralCentroidChunk {
  time: Smp,
  centroidBin: number,
  centroidFrequency: Hz,
  centroidPitch: number,
}

/** Measures the spectral centroid of a SpectralBuffer stream */
class SpectralCentroid extends Transform {
  constructor() {
    super({objectMode:true})
  }

  _transform(spectrum:SpectralBuffer, encoding:string, callback:TransformCallback) {
    let binsum = 0
    let sum = 0
    let frame = spectrum.getChannelData(0)
    for(let bin=0; bin+1<frame.length/2; bin+=2) {
      let mag = Math.sqrt(sq(frame[bin]) + sq(frame[bin+1]))
      binsum += bin/2 * mag
      sum += mag
    }


    let centroidBin = sum > 0 ? binsum/sum : frame.length/8
    let centroidFrequency = spectrum.binFrequency(centroidBin)
    let centroidPitch = twelveOverLog2 * Math.log(centroidFrequency * c)

    callback(null, {
      time: spectrum.time,
      centroidBin: centroidBin,
      centroidFrequency: centroidFrequency,
      centroidPitch: centroidPitch,
    })
  }
}

export default SpectralCentroid
export {SpectralCentroid}
