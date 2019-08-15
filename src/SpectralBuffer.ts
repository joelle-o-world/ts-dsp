
/** Stores a single frame of multichannel FFT data. */
class SpectralBuffer {
  private _data:FFTBins[];
  public sampleRate: Hz;
  time: Smp;

  constructor() {
    this.sampleRate
    this._data = []
  }

  get numberOfChannels() {
    return this._data.length
  }

  get frameSize() {
    return this._data[0].length
  }

  get windowSize() {
    return this.frameSize/2
  }

  getChannelData(c:number) {
    if(this._data[c])
      return this._data[c].slice()
    else
      throw "Channel doesn't exist"
  }

  binFrequency(bin:number) {
    return bin * this.sampleRate/this.frameSize
  }

  binOfFrequency(f:Hz) {
    return f * this.frameSize / this.sampleRate
  }

  static fromArray(channelData:FFTBins[], sampleRate:Hz) {
    if(!sampleRate)
      throw 'SpectralBuffer.fromArray expects sample rate'

    let buffer = new SpectralBuffer

    buffer.sampleRate = sampleRate
    buffer._data = channelData

    return buffer
  }
}
export {SpectralBuffer}
