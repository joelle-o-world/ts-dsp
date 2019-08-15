import { TransformCallback } from "stream";

const Speaker = require('speaker')

const {Transform} = require("stream")


class ToBuffer extends Transform {
  bitDepth: number;
  byteDepth: number;
  scaleFloats: number;

  constructor(bitDepth=16) {
    super({readableObjectMode:false, writableObjectMode:true})
    this.bitDepth = bitDepth
    this.byteDepth = this.bitDepth/8
    this.scaleFloats = Math.pow(2, this.bitDepth-3)
  }
  _transform(audio:AudioBuffer, encoding:null, callback:TransformCallback) {
    var buffer = new Buffer(this.byteDepth * audio.length)

    let signal = audio.getChannelData(0)
    for(var i=0; i<signal.length; i++) {
      buffer.writeInt16LE(signal[i] * this.scaleFloats, i*this.byteDepth)
    }

    callback(null, buffer)
  }
}

/**
 * Play an AudioBuffer stream to the node speakers.
 * Use for line checking/debugging only.
 */
function lineCheck(stream:any, sampleRate=44100, bitDepth=16) {
  stream.pipe(new ToBuffer(bitDepth))
    .pipe(new Speaker({
      channels: 1,
      sampleRate: sampleRate,
      bitDepth: bitDepth,
    }))
}

export default lineCheck;
