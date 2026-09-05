/**
 * dsh-voice-input —— 本地 ASR 服务进程管理。
 *
 * 以运行库 venv 的 Python 启动 python/asr_server.py（Qwen3-ASR-0.6B 推理 +
 * WebSocket 服务）。进程 stdout 逐行输出 JSON 状态（loading/ready/fatal/log），
 * 宿主解析后驱动状态机 stopped → starting → running/error，并维护环形服务
 * 日志供设置页轮询。插件卸载（ctx.effect）时自动停止服务进程。
 */
import type { VoicePaths, VoicePluginConfig } from './types.ts';
export type AsrState = 'stopped' | 'starting' | 'running' | 'error';
export interface AsrStatus {
    state: AsrState;
    port: number;
    pid: number | null;
    device: string | null;
    error: string | null;
}
export declare class AsrServer {
    private readonly getPaths;
    private readonly getConfig;
    private readonly asrScript;
    private child;
    private state;
    private device;
    private error;
    private token;
    private readyWaiters;
    private readonly log;
    constructor(getPaths: () => VoicePaths, getConfig: () => VoicePluginConfig, asrScript: string);
    status(): AsrStatus;
    get isRunning(): boolean;
    logTail(count?: number): string[];
    /** 启动服务（幂等：starting/running 时直接返回当前状态）。 */
    start(): Promise<AsrStatus>;
    /** 停止服务进程（Windows 下树杀）。 */
    stop(): AsrStatus;
    /** 插件卸载：确保服务进程终止。 */
    dispose(): void;
    /** 模型目录粗检：git-lfs 未安装时克隆得到的是指针文件，提前给出可读错误。 */
    private checkModelCloned;
    private onOutput;
    private fail;
    private resolveWaiters;
    private rejectWaiters;
    private pushLog;
}
//# sourceMappingURL=asrproc.d.ts.map