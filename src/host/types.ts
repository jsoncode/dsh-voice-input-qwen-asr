/**
 * dsh-voice-input-qwen-asr —— 宿主半边共享类型（宿主服务最小视图 + 插件配置）。
 */

/** 宿主 webServer 服务最小视图（@deepseek-ai/dsh-host-webserver）。 */
export interface WebServerService {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => void | Promise<void>
  }): () => void
  registerUpgrade(route: {
    path: string
    handler: (req: import('node:http').IncomingMessage, socket: import('node:stream').Duplex, head: Buffer) => void
  }): () => void
}

/** 宿主 connection 服务最小视图（升级路由鉴权：Host/Origin 围栏 + dsh-auth cookie）。 */
export interface ConnectionService {
  requestRejection(req: import('node:http').IncomingMessage): unknown
}

/** 宿主 settings 服务最小视图（仅用于推导 $DSH_HOME）。 */
export interface SettingsService {
  documentPath?: string
}

/** webRuntime 服务最小视图（@deepseek-ai/dsh-web-app 提供，绑定派生的受信任主机）。 */
export interface WebRuntimeService {
  trustedHosts?: readonly string[]
}

/** 插件配置（schemasty Config 的静态面 + 数据文件 overrides 的运行时面）。 */
export interface VoicePluginConfig {
  /** 运行环境根目录（空 = <storeDir>/voice-input）。 */
  installDir: string
  /** 自定义运行库目录（空 = <installDir>/Qwen3-ASR）。可用时跳过克隆。 */
  runtimeDir: string
  /** 自定义模型库目录（空 = <installDir>/Qwen3-ASR-0.6B）。可用时跳过克隆。 */
  modelDir: string
  /** 用于创建 venv 的 Python 解释器（PATH 上的名字或绝对路径），需 3.12+。 */
  pythonPath: string
  /** 本地 ASR WebSocket 服务端口。 */
  asrPort: number
  /** 强制转写语言（Chinese/English/…），空或 Auto 为自动检测。 */
  language: string
  /** pip 镜像源（空 = 默认源），影响依赖安装。 */
  pipIndexUrl: string
  /** 部分转写（partial）推送间隔毫秒。 */
  partialIntervalMs: number
  /** 单次录音转写的音频长度上限（秒）。 */
  maxAudioSeconds: number
  /** 推理设备：auto | cuda:0 | cpu。 */
  device: string
}

export const OVERRIDABLE_KEYS = [
  'installDir',
  'runtimeDir',
  'modelDir',
  'pythonPath',
  'asrPort',
  'language',
  'pipIndexUrl',
  'partialIntervalMs',
  'maxAudioSeconds',
  'device',
] as const satisfies readonly (keyof VoicePluginConfig)[]

export type VoiceConfigOverrides = Partial<Pick<VoicePluginConfig, (typeof OVERRIDABLE_KEYS)[number]>>

/** 解析后的运行环境路径。 */
export interface VoicePaths {
  /** 运行环境根目录。 */
  installDir: string
  /** 运行库（QwenLM/Qwen3-ASR 克隆目录，venv 创建于此之下）。 */
  runtimeDir: string
  /** 模型库（Qwen/Qwen3-ASR-0.6B 克隆目录）。 */
  modelDir: string
  /** Python 虚拟环境目录（运行库目录下 .venv）。 */
  venvDir: string
  /** venv 内 Python 解释器绝对路径。 */
  venvPython: string
  /** 依赖安装完成标记文件。 */
  depsMarker: string
}
