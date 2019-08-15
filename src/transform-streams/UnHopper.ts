import * as AudioBuffer from 'audiobuffer'
import { Transform, TransformCallback} from 'stream';

/** Recombines overlapping AudioBuffer chunks (probably from IFFT). */
class UnHopper extends Transform {
  frameSize: number;
  hopSize: number;
  time: number;
  buffer: number[];
  writeHead: number;

  constructor(frameSize=2048, hopSize=441) {
    super({objectMode:true})

    this.frameSize = frameSize
    this.hopSize = hopSize
    this.time = 0

    this.buffer = new Array(frameSize).fill(0)
    this.writeHead = 0
  }

  _transform(audio:AudioBuffer, encoding:String, callback: TransformCallback) {
    // TODO: multichannel support

    let signal = audio.getChannelData(0)

    for(let t=0; t<audio.length; t++)
      this.buffer[(this.writeHead+t)%this.buffer.length] += signal[t]
    this.writeHead += this.hopSize

    if(this.writeHead > this.hopSize) { // surely this is never false?
      let from = (this.writeHead-this.hopSize) % this.buffer.length
      let to = this.writeHead % this.buffer.length

      let out
      if(from > to) {
        // concatting two slices
        out = this.buffer.slice(from)
          .concat(this.buffer.slice(0, to))

        this.buffer
          .fill(0,from)
          .fill(0, 0, to)

      } else {
        // use just one slice
        out = this.buffer.slice(from, to)
        this.buffer.fill(0, from, to)
      }

      let audio2 = AudioBuffer.fromArray(
        [out], audio.sampleRate,
      )
      audio2.time = this.time
      this.time += audio2.length
      this.push(audio2)
    }
    callback()
  }
}
export {UnHopper}