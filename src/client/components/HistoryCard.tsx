/**
 * dsh-voice-input —— 识别记录卡片（设置页内嵌）。
 *
 * 每次语音输入完成的「音频 + 文本」对自动保存到 IndexedDB；此处提供：
 * 查看（文本展开/收起）、播放/停止、单条删除、勾选批量删除、全选、清空。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clearVoiceRecords,
  deleteVoiceRecords,
  listVoiceRecords,
  type VoiceRecord,
} from '../history.ts'
import { t } from '../i18n.ts'
import { ConfirmModal } from './ConfirmModal.tsx'

function formatClock(ms: number): string {
  const totalSeconds = Math.round(ms / 1000)
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

function formatTime(createdAt: number): string {
  const date = new Date(createdAt)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

type ConfirmState =
  | { kind: 'none' }
  | { kind: 'delete-selected' }
  | { kind: 'clear' }

export function HistoryCard(): React.ReactElement {
  const [records, setRecords] = useState<VoiceRecord[] | null>(null)
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>({ kind: 'none' })
  const audioRef = useRef<{ audio: HTMLAudioElement; url: string } | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setRecords(await listVoiceRecords())
    } catch {
      setRecords([])
    }
  }, [])

  useEffect(() => {
    void refresh()
    return () => stopPlayback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  const stopPlayback = (): void => {
    const current = audioRef.current
    audioRef.current = null
    if (current !== null) {
      current.audio.pause()
      URL.revokeObjectURL(current.url)
    }
    setPlayingId(null)
  }

  const togglePlay = (record: VoiceRecord): void => {
    if (playingId === record.id) {
      stopPlayback()
      return
    }
    stopPlayback()
    const url = URL.createObjectURL(record.audio)
    const audio = new Audio(url)
    audio.onended = () => stopPlayback()
    audio.onerror = () => stopPlayback()
    audioRef.current = { audio, url }
    setPlayingId(record.id)
    void audio.play().catch(() => stopPlayback())
  }

  const toggleSelected = (id: string): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleExpanded = (id: string): void => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allSelected = records !== null && records.length > 0 && selected.size === records.length
  const toggleAll = (): void => {
    setSelected(allSelected || records === null ? new Set() : new Set(records.map((record) => record.id)))
  }

  const deleteOne = (id: string): void => {
    if (playingId === id) stopPlayback()
    void deleteVoiceRecords([id]).then(() => {
      setSelected((previous) => {
        const next = new Set(previous)
        next.delete(id)
        return next
      })
      void refresh()
    })
  }

  const confirmAction = (): void => {
    if (confirmState.kind === 'delete-selected') {
      const ids = [...selected]
      if (playingId !== null && ids.includes(playingId)) stopPlayback()
      setSelected(new Set())
      setConfirmState({ kind: 'none' })
      void deleteVoiceRecords(ids).then(() => refresh())
      return
    }
    if (confirmState.kind === 'clear') {
      stopPlayback()
      setSelected(new Set())
      setConfirmState({ kind: 'none' })
      void clearVoiceRecords().then(() => refresh())
    }
  }

  return (
    <div className="dshv-card">
      <h3 className="dshv-card-title">
        {t('histTitle')}
        {records !== null && records.length > 0 ? (
          <span className="dshv-chip dshv-chip-idle">{t('histCount', { n: records.length })}</span>
        ) : null}
      </h3>

      {records === null ? (
        <p className="dshv-hint">{t('loading')}</p>
      ) : records.length === 0 ? (
        <p className="dshv-hint">{t('histEmpty')}</p>
      ) : (
        <>
          <div className="dshv-row">
            <label className="dshv-hist-check dshv-hint">
              <input type="checkbox" className="dshv-checkbox" checked={allSelected} onChange={toggleAll} />
              {t('histSelectAll')}
            </label>
            <button
              type="button"
              className="dshv-btn dshv-btn-small dshv-btn-danger"
              disabled={selected.size === 0}
              onClick={() => setConfirmState({ kind: 'delete-selected' })}
            >
              {`${t('histDeleteSelected')}${selected.size > 0 ? ` (${selected.size})` : ''}`}
            </button>
            <button type="button" className="dshv-btn dshv-btn-small" onClick={() => setConfirmState({ kind: 'clear' })}>
              {t('histClear')}
            </button>
          </div>
          <div className="dshv-hist-list">
            {records.map((record) => {
              const isExpanded = expanded.has(record.id)
              const isSelected = selected.has(record.id)
              return (
                <div className="dshv-hist-item" key={record.id}>
                  <input
                    type="checkbox"
                    className="dshv-checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(record.id)}
                    aria-label={t('histDeleteSelected')}
                  />
                  <div className="dshv-hist-main" onClick={() => toggleExpanded(record.id)}>
                    <div className="dshv-hist-meta">
                      {`${formatTime(record.createdAt)} · ${formatClock(record.durationMs)}`}
                    </div>
                    <div className={`dshv-hist-text${isExpanded ? ' dshv-hist-text-expanded' : ''}`}>
                      {record.text === '' ? '…' : record.text}
                    </div>
                  </div>
                  <div className="dshv-hist-actions">
                    <button
                      type="button"
                      className="dshv-btn dshv-btn-small"
                      onClick={() => togglePlay(record)}
                    >
                      {playingId === record.id ? t('histStop') : t('histPlay')}
                    </button>
                    <button
                      type="button"
                      className="dshv-btn dshv-btn-small dshv-btn-danger"
                      onClick={() => deleteOne(record.id)}
                    >
                      {t('histDelete')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {confirmState.kind !== 'none' ? (
        <ConfirmModal
          title={t('histConfirmTitle')}
          body={confirmState.kind === 'clear' ? t('histClearConfirm') : t('histDeleteConfirm')}
          danger
          onConfirm={confirmAction}
          onCancel={() => setConfirmState({ kind: 'none' })}
        />
      ) : null}
    </div>
  )
}
