import { Smp, Hz } from "../global";

/** Data chunk emitted by SpectralBandIntensity */
declare interface BandIntensityChunk {
  time:Smp;
  sampleRate: Hz;
  intensity: number;
  bandWidthInBins?: number;
  channelIntensities?: number[];
}