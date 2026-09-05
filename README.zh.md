# dsh-voice-input

简体中文 · [English](./README.md)

[DeepSeek Harness (DSH)](../deepseek-harness) 双面插件：在聊天输入框旁新增**语音输入**——发送按钮左侧的麦克风按钮、实时录音气泡，以及由宿主托管运行的本地 **Qwen3-ASR** 语音识别服务。

## 功能

- **麦克风按钮** — 注册在 `conversation.input.right` 插槽，渲染于发送按钮左侧；点击开始录音，再次点击（或点「完成并输入」）结束。
- **录音气泡** — portal 挂载的浮动气泡：脉冲红点、随实时音量起伏的波形条、计时与实时部分转写文本。
- **实时推流** — 浏览器用 AudioWorklet 采集 16kHz PCM16 单声道音频，经宿主中继 WebSocket（`/api/dsh-voice-input.ws`）推给本地 ASR 服务，部分转写实时回流。
- **本地 ASR 服务** — 宿主半边用运行库虚拟环境的 Python 启动 `python/asr_server.py`，加载 `Qwen3-ASR-0.6B`（transformers 后端，有 CUDA 自动启用）并对外提供 WebSocket 转写服务。
- **环境安装页** — `settings.section` 独立页「语音识别」：克隆运行库与模型库、在运行库目录下创建 Python 虚拟环境、安装依赖、启停服务，安装/服务日志实时可见。

## 环境要求

- 含 `webServer` + `connection` 服务的 DSH 宿主（web profile）
- `git`（模型权重经 LFS 分发，需安装 **git-lfs**）
- Python **3.12+**（在 PATH 上，或在设置页配置绝对路径）
- 可选：NVIDIA GPU + CUDA（CPU 亦可运行，但明显较慢）

## 安装

```sh
dsh plugin --profile web add ./dsh-voice-input   # 或 npm 包名 / .tgz / github:you/repo#sha
dsh --profile web --dump-config                  # 确认配置层
dsh --profile web                                # 重启宿主
```

## 使用

1. 打开 **设置 → 语音识别**，点击 **一键安装**（或逐步执行四个步骤）：克隆运行库 → 克隆模型库 → 创建虚拟环境 → 安装依赖。依赖安装需下载 torch，耗时较长；国内网络可在同页配置 pip 镜像。
2. 点击 **启动服务**，等状态徽标变为「运行中」（设备栏显示 `cuda:0` 或 `cpu`）。
3. 在任意会话中点击发送按钮左侧的麦克风按钮开始说话，说完点 **完成并输入** —— 识别文本写入输入框草稿；「取消」丢弃本次录音。

## 架构

```
浏览器                            宿主（Node）                       本地 Python
┌─────────────────┐  POST /dsh-voice-input/api   ┌──────────────┐
│ 麦克风按钮       │ ────────────────────────────▶ │ ops: 状态/安装 │
│ 录音气泡(portal) │                               │ 服务管理      │
│ 设置页           │  WS /api/dsh-voice-input.ws  │ 安装编排器     │
│  AudioWorklet   │ ────────────────────────────▶ │ 中继 (ws)     │──▶ ws://127.0.0.1:18787/ws
│  PCM16 @16k     │ ◀──────────────────────────── │              │    asr_server.py
└─────────────────┘    partial / final JSON        └──────────────┘    Qwen3-ASR-0.6B
```

- `src/host/` — cordis 插件：HTTP API 路由（信任围栏）、WebSocket 升级路由（connection 服务鉴权）、安装编排（git clone / venv / pip）、ASR 进程管理、中继 Hub、数据文件 `$DSH_HOME/dsh-voice-input.json`。
- `src/client/` — 浏览器插件：`conversation.input.right` + `settings.section` 插槽、双语 i18n、样式、麦克风采集、WS 客户端。
- `python/asr_server.py` — asyncio + `websockets` 服务；缓冲入站 PCM，周期性转写尾部窗口推送 partial，收到 `stop` 后全量转写返回 final。

## 构建

```sh
pnpm install
pnpm run check    # tsc -b（宿主 + 浏览器两个 program）
pnpm run build    # → lib/index.js（Node）+ lib/client.js（浏览器工厂）
pnpm run verify   # 模拟宿主模块加载器，断言工厂形状
```

## License

MIT
