import { Readable, PassThrough } from "stream";
import { MovingAverageBandPassFilter } from "./transform-streams/MovingAverageBandPassFilter";
import { RMS } from "./transform-streams/RMS";
import {Hopper} from "./transform-streams/Hopper";
import { assertAudioBuffer } from "./assertAudioBuffer";

type OutputFormat = {
  time: Smp
  sampleRate: Hz
  Seconds: Seconds
  intensity:number|null
  bandIntensities: number[]
  channelBandIntensities?: number[][]
  bandWidths: Hz[]
}

/** Get multi band intensity stream using moving average filters. */
function multiBandIntensitiesMA(
  audio:Readable | AudioBuffer, 
  bands:FrequencyBand[], 
  windowSize:Smp, 
  hopSize: Smp = windowSize,
  calculateOverallIntensity = true,
){ 
  if(assertAudioBuffer(audio))
    audio = Hopper.streamifyBuffer(audio)

  // Set up combination queue and output stream,
  const bandWidths = bands.map(({lo, hi}) => hi - lo)
  const waitingChunks:any[] = bands.map(() => [])
  const outStream = new PassThrough({objectMode:true})
  function combineChunks() {
    // While there are items in each queue,
    while(waitingChunks.every(queue => queue.length)) {
      // Shift the first item off each queue,
      let toCombine = waitingChunks.map(queue => queue.shift() as any)

      // Check that the times match,
      let time = toCombine[0].time
      if(toCombine.some(chunk => chunk.time != time))
        throw 'Something went wrong with the multiband intensities queue'

      // Check for NaN error,
      if(toCombine.some(chunk => isNaN(chunk.rms)))
        throw 'multiBandIntensitiesMA() produced NaN value: ' 
          + toCombine.map(chunk => JSON.stringify(chunk))

      // Pop overall intensity if exists,
      let intensity:number|null = null
      if(calculateOverallIntensity)
        intensity = toCombine.pop().rms

      // Combine
      let out:OutputFormat = {
        time,
        sampleRate: toCombine[0].sampleRate,
        Seconds: time/toCombine[0].sampleRate,
        intensity,
        bandIntensities: toCombine.map(chunk => chunk.rms),
        // TODO: add channel band intensities
        bandWidths,
      }
      outStream.write(out)
    }
  }

  // Create filters,
  for(const b in bands) {
    let {lo, hi} = bands[b]
    let filter = new MovingAverageBandPassFilter(lo, hi)
    let hopper = new Hopper(windowSize, hopSize)
    let rms = new RMS
    audio.pipe(filter).pipe(hopper).pipe(rms)
    rms.on('data', chunk => {
      waitingChunks[b].push(chunk)
      combineChunks()
    })
  }
  if(calculateOverallIntensity) {
    const b = bands.length
    waitingChunks.push([])
    let hopper = new Hopper(windowSize, hopSize)
    let rms = new RMS
    audio.pipe(hopper).pipe(rms)
    rms.on('data', chunk => {
      waitingChunks[b].push(chunk)
      combineChunks()
    })
  }

  // At end of data
  audio.on('finish', () => outStream.end())

  return outStream
}
export {multiBandIntensitiesMA}