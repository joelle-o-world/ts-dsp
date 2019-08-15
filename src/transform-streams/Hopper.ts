

import {Transform, TransformCallback} from 'stream';
import * as AudioBuffer from 'audiobuffer';
/**
 * Transform stream for preparing overlapping/spaced chunks of audio for FFT.
 */
class Hopper extends Transform {
  iWindow: number;
  windowSize: Smp;
  windowBuffer: Float32Array;
  hopSize: Smp;
  iHop: number;
  hopCount: number;

  constructor(windowSize:Smp, hopSize:Smp = windowSize) {
    super({objectMode: true})
    if(!windowSize || !hopSize)
      throw 'Hopper: constructor expects windowSize and hopSize'

    this.iWindow = 0 // index within buffer
    this.windowSize = windowSize
    this.windowBuffer = new Float32Array(this.windowSize)
    this.hopSize = hopSize
    this.iHop = 0
    this.hopCount = 0
  }

  _transform(audio: AudioBuffer, encoding:string, callback: TransformCallback) {
    // TODO: update to support multichannel.
    let signal = audio.getChannelData(0)
    for(var t=0; t<signal.length; t++) {
      this.windowBuffer[this.iWindow] = signal[t]
      this.iWindow = (this.iWindow+1)%this.windowSize
      if(++this.iHop >= this.hopSize) {
        this.iHop = 0
        let newBuffer = new Float32Array(this.windowSize)
        for(var i=this.iWindow, j=0; i<this.windowSize; i++, j++)
          newBuffer[j] = this.windowBuffer[i]
        for(var i=0, j=this.windowSize-this.iWindow; i<this.iWindow; i++, j++)
          newBuffer[j] = this.windowBuffer[i]

        let out = AudioBuffer.fromArray(
          [newBuffer], audio.sampleRate
        )
        out.time = this.hopSize * this.hopCount
        this.hopCount++
        this.push(out)
      }
    }

    // TODO: Implement _flush().
    // TODO: Consider using zero-filled buffer to begin with.

    callback()
  }

  static streamifyBuffer(buffer:AudioBuffer, chunkSize = 8192) {
    let hopper = new Hopper(chunkSize, chunkSize)
    hopper.end(buffer)
    return hopper
  }
}
export default Hopper
