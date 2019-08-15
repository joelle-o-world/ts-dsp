/** Time/interval measured in seconds. */
declare type Seconds = number;

/** Time/interval measured in samples. */
declare type Smp = number;

/** A frequency measured in Hz (cycles per second). */
declare type Hz = number
declare type FrequencyBand = {lo:Hz, hi:Hz}

declare type MidiPitch = number

declare type PCMData = number[] | Float32Array;

declare interface AudioChunk {
    channelData: PCMData[],
    sampleRate: Hz,
    time: Smp,
}

declare type FFTBins = number[] | Float32Array;

declare interface SpectralFrame {
    channelData: FFTBins[]
    windowSize: Smp,
    sampleRate: Hz,
    time: Smp,
}

declare type EnvelopeType = "hamming"

declare type AudioPolygon = {
    t0:Smp, t1:Smp,
    I0: number, I1: number,
    bandIntensities: number[],
}