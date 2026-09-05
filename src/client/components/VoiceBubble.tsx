/**
 * dsh-voice-input-qwen-asr —— 录音气泡（portal 到 document.body，锚定麦克风按钮上方）。
 *
 * 录音中的动画：红点脉冲 + 波形条（CSS 关键帧驱动，振幅由实时 RMS 音量
 * --dshv-amp 控制）+ 实时部分转写文本；停止/取消按钮见底部操作区。
 */

import { createPortal } from 'react-dom'
import { t } from '../i18n.ts'

export type BubblePhase = 'connecting' | 'recording' | 'finalizing' | 'error'

export interface VoiceBubbleProps {
  phase: BubblePhase
  partial: string
  level: number
  elapsed: number
  errorMsg: string
  anchor: HTMLElement
  onCancel: () => void
  onFinish: () => void
  onRetry: () => void
  /** 打开设置页「语音识别」（错误态展示）。 */
  onOpenSettings: () => void
}

const BAR_FACTORS = [0.45, 0.8, 0.55, 1, 0.65, 0.9, 0.5, 0.75, 0.4]

function formatElapsed(seconds: number): string {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export function VoiceBubble(props: VoiceBubbleProps): React.ReactElement {
  const { phase, partial, level, elapsed, errorMsg, anchor } = props
  const rect = anchor.getBoundingClientRect()
  const style: React.CSSProperties = {
    right: Math.max(12, Math.round(window.innerWidth - rect.right)),
    bottom: Math.max(12, Math.round(window.innerHeight - rect.top + 10)),
  }
  // RMS → 气泡波形振幅（0.25 ~ 1），轻量压缩避免爆表
  const amp = Math.min(1, 0.25 + level * 5)

  let headLabel = t('connecting')
  if (phase === 'recording') headLabel = t('recording')
  else if (phase === 'finalizing') headLabel = t('finalizing')
  else if (phase === 'error') headLabel = t('errorTitle')

  return createPortal(
    <div className="dshv-bubble" style={style} role="status" aria-live="polite">
      <div className="dshv-bubble-head">
        <span className={`dshv-dot${phase === 'error' ? ' dshv-dot-idle' : ''}`} />
        <span className="dshv-bubble-label">{headLabel}</span>
        {(phase === 'recording' || phase === 'finalizing') && (
          <span className="dshv-elapsed">{formatElapsed(elapsed)}</span>
        )}
      </div>

      {phase === 'error' ? (
        <div className="dshv-error">
          <span>{errorMsg || t('errorTitle')}</span>
          <div className="dshv-bubble-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="dshv-btn dshv-btn-primary dshv-btn-small" onClick={props.onOpenSettings}>
              {t('openSettings')}
            </button>
            <button type="button" className="dshv-btn dshv-btn-small" onClick={props.onRetry}>
              {t('retry')}
            </button>
            <button type="button" className="dshv-btn dshv-btn-small" onClick={props.onCancel}>
              {t('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="dshv-wave" style={{ ['--dshv-amp' as string]: String(amp) }} aria-hidden>
            {BAR_FACTORS.map((factor, index) => (
              <span
                key={index}
                className="dshv-bar"
                style={{ animationDelay: `${-index * 0.11}s`, animationDuration: `${0.8 + factor * 0.35}s` }}
              />
            ))}
          </div>
          <div className={`dshv-partial${partial === '' ? ' dshv-partial-hint' : ''}`}>
            {phase === 'connecting'
              ? t('startServer')
              : partial !== ''
                ? partial
                : t('partialHint')}
          </div>
          <div className="dshv-bubble-actions">
            <button
              type="button"
              className="dshv-btn"
              onClick={props.onCancel}
              disabled={phase === 'finalizing'}
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              className="dshv-btn dshv-btn-primary"
              onClick={props.onFinish}
              disabled={phase !== 'recording'}
            >
              {t('finish')}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  )
}
