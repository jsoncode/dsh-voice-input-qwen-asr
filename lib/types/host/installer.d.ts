/**
 * dsh-voice-input-qwen-asr —— 环境安装编排器。
 *
 * 四个步骤（可整体一键执行，也可单步重试）：
 *   runtime : git clone https://github.com/QwenLM/Qwen3-ASR          （运行库）
 *   model   : git clone https://www.modelscope.cn/Qwen/Qwen3-ASR-0.6B.git （模型库）
 *   venv    : python -m venv <runtimeDir>/.venv                      （运行库目录下的虚拟环境）
 *   deps    : venv pip install -e .（运行库）+ websockets/numpy       （依赖安装）
 *
 * 步骤在后台顺序执行，stdout/stderr 逐行进环形日志；浏览器半边轮询
 * install.status 展示进度。已完成的步骤（目录/venv/标记存在）自动跳过。
 */
import type { VoicePaths, VoicePluginConfig } from './types.ts';
export type StepId = 'runtime' | 'model' | 'venv' | 'deps';
export type StepState = 'idle' | 'running' | 'done' | 'failed';
export declare const STEP_IDS: readonly StepId[];
export interface StepView {
    state: StepState;
    exitCode: number | null;
}
export interface InstallerStatus {
    running: boolean;
    currentStep: StepId | null;
    steps: Record<StepId, StepView>;
    log: string[];
}
export declare class Installer {
    private readonly getPaths;
    private readonly getConfig;
    private child;
    private running;
    private queue;
    private currentStep;
    private readonly states;
    private readonly exitCodes;
    private readonly log;
    private disposed;
    constructor(getPaths: () => VoicePaths, getConfig: () => VoicePluginConfig);
    status(): InstallerStatus;
    /** 启动一批步骤（顺序执行）。已在安装中时拒绝。 */
    start(steps: StepId[]): {
        started: boolean;
        error?: string;
    };
    /** 插件卸载：终止运行中的子进程。 */
    dispose(): void;
    private pushLog;
    private killChild;
    private drain;
    private runStep;
    private stepRuntime;
    private stepModel;
    private stepVenv;
    private stepDeps;
    private getPipIndexArgs;
    /**
     * 以子进程执行一条命令，输出逐行进日志。
     * 退出码非 0 时以退出码 reject。installDir / pip 镜像在调用点已生效。
     */
    private exec;
    /** 子进程环境：追加 pip 镜像（PIP_INDEX_URL），使依赖下载与 -e . 构建同源。 */
    private childEnv;
}
//# sourceMappingURL=installer.d.ts.map