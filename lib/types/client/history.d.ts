/**
 * dsh-voice-input-qwen-asr —— 识别记录（浏览器 IndexedDB 持久化 + WAV 封装）。
 *
 * 每次语音输入完成后，把「音频 + 识别文本」成对保存：音频以 WAV Blob
 * （PCM16 LE 单声道 16kHz，录音期间收集的 PCM 分片直接拼装，无需转码）
 * 存入 IndexedDB（按源持久，刷新/重启后仍可回放），元数据与文本同记录。
 */
export interface VoiceRecord {
    id: string;
    createdAt: number;
    /** 音频时长毫秒。 */
    durationMs: number;
    text: string;
    /** WAV 音频（audio/wav）。 */
    audio: Blob;
}
export declare function addVoiceRecord(record: VoiceRecord): Promise<void>;
export declare function listVoiceRecords(): Promise<VoiceRecord[]>;
export declare function deleteVoiceRecords(ids: readonly string[]): Promise<void>;
export declare function clearVoiceRecords(): Promise<void>;
/** 生成记录 id（crypto.randomUUID 不可用时退化为时间戳 + 随机数）。 */
export declare function newRecordId(): string;
/**
 * 把录音期间收集的 PCM16 LE 分片封装为 WAV Blob（单声道，16000Hz）。
 * @param chunks - 各分片的 ArrayBuffer（Int16 PCM）。
 * @param sampleRate - 采样率。
 */
export declare function buildWavBlob(chunks: readonly ArrayBuffer[], sampleRate?: number): Blob;
//# sourceMappingURL=history.d.ts.map