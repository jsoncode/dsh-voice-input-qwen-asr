/**
 * dsh-voice-input-qwen-asr —— 本地 ASR 服务进程管理。
 *
 * 以运行库 venv 的 Python 启动 python/asr_server.py（Qwen3-ASR-0.6B 推理 +
 * WebSocket 服务）。进程 stdout 逐行输出 JSON 状态（loading/ready/fatal/log），
 * 宿主解析后驱动状态机 stopped → starting → running/error，并维护环形服务
 * 日志供设置页轮询。插件卸载（ctx.effect）时自动停止服务进程。
 */

import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { isLfsPointer } from './paths.ts'
import type { VoicePaths, VoicePluginConfig } from './types.ts'

export type AsrState = 'stopped' | 'starting' | 'running' | 'error'

export interface AsrStatus {
  state: AsrState
  port: number
  pid: number | null
  device: string | null
  error: string | null
}

const READY_TIMEOUT_MS = 300_000
const LOG_LIMIT = 400

export class AsrServer {
  private child: ChildProcess | null = null
  private state: AsrState = 'stopped'
  private device: string | null = null
  private error: string | null = null
  private token = 0
  private readyWaiters: Array<{ resolve: () => void; reject: (e: Error) => void; timer: NodeJS.Timeout }> = []
  private readonly log: string[] = []

  constructor(
    private readonly getPaths: () => VoicePaths,
    private readonly getConfig: () => VoicePluginConfig,
    private readonly asrScript: string,
  ) {}

  status(): AsrStatus {
    return {
      state: this.state,
      port: this.getConfig().asrPort,
      pid: this.child?.pid ?? null,
      device: this.device,
      error: this.error,
    }
  }

  get isRunning(): boolean {
    return this.state === 'running' && this.child !== null && this.child.exitCode === null
  }

  logTail(count = 200): string[] {
    return this.log.slice(-count)
  }

  /** 启动服务（幂等：starting/running 时直接返回当前状态）。 */
  async start(): Promise<AsrStatus> {
    if (this.state === 'starting' || this.state === 'running') return this.status()
    const cfg = this.getConfig()
    const paths = this.getPaths()
    if (!existsSync(paths.venvPython)) throw new Error('虚拟环境未创建，请先在设置页完成安装步骤')
    if (!existsSync(paths.modelDir)) throw new Error('模型库未克隆，请先在设置页完成安装步骤')
    if (!existsSync(this.asrScript)) throw new Error('插件损坏：缺少 python/asr_server.py')
    this.checkModelCloned(paths.modelDir)

    const token = ++this.token
    this.state = 'starting'
    this.device = null
    this.error = null
    this.pushLog(`$ 启动 ASR 服务（端口 ${cfg.asrPort}，设备 ${cfg.device}，语言 ${cfg.language || '自动'}）`)

    let child: ChildProcess
    try {
      child = spawn(paths.venvPython, [
        this.asrScript,
        '--model', paths.modelDir,
        '--port', String(cfg.asrPort),
        '--language', cfg.language,
        '--device', cfg.device || 'auto',
        '--partial-interval-ms', String(Math.max(300, Math.round(cfg.partialIntervalMs))),
        '--max-audio-seconds', String(Math.max(5, Math.round(cfg.maxAudioSeconds))),
      ], { windowsHide: true })
    } catch (e) {
      this.state = 'error'
      this.error = e instanceof Error ? e.message : String(e)
      throw new Error(this.error)
    }
    this.child = child

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => this.onOutput(chunk, token))
    child.stderr?.on('data', (chunk: string) => this.pushLog(chunk))
    child.on('error', (e) => {
      this.pushLog(`进程错误: ${e.message}`)
      this.fail(token, e.message)
    })
    child.on('close', (code, signal) => {
      if (this.child === child) this.child = null
      this.resolveWaiters()
      if (this.state === 'starting') {
        this.state = 'error'
        this.error = `服务进程提前退出（code=${String(code)} signal=${String(signal)}），详见服务日志`
      } else if (this.state === 'running') {
        this.pushLog(`ASR 服务进程退出（code=${String(code)}）`)
        this.state = 'stopped'
      }
    })

