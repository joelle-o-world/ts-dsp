import { Transform, TransformCallback } from "stream";
import { SpectralMagnitudesChunk } from "./SpectralMagnitudes";

interface SpectralFlatnessChunk {
  /** The spectral flatness of the signal frame. */
  flatness: number;
  flatnessByChannel?: number[];
  /** The (onset) time of the signal frame in samples. */
  time: Smp;
  /** Sampling frequency at which fft was performed. */
  sampleRate:Hz;
}

/** Calculate the flatness of a SpectralMagnitudes stream. Please pipe directly
 * from a (Mono)SpectralMagnitudes object.
 * Can be used as a measure of noisiness.
*/
class MonoSpectralFlatness extends Transform {
  constructor() {
    super({objectMode: true})
  }

  _transform(
    chunk:SpectralMagnitudesChunk, encoding:string, callback:TransformCallback
  ) {
    const {magnitudes} = chunk

    // Calculate arithmetic & geometric means of spectral magnitudes.
    let sum = 0
    let product = 1
    for(let m of magnitudes) {
      sum += m
      product *= m
    }
    let arithmeticMean = sum / magnitudes.length
    let geometricMean = Math.pow(product, 1/magnitudes.length)
    
    // Spectral flatness is the ratio of arithmetic to geometric mean
    let flatness = geometricMean / arithmeticMean

    callback(null, {
      flatness,
      time: chunk.time,
      sampleRate: chunk.sampleRate,
    } as SpectralFlatnessChunk)
  }
}
export {MonoSpectralFlatness, SpectralFlatnessChunk}