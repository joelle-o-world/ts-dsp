import { Transform, TransformCallback } from "stream";
import { Smp, Hz } from "../global";

interface MeanSquareChunk {
  meanSquare:number;
  meanSquareByChannel: number[];
  time: Smp;
  sampleRate:Hz;
}

const sq = (x:number) => x*x

/** Calculate the mean square of incoming audio chunks */
class MeanSquare extends Transform {
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

    // Check for NaN error
    if(isNaN(overallMeanSq)) {
      console.error(
        // @ts-ignore
        'MeanSquare stream produced NaN value at ', chunk.time+'smp',
        //@ts-ignore
        '('+chunk.time/chunk.sampleRate+') seconds'
      )
    }

    callback(null, {
      meanSquare: overallMeanSq, 
      meanSquareByChannel: meanSqByChannel, 
      // @ts-ignore
      time: chunk.time, 
      sampleRate: chunk.sampleRate
    })
  }
}
export {MeanSquare, MeanSquareChunk}