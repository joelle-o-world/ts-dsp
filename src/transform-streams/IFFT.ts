import * as FFT from 'fft.js';
import {Transform, TransformCallback} from 'stream'
import * as AudioBuffer from 'audiobuffer'
import {SpectralBuffer} from '../SpectralBuffer';
import { Smp } from '../global';

/**
 * Inverse fast fourier transform stream. Convert SpectralBuffer object stream to overlapping AudioBuffer stream.
 */
class IFFT extends Transform {
  windowSize: Smp;
  frameSize: Smp;
  fftFunction: any;

  constructor(windowSize=2048) {
    super({objectMode: true})
    this.windowSize = windowSize
    this.frameSize = 2 * this.windowSize
    this.fftFunction = new FFT(this.windowSize)
  }

  _transform(spectrum: SpectralBuffer, encoding:string, callback:TransformCallback) {
    if(spectrum.frameSize != this.frameSize)
      throw "IFFT recieved chunk of unexpected size: "+ spectrum.frameSize

    let channelData = []
    for(let c=0; c<spectrum.numberOfChannels; c++) {
      let pcmBuffer = new Array(this.frameSize)
      this.fftFunction.inverseTransform(pcmBuffer, spectrum.getChannelData(c))
      let realBuffer = new Array(this.windowSize)
      for(var i=0; i<this.windowSize; i++)
        realBuffer[i] = pcmBuffer[2*i]

      channelData[c] = realBuffer
    }

    let outBuffer = AudioBuffer.fromArray(channelData, spectrum.sampleRate)
    outBuffer.time = spectrum.time
    callback(
      null,
      outBuffer
    )
  }
}
export {IFFT}
