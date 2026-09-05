/**
 * dsh-voice-input-qwen-asr —— 浏览器 ⇄ 本地 ASR 服务的 WebSocket 中继 Hub。
 *
 * 升级路由 /api/dsh-voice-input-qwen-asr.ws（宿主 webServer 注册，connection 服务鉴权）。
 * 每个浏览器连接对应一条到本地 ASR 服务（ws://127.0.0.1:<port>/ws）的上游连接：
 * - 浏览器 → 宿主：二进制帧 = PCM16 音频块；文本帧 = JSON 控制（stop/abort）；
 * - 宿主 → 浏览器：ASR 上游的 JSON 文本帧原样转发（partial/final/state/error）。
 * 浏览器断开时向上游发送 abort 并关闭，保证会话缓冲被重置。
 */

import { WebSocket, WebSocketServer } from 'ws'
import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import type { AsrServer } from './asrproc.ts'

export class RelayHub {
  private readonly wss = new WebSocketServer({ noServer: true })
  private readonly browserSockets = new Set<WebSocket>()

  constructor(private readonly getServer: () => AsrServer) {
    this.wss.on('connection', (ws: WebSocket) => this.handleConnection(ws))
  }

  /** webServer.registerUpgrade 的 handler 入口（鉴权由插件入口完成后调用）。 */
  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer): void {
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit('connection', ws, req)
    })
  }

  /** 插件卸载：断开所有连接。 */
  dispose(): void {
    for (const ws of this.browserSockets) {
      try { ws.terminate() } catch { /* already gone */ }
    }
    this.browserSockets.clear()
    try { this.wss.close() } catch { /* noop */ }
  }

  private handleConnection(ws: WebSocket): void {
    this.browserSockets.add(ws)
    const server = this.getServer()
    const cleanup = (): void => {
      this.browserSockets.delete(ws)
    }

    if (!server.isRunning) {
      this.sendJson(ws, { type: 'error', code: 'not_running', message: 'ASR 服务未运行，请在设置页（语音识别）中启动服务' })
      try { ws.close(1013, 'asr-not-running') } catch { /* noop */ }
      cleanup()
      return
    }

    let upstream: WebSocket
    try {
      upstream = new WebSocket(`ws://127.0.0.1:${server.status().port}/ws`)
    } catch (e) {
      this.sendJson(ws, { type: 'error', message: `无法连接本地 ASR 服务: ${e instanceof Error ? e.message : String(e)}` })
      try { ws.close() } catch { /* noop */ }
      cleanup()
      return
    }

    upstream.on('open', () => {
      this.sendJson(ws, { type: 'state', recording: true })
    })
    upstream.on('message', (data, isBinary) => {
      if (isBinary || ws.readyState !== WebSocket.OPEN) return
      ws.send(data.toString())
    })
    upstream.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) ws.close()
    })
    upstream.on('error', (err) => {
      this.sendJson(ws, { type: 'error', message: `本地 ASR 连接失败: ${err.message}` })
      try { ws.close() } catch { /* noop */ }
    })

    ws.on('message', (data, isBinary) => {
      if (upstream.readyState !== WebSocket.OPEN) return
      if (isBinary) upstream.send(data)
      else upstream.send(data.toString())
    })
    ws.on('close', () => {
      cleanup()
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        try { upstream.send(JSON.stringify({ type: 'abort' })) } catch { /* noop */ }
        try { upstream.close() } catch { /* noop */ }
      }
    })
    ws.on('error', () => {
      try { upstream.close() } catch { /* noop */ }
    })
  }

  private sendJson(ws: WebSocket, payload: Record<string, unknown>): void {
    if (ws.readyState !== WebSocket.OPEN) return
    try { ws.send(JSON.stringify(payload)) } catch { /* noop */ }
  }
}
