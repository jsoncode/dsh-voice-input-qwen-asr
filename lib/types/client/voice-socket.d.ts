/**
 * dsh-voice-input —— 录音 WebSocket 客户端（/api/dsh-voice-input.ws）。
 *
 * 二进制帧 = PCM16 音频块（上行）；文本帧 = 双向 JSON 控制
 * （上行 stop/abort，下行 partial/final/state/error）。
 */
export type VoiceServerMessage = {
    type: 'partial';
    text: string;
} | {
    type: 'final';
    text: string;
} | {
    type: 'state';
    recording?: boolean;
} | {
    type: 'error';
    code?: string;
    message?: string;
} | {
    type: string;
    [key: string]: unknown;
};
export interface VoiceSocket {
    sendBinary(data: ArrayBuffer): void;
    sendJson(payload: Record<string, unknown>): void;
    close(): void;
}
export interface VoiceSocketHandlers {
    onOpen?: () => void;
    onMessage: (message: VoiceServerMessage) => void;
    onClose?: (clean: boolean) => void;
}
/** 建立录音 WS 连接；open 成功后 resolve，失败 reject。 */
export declare function openVoiceSocket(handlers: VoiceSocketHandlers, protocolPath?: string): Promise<VoiceSocket>;
//# sourceMappingURL=voice-socket.d.ts.map