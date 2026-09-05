/**
 * dsh-voice-input-qwen-asr —— /dsh-voice-input-qwen-asr/api 的 op 分发。
 *
 * op 列表（POST JSON：{ op, ...params }）：
 *   config.get                       → { config, storeDir }
 *   config.save { overrides }        → { config }          设置页持久化 overrides
 *   status                           → { config, paths, installed, installing, server }
 *   install.start { steps }          → { started }
 *   install.status                   → InstallerStatus
 *   server.start / server.stop       → AsrStatus
 *   server.log                       → { log }
 */
import { type Installer } from './installer.ts';
import type { AsrServer } from './asrproc.ts';
import type { EnvReset } from './reset.ts';
import type { VoicePaths, VoicePluginConfig, VoiceConfigOverrides } from './types.ts';
import { type VoiceStore } from './store.ts';
export interface OpsDeps {
    effective: () => VoicePluginConfig;
    paths: () => VoicePaths;
    store: VoiceStore;
    storeFile: string;
    installer: Installer;
    asr: AsrServer;
    reset: EnvReset;
}
/** 校验并裁剪设置页提交的 overrides（未知键 / 类型不符一律丢弃）。 */
export declare function sanitizeOverrides(raw: unknown): VoiceConfigOverrides;
export declare function runOp(deps: OpsDeps, op: string, params: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=ops.d.ts.map