# ts-dsp
A collection of digital signal processing tools written in typescript. These classes mostly extend the node stream API.

For a more versatile set of DSP objects for audio synthesis see http://github.com/joelyjoel/dusp

## Transform Streams Reference
### FFT
Performs fast fourier transform on incoming (pre-windowed signal chunks). Output signal chunks are `SpectralBuffer`s.

### Hopper
Take overlapping (or spaced) windows from a continuous time domain audio signal.

### IFFT
Inverse fast fourier transform.

### MeanSquare
Calculates the mean square (`(∑x^2)/n`) of each signal chunk.

### MovingAverageBandPassFilter
Band pass filter using moving average hi/lo pass filters. Neither efficient nor effective, kept to support DeepDrive waveform scripts.

### MultiBandIntensities
Calculates band intensities for multiple frequency bands using a set of `MovingAverageBandPassFilter`s in parallel.

### RMS
Calculate the root mean square of each incoming signal chunk.

### SpectralBandIntensities
### SpectralBandIntensity
### SpectralCentroid
### SpectralFlatness
### SpectralFlux
### SpectralMagnitudes
### UnHopper
### Windower
