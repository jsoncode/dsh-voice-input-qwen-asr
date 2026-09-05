/**
 * dsh-voice-input —— 环境重置。
 *
 * 清理由插件创建/管理的产物：venv、依赖标记，以及**默认位置**的运行库/模型库
 * 克隆目录。用户通过配置指定的自定义 runtimeDir / modelDir 本体不会被删除
 * （那是用户自己的文件），但其中的 .venv 与依赖标记属于插件产物，会被移除。
 */
import type { VoicePaths, VoicePluginConfig } from './types.ts';
import type { AsrServer } from './asrproc.ts';
import type { Installer } from './installer.ts';
export interface ResetResult {
    ok: boolean;
    error?: string;
}
export declare class EnvReset {
    private resetting;
    get inProgress(): boolean;
    run(getConfig: () => VoicePluginConfig, getPaths: () => VoicePaths, asr: AsrServer, installer: Installer): Promise<ResetResult>;
}
//# sourceMappingURL=reset.d.ts.map