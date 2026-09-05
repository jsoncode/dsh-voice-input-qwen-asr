/**
 * dsh-voice-input —— 浏览器 ⇄ 本地 ASR 服务的 WebSocket 中继 Hub。
 *
 * 升级路由 /api/dsh-voice-input.ws（宿主 webServer 注册，connection 服务鉴权）。
 * 每个浏览器连接对应一条到本地 ASR 服务（ws://127.0.0.1:<port>/ws）的上游连接：
 * - 浏览器 → 宿主：二进制帧 = PCM16 音频块；文本帧 = JSON 控制（stop/abort）；
 * - 宿主 → 浏览器：ASR 上游的 JSON 文本帧原样转发（partial/final/state/error）。
 * 浏览器断开时向上游发送 abort 并关闭，保证会话缓冲被重置。
 */
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { AsrServer } from './asrproc.ts';
export declare class RelayHub {
    private readonly getServer;
    private readonly wss;
    private readonly browserSockets;
    constructor(getServer: () => AsrServer);
    /** webServer.registerUpgrade 的 handler 入口（鉴权由插件入口完成后调用）。 */
    handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void;
    /** 插件卸载：断开所有连接。 */
    dispose(): void;
    private handleConnection;
    private sendJson;
}
//# sourceMappingURL=relay.d.ts.map