import { Transform, TransformCallback } from "stream";
import * as AudioBuffer from 'audiobuffer';

/** 
 * A band pass filter using simple moving average low pass filters.
 * https://www.gaussianwaves.com/2010/11/moving-average-filter-ma-filter-2/
 * (To support old waveforms, not a very good audio filter.)
 * */
class MovingAverageBandPassFilter extends Transform {
  /** Lower frequency cut-off */
  private lo: Hz;
  /** Higher frequency cut-off */
  private hi: Hz;
  /** Length of first (high pass) moving average */
  private loAvLen: Smp;
  /** Length of second (low-pass) moving average */
  private hiAvLen: Smp;
  private sampleRate: Hz;
  private loSum: number[];
  private hiSum: number[];
  private loBuffer: number[][]
  private hiBuffer: number[][]

  constructor(lo:Hz, hi:Hz) {
    super({objectMode: true})
    this.lo = lo
    this.hi = hi
  }

  /** Calculate moving average lengths based on sample rate of incoming PCM audio. */
  private setup(sr:Hz, numberOfChannels:number) {
    this.sampleRate = sr
    this.loAvLen = Math.ceil(sr * 0.443 / this.lo)
    this.hiAvLen = Math.ceil(sr * 0.443 / this.hi)
    this.loBuffer = []
    this.hiBuffer = []
    this.loSum = []
    this.hiSum = []
    for(let c=0; c<numberOfChannels; c++) {
      this.loBuffer[c] = []
      this.hiBuffer[c] = []
      this.loSum[c] = 0
      this.hiSum[c] = 0
    }
  }

  /** Apply filter to incoming audio chunk. */
  _transform(audio:AudioBuffer, encoding:string, callback:TransformCallback) {
    if(!this.sampleRate)
      this.setup(audio.sampleRate, audio.numberOfChannels)

    let outChannelData:Float32Array[] = []
    for(let c=0; c<audio.numberOfChannels; c++) {
      let pcmdata = audio.getChannelData(c)
      let outdata = outChannelData[c] =  new Float32Array(pcmdata.length)
      for(let t=0; t<pcmdata.length; t++) {
        let y = pcmdata[t]

        this.loSum[c] += y
        this.loBuffer[c].push(y)
        if(this.loBuffer[c].length > this.loAvLen)
          this.loSum[c] -= this.loBuffer[c].shift() as number

        this.hiSum[c] += y
        this.hiBuffer[c].push(y)
        if(this.hiBuffer[c].length > this.hiAvLen)
          this.hiSum[c] -= this.hiBuffer[c].shift() as number
        
        outdata[t] = (this.hiSum[c]/this.hiAvLen)-(this.loSum[c] / this.loAvLen)
      }
    }

    const audioOut = AudioBuffer.fromArray(
      outChannelData, this.sampleRate
    )
    // @ts-ignore
    audioOut.time = audio.time
    callback(null, audioOut)
  }
}
export {MovingAverageBandPassFilter}