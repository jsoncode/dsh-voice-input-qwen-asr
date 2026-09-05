/**
 * dsh-voice-input-qwen-asr —— 插件数据文件（$DSH_HOME/dsh-voice-input-qwen-asr.json）。
 *
 * 只存运行时可编辑的配置 overrides（设置页写入），安装状态一律以文件系统
 * 实测为准（目录/venv/标记文件），不做双份记账。原子写：临时文件 + rename。
 */
import type { VoiceConfigOverrides, VoicePluginConfig } from './types.ts';
export interface VoiceStore {
    overrides: VoiceConfigOverrides;
}
export declare const EMPTY_STORE: () => VoiceStore;
/** 数据目录：settings 文档同目录 → $DSH_HOME → ~/.dsh。 */
export declare function resolveStoreDir(documentPath?: string): string;
export declare function storeFile(storeDir: string): string;
export declare function loadStore(file: string): VoiceStore;
export declare function saveStore(file: string, store: VoiceStore): void;
/** 静态 patch 配置兜底值（patch 空配置或宿主未做 schema 填充时；显式 undefined 不覆盖默认）。 */
export declare function withDefaults(config: Partial<VoicePluginConfig>): VoicePluginConfig;
//# sourceMappingURL=store.d.ts.map