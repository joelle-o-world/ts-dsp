import { TransformCallback } from "stream";
import {SpectralBuffer} from '../SpectralBuffer';
import {Transform} from 'stream'


const sq = (x:number) => x*x
/**
 * Measures the spectral flux of a SpectralBuffer object-stream.
 */
class SpectralFlux extends Transform {
  previousSpectrum: SpectralBuffer | null;
  constructor() {
    super({objectMode:true})
    this.previousSpectrum = null
  }

  _transform(
    spectrum:SpectralBuffer, 
    encoding:string, 
    callback:TransformCallback
  ) {
    let sum = 0
    if(this.previousSpectrum){
      for(let c=0; c<spectrum.numberOfChannels; c++) {
        let A = spectrum.getChannelData(c)
        let B = this.previousSpectrum.getChannelData(c)
        for(let bin=0; bin<A.length; bin++)
          sum += sq(A[bin] - B[bin])
      }

      let flux = Math.sqrt(sum/(spectrum.frameSize*spectrum.numberOfChannels))
      this.push({
        time: spectrum.time,
        spectralFlux: flux,
      })
    }

    this.previousSpectrum = spectrum

    callback()
  }
}

export {SpectralFlux}