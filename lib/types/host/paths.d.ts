/**
 * dsh-voice-input-qwen-asr —— 运行环境路径解析与安装状态实测。
 *
 * 目录布局（installDir 默认 <storeDir>/voice-input）：
 *   <installDir>/Qwen3-ASR/            运行库（github.com/QwenLM/Qwen3-ASR）
 *     └── .venv/                       Python 虚拟环境（运行库目录下创建）
 *   <installDir>/Qwen3-ASR-0.6B/       模型库（modelscope.cn/Qwen/Qwen3-ASR-0.6B）
 *   <installDir>/Qwen3-ASR/.dsh-voice-input-qwen-asr-deps-ok   依赖安装完成标记
 */
import type { VoicePaths, VoicePluginConfig } from './types.ts';
export declare const RUNTIME_REPO = "https://github.com/QwenLM/Qwen3-ASR";
export declare const MODEL_REPO = "https://www.modelscope.cn/Qwen/Qwen3-ASR-0.6B.git";
export declare const RUNTIME_DIR_NAME = "Qwen3-ASR";
export declare const MODEL_DIR_NAME = "Qwen3-ASR-0.6B";
export declare function resolvePaths(config: VoicePluginConfig, storeDir: string, asrScript: string): VoicePaths;
export interface InstalledState {
    runtime: boolean;
    model: boolean;
    venv: boolean;
    deps: boolean;
}
/** 以文件系统实测安装状态（不做双份记账）。 */
export declare function inspectInstalled(paths: VoicePaths): InstalledState;
export interface UsableState {
    /** 运行库可用：目录存在且含 pyproject.toml / setup.py（git clone 或用户自有均可）。 */
    runtime: boolean;
    /** 模型可用：目录存在且 config.json 为真实权重配置（非 git-lfs 指针）。 */
    model: boolean;
}
/** git-lfs 指针文件特征（未安装 git-lfs 时克隆得到的是指针而非权重）。 */
export declare function isLfsPointer(text: string): boolean;
/** 环境可用性检测（与 git 克隆来源无关，用户自有目录同样命中）。 */
export declare function inspectUsable(paths: VoicePaths): UsableState;
/** 目录是否存在且非空（防止把用户自有文件当作克隆目标）。 */
export declare function isNonEmptyDir(p: string): boolean;
//# sourceMappingURL=paths.d.ts.map