/**
 * dsh-voice-input —— 设置页「语音识别」（settings.section）。
 *
 * 页面结构（对齐宿主设置页的语言习惯）：
 * - ASR 服务卡片：状态徽标 / 设备 / 端口 + 启动·停止；
 * - 环境安装卡片：克隆运行库 / 克隆模型库 / 创建虚拟环境 / 安装依赖 四步，
 *   支持一键安装与单步重试，下方安装·服务日志标签页（轮询刷新）；
 * - 配置卡片：安装目录 / Python 路径 / 端口 / 语言 / pip 镜像 / 设备等，
 *   保存为运行时 overrides（宿主数据文件）；
 * - 使用说明卡片。
 */

import { useEffect, useRef, useState } from 'react'
import { api, type InstallerStatusView, type StatusView, type VoiceConfig } from '../rpc.ts'
import { t } from '../i18n.ts'
import { ConfirmModal } from './ConfirmModal.tsx'
import { HistoryCard } from './HistoryCard.tsx'

const STEP_KEYS = ['runtime', 'model', 'venv', 'deps'] as const
type StepKey = (typeof STEP_KEYS)[number]

const STEP_LABEL: Record<StepKey, string> = {
  runtime: 'stepRuntime',
  model: 'stepModel',
  venv: 'stepVenv',
  deps: 'stepDeps',
}

const STEP_HINT: Record<StepKey, string> = {
  runtime: 'git clone github.com/QwenLM/Qwen3-ASR',
  model: 'git clone modelscope.cn/Qwen/Qwen3-ASR-0.6B（需 git-lfs）',
  venv: 'python -m venv <运行库>/.venv',
  deps: 'pip install -e .（含 torch，耗时较长）+ websockets numpy',
}

function stateChip(state: string): { cls: string; label: string } {
  switch (state) {
    case 'done':
    case 'running':
      return { cls: 'dshv-chip-ok', label: t(state === 'done' ? 'stepStateDone' : 'stateRunning') }
    case 'failed':
    case 'error':
      return { cls: 'dshv-chip-bad', label: t(state === 'failed' ? 'stepStateFailed' : 'stateError') }
    case 'starting':
      return { cls: 'dshv-chip-warn', label: t('stateStarting') }
    default:
      return { cls: 'dshv-chip-idle', label: t(state === 'idle' ? 'stepStateIdle' : 'stateStopped') }
  }
}

function stepChip(stepKey: StepKey, view: { state: string } | undefined, usable: boolean): { cls: string; label: string } {
  // 克隆步骤以可用性检测结果为准（自定义路径可用同样算就绪）
  if ((stepKey === 'runtime' || stepKey === 'model') && usable) {
    return { cls: 'dshv-chip-ok', label: t('usable') }
  }
  return stateChip(view?.state ?? 'idle')
}

