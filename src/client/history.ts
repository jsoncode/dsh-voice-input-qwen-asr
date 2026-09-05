/**
 * dsh-voice-input —— 识别记录（浏览器 IndexedDB 持久化 + WAV 封装）。
 *
 * 每次语音输入完成后，把「音频 + 识别文本」成对保存：音频以 WAV Blob
 * （PCM16 LE 单声道 16kHz，录音期间收集的 PCM 分片直接拼装，无需转码）
 * 存入 IndexedDB（按源持久，刷新/重启后仍可回放），元数据与文本同记录。
 */

export interface VoiceRecord {
  id: string
  createdAt: number
  /** 音频时长毫秒。 */
  durationMs: number
  text: string
  /** WAV 音频（audio/wav）。 */
  audio: Blob
}

const DB_NAME = 'dsh-voice-input'
const DB_VERSION = 1
const STORE = 'records'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolveP, rejectP) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    request.onsuccess = () => resolveP(request.result)
    request.onerror = () => rejectP(request.error ?? new Error('IndexedDB open failed'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolveP, rejectP) => {
    request.onsuccess = () => resolveP(request.result)
    request.onerror = () => rejectP(request.error ?? new Error('IndexedDB request failed'))
  })
}

export async function addVoiceRecord(record: VoiceRecord): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await requestToPromise(tx.objectStore(STORE).put(record))
  } finally {
    db.close()
  }
}

export async function listVoiceRecords(): Promise<VoiceRecord[]> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readonly')
    const all = await requestToPromise(tx.objectStore(STORE).getAll() as IDBRequest<VoiceRecord[]>)
    return all.sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    db.close()
  }
}

export async function deleteVoiceRecords(ids: readonly string[]): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    await Promise.all(ids.map((id) => requestToPromise(store.delete(id))))
  } finally {
    db.close()
  }
}

export async function clearVoiceRecords(): Promise<void> {
  const db = await openDb()
  try {
    const tx = db.transaction(STORE, 'readwrite')
    await requestToPromise(tx.objectStore(STORE).clear())
  } finally {
    db.close()
  }
}

/** 生成记录 id（crypto.randomUUID 不可用时退化为时间戳 + 随机数）。 */
export function newRecordId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 把录音期间收集的 PCM16 LE 分片封装为 WAV Blob（单声道，16000Hz）。
 * @param chunks - 各分片的 ArrayBuffer（Int16 PCM）。
 * @param sampleRate - 采样率。
 */
export function buildWavBlob(chunks: readonly ArrayBuffer[], sampleRate = 16000): Blob {
  let totalBytes = 0
  for (const chunk of chunks) totalBytes += chunk.byteLength
  const dataLength = totalBytes - (totalBytes % 2)
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)
  const writeText = (offset: number, text: string): void => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeText(36, 'data')
  view.setUint32(40, dataLength, true)
  let offset = 44
  for (const chunk of chunks) {
    if (offset + chunk.byteLength > buffer.byteLength) break
    new Uint8Array(buffer, offset, chunk.byteLength).set(new Uint8Array(chunk))
    offset += chunk.byteLength
  }
  return new Blob([buffer], { type: 'audio/wav' })
}
