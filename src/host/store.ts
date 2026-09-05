/**
 * dsh-voice-input —— 插件数据文件（$DSH_HOME/dsh-voice-input.json）。
 *
 * 只存运行时可编辑的配置 overrides（设置页写入），安装状态一律以文件系统
 * 实测为准（目录/venv/标记文件），不做双份记账。原子写：临时文件 + rename。
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import type { VoiceConfigOverrides, VoicePluginConfig } from './types.ts'
import { OVERRIDABLE_KEYS } from './types.ts'

export interface VoiceStore {
  overrides: VoiceConfigOverrides
}

export const EMPTY_STORE = (): VoiceStore => ({ overrides: {} })

/** 数据目录：settings 文档同目录 → $DSH_HOME → ~/.dsh。 */
export function resolveStoreDir(documentPath?: string): string {
  if (typeof documentPath === 'string' && documentPath.trim() !== '') {
    const dir = dirname(documentPath)
    if (dir.trim() !== '') return dir
  }
  const fromEnv = process.env.DSH_HOME?.trim()
  if (fromEnv) return fromEnv
  return join(homedir(), '.dsh')
}

export function storeFile(storeDir: string): string {
  return join(storeDir, 'dsh-voice-input.json')
}

export function loadStore(file: string): VoiceStore {
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<VoiceStore>
    if (raw === null || typeof raw !== 'object') return EMPTY_STORE()
    const overrides: VoiceConfigOverrides = {}
    for (const key of OVERRIDABLE_KEYS) {
      const value = (raw.overrides as Record<string, unknown> | undefined)?.[key]
      if (typeof value === 'string' || typeof value === 'number') {
        ;(overrides as Record<string, unknown>)[key] = value
      }
    }
    return { overrides }
  } catch {
    return EMPTY_STORE()
  }
}

export function saveStore(file: string, store: VoiceStore): void {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8')
  renameSync(tmp, file)
}

/** 静态 patch 配置兜底值（patch 空配置或宿主未做 schema 填充时；显式 undefined 不覆盖默认）。 */
export function withDefaults(config: Partial<VoicePluginConfig>): VoicePluginConfig {
  const merged: Record<string, unknown> = { ...config }
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key]
  }
  return {
    installDir: '',
    runtimeDir: '',
    modelDir: '',
    pythonPath: 'python',
    asrPort: 18787,
    language: '',
    pipIndexUrl: '',
    partialIntervalMs: 1200,
    maxAudioSeconds: 300,
    device: 'auto',
    ...merged,
  }
}
