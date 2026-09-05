/**
 * dsh-voice-input-qwen-asr —— 确认弹框（portal 到 document.body，遮罩点击 = 取消）。
 */

import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { t } from '../i18n.ts'

export interface ConfirmModalProps {
  title: string
  body: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal(props: ConfirmModalProps): React.ReactElement {
  return createPortal(
    <div className="dshv-modal-backdrop" onClick={props.onCancel}>
      <div
        className="dshv-modal"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="dshv-modal-title">{props.title}</h3>
        <div className="dshv-modal-body">{props.body}</div>
        <div className="dshv-bubble-actions" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="dshv-btn" onClick={props.onCancel}>
            {props.cancelLabel ?? t('histCancel')}
          </button>
          <button
            type="button"
            className={`dshv-btn ${props.danger === true ? 'dshv-btn-danger' : 'dshv-btn-primary'}`}
            onClick={props.onConfirm}
          >
            {props.confirmLabel ?? t('histConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
