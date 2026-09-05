/**
 * dsh-voice-input-qwen-asr —— 浏览器半边 → 宿主 HTTP RPC（/dsh-voice-input-qwen-asr/api）。
 *
 * POST JSON（{ op, ...params }），宿主以 { ok, value } / { ok, error } 信封回传。
 * 请求不进入对话命令通道，页面不会出现 command 节点 / 调试卡片。
 */

export interface ApiEnvelope<T> {
  ok: boolean
  value?: T
  error?: { message?: string }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T = unknown>(op: string, params?: Record<string, unknown>): Promise<T> {
  let res: Response
  try {
    res = await fetch('/dsh-voice-input-qwen-asr/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ op, ...(params ?? {}) }),
    })
  } catch (e) {
    throw new ApiError(`网络错误: ${e instanceof Error ? e.message : String(e)}`)
  }
  if (res.status !== 200) throw new ApiError(`HTTP ${res.status}`)
  let body: ApiEnvelope<T>
  try {
    body = (await res.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError('响应解析失败')
  }
  if (!body.ok) throw new ApiError(body.error?.message ?? '请求失败')
  return body.value as T
}

/* ── 与宿主 op 返回结构对应的类型 ────────────────────────────────── */

export interface VoiceConfig {
  installDir: string
  runtimeDir: string
  modelDir: string
  pythonPath: string
  asrPort: number
  language: string
  pipIndexUrl: string
  partialIntervalMs: number
  maxAudioSeconds: number
  device: string
}

export interface VoicePathsView {
  installDir: string
  runtimeDir: string
  modelDir: string
  venvDir: string
  venvPython: string
  depsMarker: string
}

export interface InstalledView {
  runtime: boolean
  model: boolean
  venv: boolean
  deps: boolean
}

/** 环境可用性检测结果（与克隆来源无关，自定义路径同样参与）。 */
export interface UsableView {
  runtime: boolean
  model: boolean
}

export interface StepView {
  state: 'idle' | 'running' | 'done' | 'failed'
  exitCode: number | null
}

export interface InstallerStatusView {
  running: boolean
  currentStep: string | null
  steps: Record<string, StepView>
  log: string[]
}

export interface AsrStatusView {
  state: 'stopped' | 'starting' | 'running' | 'error'
  port: number
  pid: number | null
  device: string | null
  error: string | null
}

export interface StatusView {
  config: VoiceConfig
  paths: VoicePathsView
  installed: InstalledView
  usable: UsableView
  installing: InstallerStatusView
  resetting: boolean
  server: AsrStatusView
}
