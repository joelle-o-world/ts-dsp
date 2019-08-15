import { Readable } from "stream";

function assertAudioBuffer(audio:any):audio is AudioBuffer {
  return audio.length
    && audio.getChannelData
    && audio.sampleRate
    && audio.numberOfChannels
    && audio.duration
}
export {assertAudioBuffer}