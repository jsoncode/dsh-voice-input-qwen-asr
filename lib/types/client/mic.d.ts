/**
 * dsh-voice-input —— 麦克风采集（AudioWorklet → PCM16 LE 16kHz 单声道分片）。
 *
 * AudioContext 以 16000Hz 创建（浏览器自动重采样麦克风流）；worklet 内再做一次
 * 兜底线性重采样（context 不支持目标采样率时），累积约 100ms 一片，附 RMS 音量
 * 上报，主线程经 WebSocket 推给宿主中继。
 */
export interface MicCapture {
    stop(): Promise<void>;
}
export declare class MicDeniedError extends Error {
    constructor(message?: string);
}
export declare function startMicCapture(onChunk: (pcm: ArrayBuffer, rms: number) => void): Promise<MicCapture>;
//# sourceMappingURL=mic.d.ts.map