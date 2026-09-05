/**
 * dsh-voice-input-qwen-asr —— 录音 WebSocket 客户端（/api/dsh-voice-input-qwen-asr.ws）。
 *
 * 二进制帧 = PCM16 音频块（上行）；文本帧 = 双向 JSON 控制
 * （上行 stop/abort，下行 partial/final/state/error）。
 */

export type VoiceServerMessage =
  | { type: 'partial'; text: string }
  | { type: 'final'; text: string }
  | { type: 'state'; recording?: boolean }
  | { type: 'error'; code?: string; message?: string }
  | { type: string; [key: string]: unknown }

export interface VoiceSocket {
  sendBinary(data: ArrayBuffer): void
  sendJson(payload: Record<string, unknown>): void
  close(): void
}

export interface VoiceSocketHandlers {
  onOpen?: () => void
  onMessage: (message: VoiceServerMessage) => void
  onClose?: (clean: boolean) => void
}

/** 建立录音 WS 连接；open 成功后 resolve，失败 reject。 */
export function openVoiceSocket(handlers: VoiceSocketHandlers, protocolPath = '/api/dsh-voice-input-qwen-asr.ws'): Promise<VoiceSocket> {
  return new Promise((resolveP, rejectP) => {
    let protocol = 'ws:'
    if (typeof location !== 'undefined' && location.protocol === 'https:') protocol = 'wss:'
    let socket: WebSocket
    try {
      socket = new WebSocket(`${protocol}//${location.host}${protocolPath}`)
    } catch (e) {
      rejectP(e instanceof Error ? e : new Error(String(e)))
      return
    }
    let opened = false
    let cleanClose = true

    socket.binaryType = 'arraybuffer'
    socket.onopen = () => {
      opened = true
      handlers.onOpen?.()
      resolveP({
        sendBinary: (data) => {
          if (socket.readyState === WebSocket.OPEN) socket.send(data)
        },
        sendJson: (payload) => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
        },
        close: () => {
          cleanClose = false
          try { socket.close() } catch { /* noop */ }
        },
      })
    }
    socket.onmessage = (event) => {
      if (typeof event.data !== 'string') return
      let parsed: VoiceServerMessage
      try {
        parsed = JSON.parse(event.data) as VoiceServerMessage
      } catch {
        return
      }
      handlers.onMessage(parsed)
    }
    socket.onclose = () => {
      handlers.onClose?.(opened && cleanClose)
    }
    socket.onerror = () => {
      if (!opened) rejectP(new Error('无法建立录音连接（宿主路由不可达）'))
    }
  })
}
