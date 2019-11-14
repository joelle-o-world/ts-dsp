/** Time/interval measured in seconds. */
export type Seconds = number;

/** Time/interval measured in samples. */
export type Smp = number;

/** A frequency measured in Hz (cycles per second). */
export type Hz = number
export type FrequencyBand = {lo:Hz, hi:Hz}

export type MidiPitch = number

export type PCMData = number[] | Float32Array;

export interface AudioChunk {
    channelData: PCMData[],
    sampleRate: Hz,
    time: Smp,
}

export type FFTBins = number[] | Float32Array;

export interface SpectralFrame {
    channelData: FFTBins[]
    windowSize: Smp,
    sampleRate: Hz,
    time: Smp,
}

export type EnvelopeType = "hamming"

export type AudioPolygon = {
    t0:Smp, t1:Smp,
    I0: number, I1: number,
    bandIntensities: number[],
}