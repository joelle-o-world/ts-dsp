import { Readable } from "stream";
import {Hopper} from "../transform-streams/Hopper";
import {Windower} from "../transform-streams/Windower";
import {FFT} from "../transform-streams/FFT";
import {SpectralFlux} from "../transform-streams/SpectralFlux";
import PeakFinder from "./PeakFinder";
import IOIHistogram from "./IOIHistogram";
import BeatAgentGroup from "./BeatAgentGroup";
import * as AudioBuffer from 'audiobuffer'
import BeatAgent from "./BeatAgent";
import { Smp, Hz, Seconds } from "../global";

declare interface BeatTrackingConfig {
  /** Size of fft frame to use. */
  windowSize?:Smp;
  /** Interval between FFT frames. */
  hopSize?:Smp;
  /** @deprecated */
  sampleRate?:Hz
  
  // Peak finding params:
  peakFindingDecayRate?: number,
  /** (measured in hops) */
  peakFindingWindow?: number,
  peakFindingMeanWndMultiplier?: number,
  /** Threshold over which (normalised) spectral flux could be regarded as a peak. */
  peakThreshold?: 0.35
}

declare interface BeatTrackingAnalysis {
  /** Best estimate of beats per minute. */
  bpm: number;

  /** List of estimated beat times. */
  beats: Seconds[];

  /** List of peak times. */
  onsets: {time:Seconds, intensity:number}[];

  /** Agents used  */
  agents: BeatAgent[];

  /** @deprecated */
  spectralFlux?: number[]|null;
  /** @deprecated */
  ioiHistogram?: IOIHistogram;
  /** @deprecated */
  hopSize?: number;

  /** Parameters used to make the analysis. */
  config: BeatTrackingConfig;
}

/** Perform beat tracking on a given AudioBuffer or AudioBuffer object-stream. */
async function doBeatTracking(
  audio: Readable | AudioBuffer, 
  {
    windowSize=2048,
    hopSize = 441,
    sampleRate=44100,
    
    // Peak finding params:
    peakFindingDecayRate = 0.84,
    peakFindingWindow = 6,
    peakFindingMeanWndMultiplier = 3,
    peakThreshold = 0.35,
  }:BeatTrackingConfig = {},
  /** Deprecated. */
  returnExtras:boolean=false,
):Promise<BeatTrackingAnalysis> {
  // Create a hopper to get overlapping audio frames.
  let hopper = new Hopper(windowSize, hopSize)

  // Detect type of input argument and pass to the hopper accordingly.
  if(audio instanceof Readable) {
    // Arg is a readable AudioBuffer object stream. Pipe to hopper.
    audio.pipe(hopper)
  } 
  else if(audio instanceof AudioBuffer || audio.getChannelData) {
    // Arg is pre-decoded audio buffer. Write directly to hopper.
    hopper.end(audio)
  } else
    throw 'Unable to handle input'

  // Pipe the hopper to a windower, to avoid artefacts in the FFT.
  let windower = new Windower(windowSize, 'hamming')
  hopper.pipe(windower)

  // Pipe windower to an FFT.
  let fft = new FFT(windowSize)
  windower.pipe(fft)

  // Pipe spectral data to spectral flux analyser.
  let flux = new SpectralFlux()
  fft.pipe(flux)
  let fluxArray:number[] | null = returnExtras ? []: null

  // Find peaks in the spectral flux signal.
  let peakFinder = new PeakFinder({ 
    decayRate: peakFindingDecayRate, 
    peakFindingWindow, 
    meanWndMultiplier: peakFindingMeanWndMultiplier, 
    peakThreshold, 
  })
  let onsets:{time:Seconds, intensity:number}[] = []
  peakFinder.interval = hopSize / sampleRate
  flux.on('data', ({spectralFlux}) => {
    peakFinder.data(spectralFlux)
    if(fluxArray)
      fluxArray.push(spectralFlux)
  })

  // Collate inter-onset-interval histogram.
  let histogram = new IOIHistogram
  peakFinder.on('peak', (peakTime:Seconds, intensity:number) => {
    histogram.data(peakTime)
    onsets.push({time:peakTime, intensity})
  })

  // Wait for all data to be processed
  await new Promise(resolve => flux.on('finish', resolve));

  // Flush peakFinder and ioi histogram.
  peakFinder.flush()
  histogram.flush()

  // Perform agent based beat tracking using tempo hypotheses.
  let tempoList = histogram.createTempoList()
  let agents = new BeatAgentGroup(tempoList)
  for(let {time, intensity} of onsets)
    agents.considerEvent(time, intensity)
  
  // Choose best agent and find bpm
  let bestAgent = agents.winningAgent
  bestAgent.fillBeats()
  let bpm = bestAgent.bpm
  let beats = bestAgent.events
  
  histogram.maxIOI

  const out:BeatTrackingAnalysis =  {
    bpm,
    beats,
    onsets,
    agents: agents.agents.slice(),
    config: {
      windowSize,
      hopSize,
      sampleRate,
      peakFindingDecayRate,
      peakFindingMeanWndMultiplier,
      peakFindingWindow,
      peakThreshold,
    },
  }

  if(returnExtras) {
    out.spectralFlux = fluxArray
    out.ioiHistogram = histogram
    out.hopSize = hopSize
  }

  return out
}

export { doBeatTracking, BeatTrackingAnalysis, BeatTrackingConfig}