    await new Promise<void>((resolveP, rejectP) => {
      const timer = setTimeout(() => {
        rejectP(new Error('启动超时：模型加载超过 300s（首次 CPU 加载较慢，可查看服务日志确认进度）'))
      }, READY_TIMEOUT_MS)
      this.readyWaiters.push({
        resolve: () => {
          clearTimeout(timer)
          resolveP()
        },
        reject: (e) => {
          clearTimeout(timer)
          rejectP(e)
        },
        timer,
      })
    })
    return this.status()
  }

  /** 停止服务进程（Windows 下树杀）。 */
  stop(): AsrStatus {
    const child = this.child
    this.resolveWaiters()
    if (child !== null && child.exitCode === null && !child.killed) {
      try {
        if (process.platform === 'win32' && typeof child.pid === 'number') {
          spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { windowsHide: true })
        } else {
          child.kill('SIGTERM')
        }
      } catch { /* already gone */ }
    }
    this.child = null
    this.state = 'stopped'
    this.error = null
    return this.status()
  }

  /** 插件卸载：确保服务进程终止。 */
  dispose(): void {
    this.token++
    this.stop()
  }

  /* ── 内部 ──────────────────────────────────────────────────────── */

  /** 模型目录粗检：git-lfs 未安装时克隆得到的是指针文件，提前给出可读错误。 */
  private checkModelCloned(modelDir: string): void {
    try {
      const configText = readFileSync(`${modelDir}/config.json`, 'utf8')
      if (isLfsPointer(configText.slice(0, 512))) {
        throw new Error('模型权重尚未下载（检测到 git-lfs 指针文件），请先安装 git-lfs 后重新克隆模型库')
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('git-lfs')) throw e
      // config.json 缺失等：交给 asr_server.py 报具体错误
    }
  }

  private onOutput(chunk: string, token: number): void {
    for (const line of chunk.split('\n')) {
      const text = line.trim()
      if (text === '') continue
      let payload: Record<string, unknown> | undefined
      try {
        payload = JSON.parse(text) as Record<string, unknown>
      } catch {
        this.pushLog(text)
        continue
      }
      const type = payload.type
      if (type === 'status') {
        this.pushLog(`[asr] ${String(payload.state)}（device: ${String(payload.device ?? '?')}）`)
      } else if (type === 'ready') {
        this.pushLog(`[asr] ready（device: ${String(payload.device ?? '?')}）`)
        if (token === this.token) {
          this.device = typeof payload.device === 'string' ? payload.device : null
          this.state = 'running'
          this.resolveWaiters()
        }
      } else if (type === 'fatal') {
        this.pushLog(`[asr] fatal: ${String(payload.message ?? '')}`)
        this.fail(token, String(payload.message ?? 'ASR 服务启动失败'))
      } else if (type === 'log') {
        this.pushLog(`[asr] ${String(payload.message ?? '')}`)
      } else {
        this.pushLog(text)
      }
    }
  }

  private fail(token: number, message: string): void {
    if (token !== this.token) return
    this.state = 'error'
    this.error = message
    this.rejectWaiters(new Error(message))
  }

  private resolveWaiters(): void {
    const waiters = this.readyWaiters
    this.readyWaiters = []
    for (const waiter of waiters) waiter.resolve()
  }

  private rejectWaiters(error: Error): void {
    const waiters = this.readyWaiters
    this.readyWaiters = []
    for (const waiter of waiters) waiter.reject(error)
  }

  private pushLog(line: string): void {
    for (const part of line.replace(/\r$/, '').split('\n')) {
      if (part.trim() === '') continue
      this.log.push(part)
    }
    if (this.log.length > LOG_LIMIT) this.log.splice(0, this.log.length - LOG_LIMIT)
  }
}
