import * as AudioBuffer from "audiobuffer"
import { Transform, TransformCallback } from "stream";

/** Applies an envelope to AudioChunks to prepare them for FFT. */
class Windower extends Transform {
  windowSize: number;
  envelopeType: EnvelopeType;
  envelopeName: any;
  envelope: any;
  static envelopes: {[propName: string]: Float32Array};
  static envelopeFunctions: { "hamming": (n: number, N: number) => number; };
  
  constructor(windowSize=2048, envelopeType:EnvelopeType="hamming") {
    super({objectMode: true})

    this.windowSize = windowSize
    this.envelopeType = envelopeType
    this.envelopeName = this.envelopeType + this.windowSize

    this.envelope = Windower.getEnvelope(this.windowSize, this.envelopeType)
  }

  _transform(audio:AudioBuffer, encoding:String, callback: TransformCallback) {
    if(audio.length != this.windowSize)
      throw "Windower has recieved chunk of wrong size ("+audio.length+")"

    let out = []
    for(let c=0; c<audio.numberOfChannels; c++) {
      let signal = audio.getChannelData(c)
      out[c] = new Array(audio.length)
      for(var t=0; t<this.windowSize; t++)
        out[c][t] = signal[t] * this.envelope[t]
      }

    let audio2 = AudioBuffer.fromArray(
      out, audio.sampleRate
    )
    // @ts-ignore
    audio2.time = audio.time

    callback(null, audio2)
  }

  static getEnvelope(size:number, type:EnvelopeType) {
    var F = Windower.envelopeFunctions[type]
    if(!F)
      throw "Window type \'"+type+"\' is not defined."
    var name = type + size
    if(Windower.envelopes[name])
      return Windower.envelopes[name]
  
    var env = new Float32Array(size)
    for(var n=0; n<size; n++)
      env[n] = F(n, size)
  
    Windower.envelopes[name] = env
    return env
  }
}
export default Windower;

Windower.envelopes = {}
Windower.envelopeFunctions = {
  "hamming": (n:number, N:number) => {
    return Math.pow( Math.sin((Math.PI * n) / (N-1)) , 2 )
  }
}


