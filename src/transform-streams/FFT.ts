import * as FFTJS from 'fft.js';
import {Transform, TransformCallback} from 'stream';
import {SpectralBuffer} from '../SpectralBuffer';
import { Smp } from '../global';

/**
 *  Transform stream for converting a pre-windowed AudioBuffer object-stream to spectral data.
 *  @returns SpectralBuffer object-stream
 */
class FFT extends Transform {
  windowSize: Smp;
  frameSize: Smp;
  fftFunction: any;

  constructor(windowSize=2048) {
    super({objectMode:true})
    this.windowSize = windowSize
    this.frameSize = this.windowSize * 2
    this.fftFunction = new FFTJS(this.windowSize)
  }

  _transform(audio:AudioBuffer, encoding:string, callback:TransformCallback) {
    if(audio.numberOfChannels != 1)
      throw "FastFourierTransform expects mono input"
    if(audio.length != this.windowSize)
      throw "FastFourierTransform recieved chunk of incorrect size: " + audio.length

    let channelData = []
    for(let c=0; c<audio.numberOfChannels; c++) {
      let signal = audio.getChannelData(c)
      let bins = new Array(this.frameSize)
      this.fftFunction.realTransform(bins, signal)
      this.fftFunction.completeSpectrum(bins)
      channelData[c] = bins
    }

    let spectrum = SpectralBuffer.fromArray(
      channelData, audio.sampleRate
    )
    // @ts-ignore
    spectrum.time = audio.time
    callback(null, spectrum)
  }
}
export {FFT}
