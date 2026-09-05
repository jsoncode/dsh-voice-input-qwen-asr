/**
 * dsh-voice-input-qwen-asr —— 麦克风采集（AudioWorklet → PCM16 LE 16kHz 单声道分片）。
 *
 * AudioContext 以 16000Hz 创建（浏览器自动重采样麦克风流）；worklet 内再做一次
 * 兜底线性重采样（context 不支持目标采样率时），累积约 100ms 一片，附 RMS 音量
 * 上报，主线程经 WebSocket 推给宿主中继。
 */
const WORKLET_CODE = `
class DshvPcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.target = 16000
    this.rate = (options && options.processorOptions && options.processorOptions.rate) || sampleRate
    this.chunk = []
    this.chunkCap = Math.max(256, Math.round(this.rate * 0.1))
  }
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length > 0) {
      const ch = input[0]
      for (let i = 0; i < ch.length; i++) this.chunk.push(ch[i])
    }
    if (this.chunk.length >= this.chunkCap) {
      let data = this.chunk
      let rate = this.rate
      this.chunk = []
      if (rate !== this.target) {
        const ratio = rate / this.target
        const outLen = Math.floor(data.length / ratio)
        const out = new Float32Array(outLen)
        for (let i = 0; i < outLen; i++) {
          const p = i * ratio
          const i0 = Math.floor(p)
          const frac = p - i0
          const a = data[i0] || 0
          const b = data[i0 + 1] || a
          out[i] = a + (b - a) * frac
        }
        data = out
      }
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
      const rms = Math.sqrt(sum / data.length)
      const pcm = new Int16Array(data.length)
      for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      this.port.postMessage({ pcm: pcm.buffer, rms }, [pcm.buffer])
    }
    return true
  }
}
registerProcessor('dshv-pcm', DshvPcmProcessor)
`;
export class MicDeniedError extends Error {
    constructor(message = 'microphone denied') {
        super(message);
        this.name = 'MicDeniedError';
    }
}
export async function startMicCapture(onChunk) {
    if (navigator.mediaDevices?.getUserMedia === undefined) {
        throw new Error('此环境不支持麦克风采集（需要 HTTPS 或 localhost）');
    }
    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
    }
    catch (e) {
        const name = e instanceof Error ? e.name : '';
        if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
            throw new MicDeniedError();
        }
        throw e instanceof Error ? e : new Error(String(e));
    }
    let ctx;
    try {
        ctx = new AudioContext({ sampleRate: 16000 });
    }
    catch {
        ctx = new AudioContext();
    }
    await ctx.resume();
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    try {
        await ctx.audioWorklet.addModule(workletUrl);
    }
    catch (e) {
        void ctx.close();
        stream.getTracks().forEach((track) => track.stop());
        URL.revokeObjectURL(workletUrl);
        throw e instanceof Error ? e : new Error(String(e));
    }
    const source = ctx.createMediaStreamSource(stream);
    const node = new AudioWorkletNode(ctx, 'dshv-pcm', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        processorOptions: { rate: ctx.sampleRate },
    });
    node.port.onmessage = (event) => {
        onChunk(event.data.pcm, event.data.rms);
    };
    source.connect(node);
    return {
        async stop() {
            node.port.onmessage = null;
            try {
                source.disconnect();
            }
            catch { /* noop */ }
            try {
                node.disconnect();
            }
            catch { /* noop */ }
            stream.getTracks().forEach((track) => track.stop());
            URL.revokeObjectURL(workletUrl);
            try {
                await ctx.close();
            }
            catch { /* noop */ }
        },
    };
}
