import { Transform, TransformCallback } from "stream";
import SpectralBuffer from "../SpectralBuffer";

const sq = (x:number) => x * x

interface SpectralMagnitudesChunk {
  magnitudes: number[];
  magnitudesByChannel?: number[][];
  time: Smp;
  sampleRate: Hz;
}

class SpectralMagnitudes extends Transform {
  constructor() {
    super({objectMode: true})
  }

  _transform(chunk:SpectralBuffer, encoding:string, callback:TransformCallback){
    // Calculate the magnitude of each complex pair
    let magnitudesByChannel:number[][] = []
    for(let c=0; c<chunk.numberOfChannels; c++) {
      let binData = chunk.getChannelData(c)
      let magnitudes = new Array(chunk.windowSize)
      magnitudesByChannel[c] = magnitudes
      for(let bin=0, i=0; bin<chunk.windowSize; bin++, i+=2)
        magnitudes[bin] = Math.sqrt(sq(binData[i] + binData[i+1]))
    }

    callback(null, {
      magnitudes: magnitudesByChannel[0],
      magnitudesByChannel,
      time: chunk.time,
      sampleRate: chunk.sampleRate
    })
  }
}

class MonoSpectralMagnitudes extends Transform {
  constructor() {
    super({objectMode: true})
  }

  _transform(chunk:SpectralBuffer, encoding:string, callback:TransformCallback){
    // Calculate the magnitude of each complex pair
    let binData = chunk.getChannelData(0)
    let magnitudes = new Array(chunk.windowSize)
    for(let bin=0, i=0; bin<chunk.windowSize; bin++, i+=2)
      magnitudes[bin] = Math.sqrt(sq(binData[i] + binData[i+1]))

    callback(null, {
      magnitudes,
      time: chunk.time,
      sampleRate: chunk.sampleRate
    })
  }
}

export {SpectralMagnitudes, MonoSpectralMagnitudes, SpectralMagnitudesChunk}