export function SettingsPage(): React.ReactElement {
  const [status, setStatus] = useState<StatusView | null>(null)
  const [draft, setDraft] = useState<VoiceConfig | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [actionError, setActionError] = useState('')
  const [logTab, setLogTab] = useState<'install' | 'server'>('install')
  const [serverLog, setServerLog] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const logRef = useRef<HTMLPreElement | null>(null)

  // 轮询状态（安装进行中 / 服务启动中时保持较低间隔，其余放宽）
  useEffect(() => {
    let alive = true
    const tick = async (): Promise<void> => {
      try {
        const next = await api<StatusView>('status')
        if (!alive) return
        setStatus(next)
        setDraft((previous) => previous ?? next.config)
        if (logTab === 'server') {
          const log = await api<{ log: string[] }>('server.log')
          if (alive) setServerLog(log.log)
        }
      } catch { /* 宿主路由未就绪：下轮重试 */ }
    }
    void tick()
    const timer = setInterval(() => void tick(), 2500)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [logTab])

  // 日志自动滚底
  useEffect(() => {
    const el = logRef.current
    if (el !== null) el.scrollTop = el.scrollHeight
  })

  const runAction = async (action: () => Promise<unknown>): Promise<void> => {
    if (busy) return
    setBusy(true)
    setActionError('')
    try {
      await action()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const installAll = (): void => {
    void runAction(() => api('install.start', { steps: STEP_KEYS }))
  }
  const installStep = (step: StepKey): void => {
    void runAction(() => api('install.start', { steps: [step] }))
  }
  const startServer = (): void => {
    void runAction(() => api('server.start'))
  }
  const stopServer = (): void => {
    void runAction(() => api('server.stop'))
  }
  const resetEnvironment = (): void => {
    void runAction(async () => {
      await api('install.reset')
      setResetConfirm(false)
    })
  }
  const saveConfig = (): void => {
    void runAction(async () => {
      if (draft === null) return
      const result = await api<{ config: VoiceConfig }>('config.save', {
        overrides: {
          installDir: draft.installDir,
          runtimeDir: draft.runtimeDir,
          modelDir: draft.modelDir,
          pythonPath: draft.pythonPath,
          asrPort: Number(draft.asrPort),
          language: draft.language,
          pipIndexUrl: draft.pipIndexUrl,
          partialIntervalMs: Number(draft.partialIntervalMs),
          maxAudioSeconds: Number(draft.maxAudioSeconds),
          device: draft.device,
        },
      })
      setDraft(result.config)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
    })
  }

  const updateDraft = (key: keyof VoiceConfig, value: string): void => {
    setDraft((previous) => (previous === null ? previous : { ...previous, [key]: value }))
  }

  if (status === null || draft === null) {
    return <div className="dshv-page"><p className="dshv-page-desc">{t('loading')}</p></div>
  }

  const installing = status.installing
  const server = status.server
  const installed = status.installed
  const usable = status.usable
  // 环境就绪 = 运行库可用（含自定义路径）+ 模型可用 + venv + 依赖
  const allReady = usable.runtime && usable.model && installed.venv && installed.deps
  const customRuntime = draft.runtimeDir.trim() !== ''
  const customModel = draft.modelDir.trim() !== ''
  const logLines = logTab === 'install' ? installing.log : serverLog

  return (
    <div className="dshv-page">
      <p className="dshv-page-desc">{t('sectionDesc')}</p>

      {/* ── ASR 服务 ─────────────────────────────────────────────── */}
      <div className="dshv-card">
        <h3 className="dshv-card-title">
          {t('serverCardTitle')}
          <span className={`dshv-chip ${stateChip(server.state).cls}`}>{stateChip(server.state).label}</span>
          {server.device !== null && server.state === 'running' ? (
            <span className="dshv-chip dshv-chip-idle">{`${t('device')}: ${server.device}`}</span>
          ) : null}
          <span className="dshv-chip dshv-chip-idle">{`${t('port')}: ${server.port}`}</span>
        </h3>
        {server.error !== null ? <p className="dshv-hint dshv-error-text">{server.error}</p> : null}
        <div className="dshv-row">
          <button
            type="button"
            className="dshv-btn dshv-btn-primary"
            disabled={busy || server.state === 'running' || server.state === 'starting' || !allReady}
            onClick={startServer}
          >
            {t('start')}
          </button>
          <button type="button" className="dshv-btn dshv-btn-danger" disabled={busy || server.state === 'stopped'} onClick={stopServer}>
            {t('stop')}
          </button>
          {!allReady ? <span className="dshv-hint">{t('usageReq')}</span> : null}
        </div>
        <div className="dshv-path">
          {`${status.paths.runtimeDir}  ·  ${status.paths.modelDir}`}
        </div>
      </div>

      {/* ── 环境安装 ─────────────────────────────────────────────── */}
      <div className="dshv-card">
        <h3 className="dshv-card-title">{t('installCardTitle')}</h3>
        <div className="dshv-steps">
          {STEP_KEYS.map((step) => {
            const view = installing.steps[step] ?? { state: 'idle', exitCode: null }
            const isRuntime = step === 'runtime'
            const isModel = step === 'model'
            const stepUsable = (isRuntime && usable.runtime) || (isModel && usable.model)
            const chip = stepChip(step, view, stepUsable)
            return (
              <div className="dshv-step" key={step}>
                <span className="dshv-step-name">
                  {t(STEP_LABEL[step])}
                  <span className="dshv-hint" style={{ marginLeft: 8 }}>{STEP_HINT[step]}</span>
                </span>
                {isRuntime && customRuntime ? <span className="dshv-chip dshv-chip-warn">{t('customPath')}</span> : null}
                {isModel && customModel ? <span className="dshv-chip dshv-chip-warn">{t('customPath')}</span> : null}
                <span className={`dshv-chip ${chip.cls}`}>{chip.label}</span>
                {/* 可用性命中（含自定义路径）时禁用克隆，避免覆盖用户文件 */}
                <button
                  type="button"
                  className="dshv-btn dshv-btn-small"
                  disabled={busy || installing.running || view.state === 'done' || view.state === 'running' || stepUsable}
                  onClick={() => installStep(step)}
                >
                  {t('stepRun')}
                </button>
              </div>
            )
          })}
        </div>
        <div className="dshv-row">
          <button
            type="button"
            className="dshv-btn dshv-btn-primary"
            disabled={busy || installing.running || allReady}
            onClick={installAll}
          >
            {installing.running ? `${t('stepStateRunning')}…` : t('installAll')}
          </button>
          <button
            type="button"
            className="dshv-btn dshv-btn-danger"
            disabled={busy || installing.running || status.resetting}
            onClick={() => setResetConfirm(true)}
          >
            {status.resetting ? `${t('resetEnv')}…` : t('resetEnv')}
          </button>
          {allReady ? <span className="dshv-chip dshv-chip-ok">{t('envReadyHint')}</span> : null}
          {installing.currentStep !== null ? (
            <span className="dshv-hint">{`→ ${t(STEP_LABEL[installing.currentStep as StepKey] ?? installing.currentStep)}`}</span>
          ) : null}
        </div>
        <div className="dshv-row" style={{ justifyContent: 'space-between' }}>
          <div className="dshv-tabs">
            <button
              type="button"
              className={`dshv-tab${logTab === 'install' ? ' dshv-tab-active' : ''}`}
              onClick={() => setLogTab('install')}
            >
              {t('installLog')}
            </button>
            <button
              type="button"
              className={`dshv-tab${logTab === 'server' ? ' dshv-tab-active' : ''}`}
              onClick={() => setLogTab('server')}
            >
              {t('serverLog')}
            </button>
          </div>
        </div>
        <pre className="dshv-log" ref={logRef}>{logLines.length > 0 ? logLines.join('\n') : ' '}</pre>
      </div>

      {/* ── 配置 ─────────────────────────────────────────────────── */}
      <div className="dshv-card">
        <h3 className="dshv-card-title">{t('saveConfig')}</h3>
        <div className="dshv-fields">
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-install-dir">{t('installDir')}</label>
            <input
              id="dshv-install-dir"
              className="dshv-input"
              value={draft.installDir}
              placeholder={status.paths.installDir}
              onChange={(event) => updateDraft('installDir', event.target.value)}
            />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-runtime-dir">
              {t('runtimeDirLabel')}
              {customRuntime ? (
                <span className={`dshv-chip ${usable.runtime ? 'dshv-chip-ok' : 'dshv-chip-bad'}`} style={{ marginLeft: 8 }}>
                  {usable.runtime ? t('usable') : t('unusable')}
                </span>
              ) : null}
            </label>
            <input
              id="dshv-runtime-dir"
              className="dshv-input"
              value={draft.runtimeDir}
              placeholder={status.paths.runtimeDir}
              onChange={(event) => updateDraft('runtimeDir', event.target.value)}
            />
            <span className="dshv-hint">{customRuntime ? (usable.runtime ? t('customPathHint') : t('customPathBad')) : t('customPathHint')}</span>
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-model-dir">
              {t('modelDirLabel')}
              {customModel ? (
                <span className={`dshv-chip ${usable.model ? 'dshv-chip-ok' : 'dshv-chip-bad'}`} style={{ marginLeft: 8 }}>
                  {usable.model ? t('usable') : t('unusable')}
                </span>
              ) : null}
            </label>
            <input
              id="dshv-model-dir"
              className="dshv-input"
              value={draft.modelDir}
              placeholder={status.paths.modelDir}
              onChange={(event) => updateDraft('modelDir', event.target.value)}
            />
            <span className="dshv-hint">{customModel ? (usable.model ? t('customPathHint') : t('customPathBad')) : t('customPathHint')}</span>
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-python">{t('pythonPath')}</label>
            <input id="dshv-python" className="dshv-input" value={draft.pythonPath} onChange={(event) => updateDraft('pythonPath', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-port">{t('asrPortLabel')}</label>
            <input id="dshv-port" className="dshv-input" value={String(draft.asrPort)} onChange={(event) => updateDraft('asrPort', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-lang">{t('languageLabel')}</label>
            <input id="dshv-lang" className="dshv-input" value={draft.language} placeholder="Auto" onChange={(event) => updateDraft('language', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-pip">{t('pipIndex')}</label>
            <input id="dshv-pip" className="dshv-input" value={draft.pipIndexUrl} placeholder="https://pypi.tuna.tsinghua.edu.cn/simple" onChange={(event) => updateDraft('pipIndexUrl', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-device">{t('deviceLabel')}</label>
            <input id="dshv-device" className="dshv-input" value={draft.device} placeholder="auto" onChange={(event) => updateDraft('device', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-interval">{t('partialInterval')}</label>
            <input id="dshv-interval" className="dshv-input" value={String(draft.partialIntervalMs)} onChange={(event) => updateDraft('partialIntervalMs', event.target.value)} />
          </div>
          <div className="dshv-field">
            <label className="dshv-label" htmlFor="dshv-maxaudio">{t('maxAudio')}</label>
            <input id="dshv-maxaudio" className="dshv-input" value={String(draft.maxAudioSeconds)} onChange={(event) => updateDraft('maxAudioSeconds', event.target.value)} />
          </div>
        </div>
        <div className="dshv-row">
          <button type="button" className="dshv-btn dshv-btn-primary" disabled={busy} onClick={saveConfig}>{t('saveConfig')}</button>
          {savedFlash ? <span className="dshv-flash">{t('saved')}</span> : null}
          {actionError !== '' ? <span className="dshv-hint dshv-error-text">{actionError}</span> : null}
        </div>
      </div>

      {/* ── 使用说明 ─────────────────────────────────────────────── */}
      <div className="dshv-card">
        <h3 className="dshv-card-title">{t('usageTitle')}</h3>
        <p className="dshv-hint">{t('usageBody')}</p>
        <p className="dshv-hint">{t('usageReq')}</p>
      </div>

      {/* ── 识别记录 ─────────────────────────────────────────────── */}
      <HistoryCard />

      {resetConfirm ? (
        <ConfirmModal
          title={t('resetConfirmTitle')}
          body={t('resetConfirmBody')}
          danger
          confirmLabel={t('resetEnv')}
          onConfirm={resetEnvironment}
          onCancel={() => setResetConfirm(false)}
        />
      ) : null}
    </div>
  )
}
