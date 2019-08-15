"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function assertAudioBuffer(audio) {
    return audio.length
        && audio.getChannelData
        && audio.sampleRate
        && audio.numberOfChannels
        && audio.duration;
}
exports.assertAudioBuffer = assertAudioBuffer;
