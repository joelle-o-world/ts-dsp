import { Transform, TransformCallback } from "stream";
import * as AudioBuffer from 'audiobuffer'

const sq = (x:number) => x*x

/** Calculate the RMS of incoming audio chunks */
class RMS extends Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(chunk:AudioBuffer, encoding:string, callback:TransformCallback) {
    // Calculate mean square for each channel
    let meanSqByChannel = new Array(chunk.numberOfChannels)
    for(let c=0; c<chunk.numberOfChannels; c++) {
      let pcmdata = chunk.getChannelData(c)
      let sumSq = 0
      for(let i=0; i<pcmdata.length; i++)
        sumSq += sq(pcmdata[i])
      meanSqByChannel[c] = sumSq / pcmdata.length
    }

    let overallMeanSq = meanSqByChannel
      .reduce((a,b) => a+b)
      / chunk.numberOfChannels
    let rms = Math.sqrt(overallMeanSq)
    let rmsByChannel = meanSqByChannel.map(Math.sqrt)

    // Check for NaN error
    if(isNaN(rms)) {
      console.error(
        // @ts-ignore
        'RMS stream produced NaN value at ', chunk.time+'smp',
        //@ts-ignore
        '('+chunk.time/chunk.sampleRate+') seconds'
      )
    }

    callback(null, {
      rms, 
      rmsByChannel, 
      // @ts-ignore
      time: chunk.time, 
      sampleRate: chunk.sampleRate
    })
  }
}
export {RMS}