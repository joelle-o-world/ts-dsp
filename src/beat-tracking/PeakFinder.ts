import {EventEmitter} from 'events'

/** Find peaks in a sequence of numbers ¿using Schloss's algorithm? */
class PeakFinder extends EventEmitter{
  decayRate: number;
  peakFindingWindow: number;
  meanWndMultiplier: number;
  peakThreshold: number;
  buffer: number[];
  bufferSize: number;
  max: number;
  av: number | null;
  peaks: number[];
  peakIntensities: number[];
  i: number;
  interval: number;

  constructor({
    decayRate = 0.84,
    peakFindingWindow = 6,
    meanWndMultiplier = 3,
    peakThreshold = 0.35,
    interval = 1, // number of seconds between incoming data points
  }={}) {
    super()

    this.decayRate = decayRate
    this.peakFindingWindow = peakFindingWindow
    this.meanWndMultiplier = meanWndMultiplier
    this.peakThreshold = peakThreshold

    this.buffer = []
    this.bufferSize = 1 + peakFindingWindow * (meanWndMultiplier+1)
    this.max = 0
    this.av = null
    this.peaks = []
    this.peakIntensities = []
    this.i = -1
    this.interval = interval
  }

  /** Pass a number, or list of numbers, to the PeakFinder */
  data(y:number|number[]) {
    // add data points
    if(typeof y != 'number'){
      for(let y2 of y)
        this.data(y2)
      return this
    }

    this.i++

    this.buffer.push(y)
    if(this.buffer.length > this.bufferSize)
      this.buffer.shift()

    if(this.buffer.length > this.peakFindingWindow + 1)
      this.processBuffer(this.buffer.length - this.peakFindingWindow - 1)

    return this
  }

  /** Process the internal buffer. */
  private processBuffer(o=this.buffer.length-this.peakFindingWindow - 1) {
    let y:number = this.buffer[o]

    if(this.av == null)
      this.av = y

    this.av = this.decayRate * this.av + (1 - this.decayRate) * y

    // get window size
    let wndStart = o - this.peakFindingWindow
    let wndEnd = o + this.peakFindingWindow + 1

    if(wndStart < 0)
      wndStart = 0
    if(wndEnd > this.buffer.length)
      wndEnd = this.buffer.length
    if(this.av < y) // Don't see what the point of this if statement is..
      this.av = y

    let isMax = true
    for(let j=wndStart; j<wndEnd; j++)
      if(this.buffer[j] > y)
        isMax = false

    if(isMax) {

      let meanWndStart = o - this.peakFindingWindow * this.meanWndMultiplier
      let meanWndEnd = o + this.peakFindingWindow
      if(meanWndStart < 0)
        meanWndStart = 0

      if(meanWndEnd > this.buffer.length)
        meanWndEnd = this.buffer.length

      let sum = 0
      let n = meanWndEnd - meanWndStart
      for(let j=meanWndStart; j<meanWndEnd; j++)
        sum += this.buffer[j]
      let mean = sum / n

      if(y > mean + this.peakThreshold) {
        let index = this.i - this.buffer.length + o + 1
        let time = index * this.interval
        this.emit('peak', time, y)
      }
    }
  }
  
  /** call at the end of the data to flush the buffer. */
  flush() {
    // TODO: Implement flush() (in order to catch onsets in the last few ms)
  }
}

export default PeakFinder
