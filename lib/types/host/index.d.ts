/**
 * dsh-voice-input —— 插件宿主半边入口。
 *
 * - `/dsh-voice-input/api` HTTP 路由（webServer 注册 + 信任围栏）：浏览器半边
 *   （录音按钮状态检查 / 设置页）经 fetch 调用，JSON op 分发见 ops.ts；
 * - `/api/dsh-voice-input.ws` WebSocket 升级路由（connection 服务鉴权）：
 *   浏览器录音音频流经 relay.ts 中继到本地 Python ASR 服务
 *   （运行库 venv 启动 python/asr_server.py，Qwen3-ASR-0.6B 推理）；
 * - 环境安装编排（git clone 运行库/模型库、创建 venv、安装依赖）见 installer.ts；
 * - 运行时配置 overrides 持久化到 $DSH_HOME/dsh-voice-voice-input.json（store.ts）；
 * - 卸载清理：注销路由 + 终止安装子进程 + 停止 ASR 服务（ctx.effect disposer）。
 *
 * 运行时依赖（@deepseek-ai/*、ws）由 package.json 声明，安装时由宿主解析，
 * 本文件不含任何绝对路径。
 */
import type { Context } from '@deepseek-ai/cordis';
import './cordis-augment.d.ts';
import { sanitizeOverrides } from './ops.ts';
import type { VoiceConfigOverrides, VoicePluginConfig } from './types.ts';
export declare const name = "dsh-voice-input";
export declare const inject: string[];
export declare const Config: import("@deepseek-ai/schemastery").default<VoicePluginConfig>;
export declare function apply(ctx: Context, config: Partial<VoicePluginConfig>): void;
export type { VoiceConfigOverrides, VoicePluginConfig };
export { sanitizeOverrides };
//# sourceMappingURL=index.d.ts.map