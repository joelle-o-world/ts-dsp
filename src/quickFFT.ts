import {Hopper} from './transform-streams/Hopper'
import {Windower} from './transform-streams/Windower'
import {FFT} from './transform-streams/FFT'
import {IFFT} from './transform-streams/IFFT'
import {UnHopper} from './transform-streams/UnHopper'
import { Readable } from 'stream';

/** Shortcut function for setting up FFT/IFFT */
function quickFFT(stream:Readable | AudioBuffer, windowSize=2048, hopSize=441, envelope:EnvelopeType='hamming') {
  let hopper = new Hopper(windowSize, hopSize)
  let windower = new Windower(windowSize, envelope)
  let fft = new FFT(windowSize)
  hopper.pipe(windower).pipe(fft)

  if(stream instanceof Readable)
    stream.pipe(hopper)
  else
    hopper.end(stream)

  return fft
}

function quickIFFT(stream:any, windowSize=2048, hopSize=441, envelope:EnvelopeType='hamming') {
  return stream
    .pipe(new IFFT(windowSize))
    .pipe(new Windower(windowSize, envelope))
    .pipe(new UnHopper(windowSize, hopSize))
}

export { quickFFT , quickIFFT}