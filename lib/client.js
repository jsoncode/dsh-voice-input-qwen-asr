window.__ModuleLoader__.load({ id: 'dsh-voice-input-qwen-asr', factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let react_dom = require("react-dom");
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/client/i18n.ts
const COPY = {
	zh: {
		micLabel: "语音输入",
		recording: "录音中",
		connecting: "连接中…",
		finalizing: "识别中…",
		errorTitle: "语音输入不可用",
		cancel: "取消",
		finish: "完成并输入",
		partialHint: "正在聆听，说出你想输入的内容…",
		startServer: "正在启动 ASR 服务…",
		serverNotRunning: "ASR 服务未运行",
		goToSettings: "请先在设置中完成环境安装并启动 ASR 服务",
		openSettings: "打开设置",
		retry: "重试",
		micDenied: "麦克风权限被拒绝，请在浏览器地址栏允许麦克风后重试",
		wsClosed: "录音连接中断",
		finalTimeout: "识别超时，请重试",
		nav: "语音识别",
		sectionDesc: "本地 Qwen3-ASR 语音识别服务：克隆运行库与模型库、创建 Python 虚拟环境并运行推理服务，为输入框旁的语音输入按钮提供后端。",
		serverCardTitle: "ASR 服务",
		stateStopped: "未运行",
		stateStarting: "启动中",
		stateRunning: "运行中",
		stateError: "异常",
		device: "设备",
		port: "端口",
		start: "启动服务",
		stop: "停止服务",
		installCardTitle: "环境安装",
		stepRuntime: "克隆运行库",
		stepModel: "克隆模型库",
		stepVenv: "创建虚拟环境",
		stepDeps: "安装依赖",
		installAll: "一键安装",
		resetEnv: "重置环境",
		resetConfirmTitle: "重置环境",
		resetConfirmBody: "将删除插件创建的虚拟环境、依赖标记，以及默认位置克隆的运行库与模型库目录；你在下方配置的自定义路径目录本体不会被删除。该操作不可撤销，确定继续吗？",
		customPath: "自定义",
		usable: "可用",
		unusable: "不可用",
		runtimeDirLabel: "运行库目录",
		modelDirLabel: "模型库目录",
		customPathHint: "已配置自定义路径（留空则使用默认位置克隆）",
		customPathBad: "自定义路径当前不可用，请检查目录内容",
		envReadyHint: "环境已就绪",
		histTitle: "识别记录",
		histEmpty: "暂无识别记录，语音输入完成后会自动保存在这里",
		histPlay: "播放",
		histStop: "停止",
		histDelete: "删除",
		histDeleteSelected: "删除所选",
		histClear: "清空",
		histSelectAll: "全选",
		histDeleteConfirm: "确认删除选中的识别记录？删除后不可恢复。",
		histClearConfirm: "确认清空全部识别记录？删除后不可恢复。",
		histConfirmTitle: "删除识别记录",
		histConfirm: "确认",
		histCancel: "取消",
		histCount: "{n} 条",
		stepRun: "执行",
		installDir: "安装目录",
		pythonPath: "Python 路径",
		asrPortLabel: "服务端口",
		languageLabel: "识别语言",
		pipIndex: "pip 镜像",
		partialInterval: "部分转写间隔(ms)",
		maxAudio: "录音上限(秒)",
		deviceLabel: "推理设备",
		saveConfig: "保存设置",
		saved: "已保存",
		installLog: "安装日志",
		serverLog: "服务日志",
		stepStateIdle: "未安装",
		stepStateInstalled: "已安装",
		stepStateRunning: "进行中",
		stepStateDone: "完成",
		stepStateFailed: "失败",
		usageTitle: "使用说明",
		usageBody: "点击输入框右侧的麦克风按钮开始录音；录音中的部分文本会实时显示在气泡里，点击「完成并输入」后识别文本写入输入框。首次使用请先在本页完成环境安装并启动服务。",
		usageReq: "环境要求：git（模型库需 git-lfs）、Python 3.12+；有 NVIDIA GPU 时自动使用 CUDA，否则回退 CPU（较慢）。",
		loading: "加载中…",
		copyOk: "路径已复制"
	},
	en: {
		micLabel: "Voice input",
		recording: "Recording",
		connecting: "Connecting…",
		finalizing: "Transcribing…",
		errorTitle: "Voice input unavailable",
		cancel: "Cancel",
		finish: "Done, insert",
		partialHint: "Listening… speak what you want to type",
		startServer: "Starting ASR service…",
		serverNotRunning: "ASR service not running",
		goToSettings: "Finish the environment setup and start the service in Settings first",
		openSettings: "Open settings",
		retry: "Retry",
		micDenied: "Microphone permission denied. Allow mic access in the browser and retry",
		wsClosed: "Recording connection lost",
		finalTimeout: "Transcription timed out, please retry",
		nav: "Voice",
		sectionDesc: "Local Qwen3-ASR speech recognition: clone the runtime and model repos, create a Python virtualenv and run the inference server backing the mic button next to the composer.",
		serverCardTitle: "ASR service",
		stateStopped: "Stopped",
		stateStarting: "Starting",
		stateRunning: "Running",
		stateError: "Error",
		device: "Device",
		port: "Port",
		start: "Start service",
		stop: "Stop service",
		installCardTitle: "Environment setup",
		stepRuntime: "Clone runtime",
		stepModel: "Clone model",
		stepVenv: "Create virtualenv",
		stepDeps: "Install deps",
		installAll: "Install all",
		resetEnv: "Reset environment",
		resetConfirmTitle: "Reset environment",
		resetConfirmBody: "This deletes the virtualenv, the deps marker, and the cloned runtime/model directories at the DEFAULT location. Directories you configured as custom paths below are kept (their .venv created by this plugin is removed). This cannot be undone. Continue?",
		customPath: "Custom",
		usable: "Ready",
		unusable: "Not ready",
		runtimeDirLabel: "Runtime dir",
		modelDirLabel: "Model dir",
		customPathHint: "Custom path configured (empty = clone at the default location)",
		customPathBad: "Custom path is currently not usable, please check its contents",
		envReadyHint: "Environment ready",
		histTitle: "History",
		histEmpty: "No records yet — finished voice inputs are saved here automatically",
		histPlay: "Play",
		histStop: "Stop",
		histDelete: "Delete",
		histDeleteSelected: "Delete selected",
		histClear: "Clear",
		histSelectAll: "All",
		histDeleteConfirm: "Delete the selected records? This cannot be undone.",
		histClearConfirm: "Clear ALL records? This cannot be undone.",
		histConfirmTitle: "Delete records",
		histConfirm: "Confirm",
		histCancel: "Cancel",
		histCount: "{n} items",
		stepRun: "Run",
		installDir: "Install dir",
		pythonPath: "Python path",
		asrPortLabel: "Service port",
		languageLabel: "Language",
		pipIndex: "pip index",
		partialInterval: "Partial interval (ms)",
		maxAudio: "Max audio (s)",
		deviceLabel: "Device",
		saveConfig: "Save",
		saved: "Saved",
		installLog: "Install log",
		serverLog: "Server log",
		stepStateIdle: "Not installed",
		stepStateInstalled: "Installed",
		stepStateRunning: "Running",
		stepStateDone: "Done",
		stepStateFailed: "Failed",
		usageTitle: "Usage",
		usageBody: "Click the mic button on the right of the composer to record; partial text streams live into the bubble, and \"Done, insert\" writes the recognized text into the input box. Finish the environment setup on this page before first use.",
		usageReq: "Requirements: git (git-lfs for the model repo), Python 3.12+. CUDA is used automatically when an NVIDIA GPU is present, otherwise CPU (slower).",
		loading: "Loading…",
		copyOk: "Path copied"
	}
};
let lang = "zh";
const subscribers = /* @__PURE__ */ new Set();
function normalize(value) {
	return typeof value === "string" && value.toLowerCase().startsWith("en") ? "en" : "zh";
}
/** 初始化语言跟随宿主 locale 服务（返回反订阅清理函数）。 */
function initI18n(ctx) {
	try {
		const snapshot = ctx.get("locale")?.getSnapshot?.();
		if (snapshot && snapshot.active !== void 0) setLang(normalize(snapshot.active));
	} catch {}
	if (typeof document !== "undefined" && lang === "zh") setLang(normalize(document.documentElement.lang || "zh"));
	ctx.on?.("locale/change", (...args) => {
		const next = args[0];
		setLang(normalize(typeof next === "string" ? next : next?.active));
	});
}
function setLang(next) {
	if (next === lang) return;
	lang = next;
	for (const notify of subscribers) notify();
}
function t(key, vars) {
	let text = COPY[lang][key] ?? COPY.zh[key] ?? key;
	if (vars !== void 0) for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, String(value));
	return text;
}
//#endregion
//#region src/client/styles.ts
/**
* dsh-voice-input-qwen-asr —— 浏览器半边样式（class 前缀 dshv-，幂等注入 document.head）。
*
* 颜色全部走宿主设计令牌（ui-theme design-platform.css 的 --dsw-alias-* 别名层，
* 与 ui-primitives Input.module.css 的输入框配方一致），随浅色/深色主题切换；
* var() 兜底值仅在令牌缺失（旧宿主）时使用。
*
* 令牌对照（宿主实际语义）：
* - 文字：label-primary / label-secondary / label-tertiary（弱化）
* - 表面：bg-layer-1（卡片/输入框）、bg-layer-2（浮层/日志底）、bg-base
* - 边框：border-l2（分隔）、border-l3（卡片）、border-l4（输入框）
* - 交互：interactive-bg-hover（悬停）、button-primary-fill/hover（主按钮）
* - 状态：state-error-*、state-success-*、state-warn-*、brand-primary（焦点）
*/
const css = [`
/* ── 录音按钮（composer 工具行）──────────────────────────────── */
.dshv-mic {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex: none;
}
.dshv-mic:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-primary, #111827);
}
.dshv-mic:disabled { opacity: 0.4; cursor: default; }
.dshv-mic-active { color: var(--dsw-alias-state-error-primary, #e5484d); animation: dshv-pulse 1.2s ease-in-out infinite; }
@keyframes dshv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* ── 录音气泡（portal 到 body，锚定按钮上方）─────────────────── */
.dshv-bubble {
  position: fixed;
  z-index: 9999;
  width: 300px;
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #111827);
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 10px 12px 12px;
  font-size: 12px;
  line-height: 1.5;
  animation: dshv-bubble-in 0.18s ease-out;
}
@keyframes dshv-bubble-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.dshv-bubble-head { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.dshv-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-error-primary, #e5484d); animation: dshv-pulse 1s infinite; flex: none; }
.dshv-dot-idle { background: var(--dsw-alias-state-warn-primary, #f5a623); animation: none; }
.dshv-bubble-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshv-elapsed { color: var(--dsw-alias-label-tertiary, #8a8f98); font-variant-numeric: tabular-nums; margin-left: auto; flex: none; }
.dshv-wave { display: flex; align-items: center; gap: 3px; height: 22px; margin: 8px 0 4px; }
.dshv-bar {
  width: 3px;
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-brand-primary, linear-gradient(180deg, #4e5bff, #9b6bff));
  transform-origin: center;
  animation: dshv-wave 0.9s ease-in-out infinite;
}
@keyframes dshv-wave { 0%, 100% { transform: scaleY(0.22); } 50% { transform: scaleY(var(--dshv-amp, 0.7)); } }
.dshv-partial {
  max-height: 110px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-secondary, #3f444c);
  min-height: 18px;
}
.dshv-partial-hint { color: var(--dsw-alias-label-tertiary, #8a8f98); font-style: italic; }
.dshv-bubble-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
.dshv-error { color: var(--dsw-alias-state-error-primary, #d93025); display: flex; flex-direction: column; gap: 8px; }
.dshv-error-text { color: var(--dsw-alias-state-error-primary, #d93025); }

/* ── 通用按钮 ─────────────────────────────────────────────────── */
.dshv-btn {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12));
  background: transparent;
  color: var(--dsw-alias-label-primary, #111827);
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.6;
}
.dshv-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.dshv-btn:disabled { opacity: 0.45; cursor: default; }
.dshv-btn-primary {
  background: var(--dsw-alias-button-primary-fill, #4e5bff);
  border-color: transparent;
  color: var(--dsw-alias-label-primary-inverted, #ffffff);
}
.dshv-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, #3f4be0); }
/* 主按钮禁用态不用 opacity（白字会被一起压暗看不清），改用宿主 dimmed 令牌保住对比度 */
.dshv-btn-primary:disabled {
  opacity: 1;
  background: var(--dsw-alias-button-primary-dimmed, rgba(78, 91, 255, 0.35));
  color: var(--dsw-alias-label-primary-inverted, #ffffff);
}
.dshv-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-secondary, rgba(229, 72, 77, 0.5));
  color: var(--dsw-alias-state-error-primary, #e5484d);
}
.dshv-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger, rgba(229, 72, 77, 0.08)); }
.dshv-btn-small { padding: 2px 8px; font-size: 11px; }

/* ── 设置页 ───────────────────────────────────────────────────── */
.dshv-page { display: flex; flex-direction: column; gap: 16px; max-width: 720px; font-size: 13px; }
.dshv-page-desc { color: var(--dsw-alias-label-secondary, #3f444c); line-height: 1.6; margin: 0; }
.dshv-card {
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dshv-card-title { font-size: 13px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-primary, #111827); }
.dshv-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshv-label { flex: none; color: var(--dsw-alias-label-secondary, #3f444c); }

/* 参数表单：纵向排列（标签在上，输入框全宽在下） */
.dshv-fields { display: flex; flex-direction: column; gap: 12px; }
.dshv-field { display: flex; flex-direction: column; gap: 5px; }
.dshv-field .dshv-input { flex: none; width: 100%; box-sizing: border-box; }

/* 输入框：对齐宿主 ui-primitives Input 配方（bg-layer-1 + border-l4，聚焦 brand-primary） */
.dshv-input {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.14));
  background: var(--dsw-alias-bg-layer-1, rgba(0, 0, 0, 0.03));
  color: var(--dsw-alias-label-primary, #111827);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  min-width: 0;
  flex: 1 1 200px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dshv-input::placeholder { color: var(--dsw-alias-label-tertiary, #9aa0a8); }
.dshv-input:hover:not(:focus) { border-color: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.22)); }
.dshv-input:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary, #4e5bff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary, #4e5bff) 25%, transparent);
}

.dshv-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
  flex: none;
}
.dshv-chip-ok { background: var(--dsw-alias-state-success-secondary, rgba(46, 160, 67, 0.14)); color: var(--dsw-alias-state-success-primary, #1a7f37); }
.dshv-chip-bad { background: var(--dsw-alias-state-error-secondary, rgba(229, 72, 77, 0.14)); color: var(--dsw-alias-state-error-primary, #d93025); }
.dshv-chip-warn { background: var(--dsw-alias-state-warn-secondary, rgba(245, 166, 35, 0.16)); color: var(--dsw-alias-state-warn-primary, #9a6700); }
.dshv-chip-idle {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.dshv-steps { display: flex; flex-direction: column; gap: 6px; }
.dshv-step { display: flex; align-items: center; gap: 10px; }
.dshv-step-name { flex: 1; color: var(--dsw-alias-label-primary, #111827); }
.dshv-hint { color: var(--dsw-alias-label-tertiary, #8a8f98); font-size: 11px; line-height: 1.6; margin: 0; }
.dshv-path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; color: var(--dsw-alias-label-secondary, #3f444c); word-break: break-all; }
.dshv-tabs { display: flex; gap: 4px; }
.dshv-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.dshv-tab-active {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.07));
  color: var(--dsw-alias-label-primary, #111827);
  font-weight: 600;
}
.dshv-log {
  margin: 0;
  padding: 10px 12px;
  background: var(--dsw-alias-bg-layer-2, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--dsw-alias-border-l4, transparent);
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--dsw-alias-label-secondary, #3f444c);
}
.dshv-flash { color: var(--dsw-alias-state-success-primary, #1a7f37); font-size: 12px; }

/* ── 确认弹框 ─────────────────────────────────────────────────── */
.dshv-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
}
.dshv-modal {
  width: min(420px, calc(100vw - 48px));
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #111827);
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 16px 18px;
  font-size: 13px;
}
.dshv-modal-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
.dshv-modal-body { color: var(--dsw-alias-label-secondary, #3f444c); line-height: 1.6; }

/* ── 识别记录 ─────────────────────────────────────────────────── */
.dshv-hist-list { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; }
.dshv-hist-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.08));
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2, transparent);
}
.dshv-hist-main { flex: 1; min-width: 0; cursor: pointer; }
.dshv-hist-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8f98); margin-bottom: 2px; font-variant-numeric: tabular-nums; }
.dshv-hist-text {
  font-size: 12px;
  color: var(--dsw-alias-label-primary, #111827);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dshv-hist-text-expanded { -webkit-line-clamp: unset; display: block; }
.dshv-hist-actions { display: flex; flex-direction: column; gap: 4px; flex: none; }
.dshv-hist-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.dshv-checkbox { accent-color: var(--dsw-alias-brand-primary, #4e5bff); cursor: pointer; }
`];
let injected = false;
/** 幂等注入样式（插件样式与宿主 DOM 共存于 document.head）。 */
function injectStyles() {
	if (injected || typeof document === "undefined") return;
	const style = document.createElement("style");
	style.setAttribute("data-plugin-css", "dsh-voice-input-qwen-asr/voice.css");
	style.textContent = css.join("\n");
	document.head.appendChild(style);
	injected = true;
}
//#endregion
//#region src/client/rpc.ts
var ApiError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "ApiError";
	}
};
async function api(op, params) {
	let res;
	try {
		res = await fetch("/dsh-voice-input-qwen-asr/api", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				op,
				...params ?? {}
			})
		});
	} catch (e) {
		throw new ApiError(`网络错误: ${e instanceof Error ? e.message : String(e)}`);
	}
	if (res.status !== 200) throw new ApiError(`HTTP ${res.status}`);
	let body;
	try {
		body = await res.json();
	} catch {
		throw new ApiError("响应解析失败");
	}
	if (!body.ok) throw new ApiError(body.error?.message ?? "请求失败");
	return body.value;
}
//#endregion
//#region src/client/mic.ts
/**
* dsh-voice-input-qwen-asr —— 麦克风采集（AudioWorklet → PCM16 LE 16kHz 单声道分片）。
*
* AudioContext 以 16000Hz 创建（浏览器自动重采样麦克风流）；worklet 内再做一次
* 兜底线性重采样（context 不支持目标采样率时），累积约 100ms 一片，附 RMS 音量
* 上报，主线程经 WebSocket 推给宿主中继。
*/
const WORKLET_CODE = `
class DshvPcmProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.target = 16000
    this.rate = (options && options.processorOptions && options.processorOptions.rate) || sampleRate
    this.chunk = []
    this.chunkCap = Math.max(256, Math.round(this.rate * 0.1))
  }
  process(inputs) {
    const input = inputs[0]
    if (input && input[0] && input[0].length > 0) {
      const ch = input[0]
      for (let i = 0; i < ch.length; i++) this.chunk.push(ch[i])
    }
    if (this.chunk.length >= this.chunkCap) {
      let data = this.chunk
      let rate = this.rate
      this.chunk = []
      if (rate !== this.target) {
        const ratio = rate / this.target
        const outLen = Math.floor(data.length / ratio)
        const out = new Float32Array(outLen)
        for (let i = 0; i < outLen; i++) {
          const p = i * ratio
          const i0 = Math.floor(p)
          const frac = p - i0
          const a = data[i0] || 0
          const b = data[i0 + 1] || a
          out[i] = a + (b - a) * frac
        }
        data = out
      }
      let sum = 0
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
      const rms = Math.sqrt(sum / data.length)
      const pcm = new Int16Array(data.length)
      for (let i = 0; i < data.length; i++) {
        const s = Math.max(-1, Math.min(1, data[i]))
        pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff
      }
      this.port.postMessage({ pcm: pcm.buffer, rms }, [pcm.buffer])
    }
    return true
  }
}
registerProcessor('dshv-pcm', DshvPcmProcessor)
`;
var MicDeniedError = class extends Error {
	constructor(message = "microphone denied") {
		super(message);
		this.name = "MicDeniedError";
	}
};
async function startMicCapture(onChunk) {
	if (navigator.mediaDevices?.getUserMedia === void 0) throw new Error("此环境不支持麦克风采集（需要 HTTPS 或 localhost）");
	let stream;
	try {
		stream = await navigator.mediaDevices.getUserMedia({ audio: {
			channelCount: 1,
			echoCancellation: true,
			noiseSuppression: true,
			autoGainControl: true
		} });
	} catch (e) {
		const name = e instanceof Error ? e.name : "";
		if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") throw new MicDeniedError();
		throw e instanceof Error ? e : new Error(String(e));
	}
	let ctx;
	try {
		ctx = new AudioContext({ sampleRate: 16e3 });
	} catch {
		ctx = new AudioContext();
	}
	await ctx.resume();
	const blob = new Blob([WORKLET_CODE], { type: "application/javascript" });
	const workletUrl = URL.createObjectURL(blob);
	try {
		await ctx.audioWorklet.addModule(workletUrl);
	} catch (e) {
		ctx.close();
		stream.getTracks().forEach((track) => track.stop());
		URL.revokeObjectURL(workletUrl);
		throw e instanceof Error ? e : new Error(String(e));
	}
	const source = ctx.createMediaStreamSource(stream);
	const node = new AudioWorkletNode(ctx, "dshv-pcm", {
		numberOfInputs: 1,
		numberOfOutputs: 0,
		processorOptions: { rate: ctx.sampleRate }
	});
	node.port.onmessage = (event) => {
		onChunk(event.data.pcm, event.data.rms);
	};
	source.connect(node);
	return { async stop() {
		node.port.onmessage = null;
		try {
			source.disconnect();
		} catch {}
		try {
			node.disconnect();
		} catch {}
		stream.getTracks().forEach((track) => track.stop());
		URL.revokeObjectURL(workletUrl);
		try {
			await ctx.close();
		} catch {}
	} };
}
//#endregion
//#region src/client/voice-socket.ts
/** 建立录音 WS 连接；open 成功后 resolve，失败 reject。 */
function openVoiceSocket(handlers, protocolPath = "/api/dsh-voice-input-qwen-asr.ws") {
	return new Promise((resolveP, rejectP) => {
		let protocol = "ws:";
		if (typeof location !== "undefined" && location.protocol === "https:") protocol = "wss:";
		let socket;
		try {
			socket = new WebSocket(`${protocol}//${location.host}${protocolPath}`);
		} catch (e) {
			rejectP(e instanceof Error ? e : new Error(String(e)));
			return;
		}
		let opened = false;
		let cleanClose = true;
		socket.binaryType = "arraybuffer";
		socket.onopen = () => {
			opened = true;
			handlers.onOpen?.();
			resolveP({
				sendBinary: (data) => {
					if (socket.readyState === WebSocket.OPEN) socket.send(data);
				},
				sendJson: (payload) => {
					if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
				},
				close: () => {
					cleanClose = false;
					try {
						socket.close();
					} catch {}
				}
			});
		};
		socket.onmessage = (event) => {
			if (typeof event.data !== "string") return;
			let parsed;
			try {
				parsed = JSON.parse(event.data);
			} catch {
				return;
			}
			handlers.onMessage(parsed);
		};
		socket.onclose = () => {
			handlers.onClose?.(opened && cleanClose);
		};
		socket.onerror = () => {
			if (!opened) rejectP(/* @__PURE__ */ new Error("无法建立录音连接（宿主路由不可达）"));
		};
	});
}
//#endregion
//#region src/client/history.ts
const DB_NAME = "dsh-voice-input-qwen-asr";
const DB_VERSION = 1;
const STORE = "records";
function openDb() {
	return new Promise((resolveP, rejectP) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" }).createIndex("createdAt", "createdAt");
		};
		request.onsuccess = () => resolveP(request.result);
		request.onerror = () => rejectP(request.error ?? /* @__PURE__ */ new Error("IndexedDB open failed"));
	});
}
function requestToPromise(request) {
	return new Promise((resolveP, rejectP) => {
		request.onsuccess = () => resolveP(request.result);
		request.onerror = () => rejectP(request.error ?? /* @__PURE__ */ new Error("IndexedDB request failed"));
	});
}
async function addVoiceRecord(record) {
	const db = await openDb();
	try {
		await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(record));
	} finally {
		db.close();
	}
}
async function listVoiceRecords() {
	const db = await openDb();
	try {
		return (await requestToPromise(db.transaction(STORE, "readonly").objectStore(STORE).getAll())).sort((a, b) => b.createdAt - a.createdAt);
	} finally {
		db.close();
	}
}
async function deleteVoiceRecords(ids) {
	const db = await openDb();
	try {
		const store = db.transaction(STORE, "readwrite").objectStore(STORE);
		await Promise.all(ids.map((id) => requestToPromise(store.delete(id))));
	} finally {
		db.close();
	}
}
async function clearVoiceRecords() {
	const db = await openDb();
	try {
		await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).clear());
	} finally {
		db.close();
	}
}
/** 生成记录 id（crypto.randomUUID 不可用时退化为时间戳 + 随机数）。 */
function newRecordId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
	return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
/**
* 把录音期间收集的 PCM16 LE 分片封装为 WAV Blob（单声道，16000Hz）。
* @param chunks - 各分片的 ArrayBuffer（Int16 PCM）。
* @param sampleRate - 采样率。
*/
function buildWavBlob(chunks, sampleRate = 16e3) {
	let totalBytes = 0;
	for (const chunk of chunks) totalBytes += chunk.byteLength;
	const dataLength = totalBytes - totalBytes % 2;
	const buffer = new ArrayBuffer(44 + dataLength);
	const view = new DataView(buffer);
	const writeText = (offset, text) => {
		for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
	};
	writeText(0, "RIFF");
	view.setUint32(4, 36 + dataLength, true);
	writeText(8, "WAVE");
	writeText(12, "fmt ");
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	writeText(36, "data");
	view.setUint32(40, dataLength, true);
	let offset = 44;
	for (const chunk of chunks) {
		if (offset + chunk.byteLength > buffer.byteLength) break;
		new Uint8Array(buffer, offset, chunk.byteLength).set(new Uint8Array(chunk));
		offset += chunk.byteLength;
	}
	return new Blob([buffer], { type: "audio/wav" });
}
//#endregion
//#region src/client/components/VoiceBubble.tsx
/**
* dsh-voice-input-qwen-asr —— 录音气泡（portal 到 document.body，锚定麦克风按钮上方）。
*
* 录音中的动画：红点脉冲 + 波形条（CSS 关键帧驱动，振幅由实时 RMS 音量
* --dshv-amp 控制）+ 实时部分转写文本；停止/取消按钮见底部操作区。
*/
const BAR_FACTORS = [
	.45,
	.8,
	.55,
	1,
	.65,
	.9,
	.5,
	.75,
	.4
];
function formatElapsed(seconds) {
	return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function VoiceBubble(props) {
	const { phase, partial, level, elapsed, errorMsg, anchor } = props;
	const rect = anchor.getBoundingClientRect();
	const style = {
		right: Math.max(12, Math.round(window.innerWidth - rect.right)),
		bottom: Math.max(12, Math.round(window.innerHeight - rect.top + 10))
	};
	const amp = Math.min(1, .25 + level * 5);
	let headLabel = t("connecting");
	if (phase === "recording") headLabel = t("recording");
	else if (phase === "finalizing") headLabel = t("finalizing");
	else if (phase === "error") headLabel = t("errorTitle");
	return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "dshv-bubble",
		style,
		role: "status",
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshv-bubble-head",
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: `dshv-dot${phase === "error" ? " dshv-dot-idle" : ""}` }),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshv-bubble-label",
					children: headLabel
				}),
				(phase === "recording" || phase === "finalizing") && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshv-elapsed",
					children: formatElapsed(elapsed)
				})
			]
		}), phase === "error" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshv-error",
			children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: errorMsg || t("errorTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-bubble-actions",
				style: { justifyContent: "flex-start" },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn dshv-btn-primary dshv-btn-small",
						onClick: props.onOpenSettings,
						children: t("openSettings")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn dshv-btn-small",
						onClick: props.onRetry,
						children: t("retry")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn dshv-btn-small",
						onClick: props.onCancel,
						children: t("cancel")
					})
				]
			})]
		}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshv-wave",
				style: { ["--dshv-amp"]: String(amp) },
				"aria-hidden": true,
				children: BAR_FACTORS.map((factor, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshv-bar",
					style: {
						animationDelay: `${-index * .11}s`,
						animationDuration: `${.8 + factor * .35}s`
					}
				}, index))
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: `dshv-partial${partial === "" ? " dshv-partial-hint" : ""}`,
				children: phase === "connecting" ? t("startServer") : partial !== "" ? partial : t("partialHint")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-bubble-actions",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dshv-btn",
					onClick: props.onCancel,
					disabled: phase === "finalizing",
					children: t("cancel")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "dshv-btn dshv-btn-primary",
					onClick: props.onFinish,
					disabled: phase !== "recording",
					children: t("finish")
				})]
			})
		] })]
	}), document.body);
}
//#endregion
//#region src/client/settings-jump.ts
/** 本节 nav 行文案（zh/en 两种语言都要能匹配）。 */
const SECTION_LABELS = /* @__PURE__ */ new Set(["语音识别", "Voice"]);
/** 设置触发按钮文案（ui-settings-general locales: trigger）。 */
const TRIGGER_LABELS = /* @__PURE__ */ new Set(["设置", "Settings"]);
const POLL_INTERVAL_MS = 60;
const POLL_LIMIT = 25;
function buttonText(el) {
	return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}
/** 设置面板：aria-modal dialog 且包含 nav（排除业务弹窗）。 */
function findSettingsDialog() {
	const dialogs = document.querySelectorAll("[role=\"dialog\"][aria-modal=\"true\"]");
	for (const dialog of dialogs) if (dialog.querySelector("nav") !== null) return dialog;
	return null;
}
/** 面板导航里的本节行。 */
function findSectionRow() {
	const dialog = findSettingsDialog();
	if (dialog === null) return null;
	const rows = dialog.querySelectorAll("nav button");
	for (const row of rows) if (SECTION_LABELS.has(buttonText(row))) return row;
	return null;
}
/** 侧栏底部的设置触发按钮（图标态无文案时退化为 aria-haspopup 唯一命中）。 */
function findTrigger() {
	const triggers = document.querySelectorAll("button[aria-haspopup=\"dialog\"]");
	let fallback = null;
	for (const button of triggers) {
		const label = buttonText(button);
		if (TRIGGER_LABELS.has(label)) return button;
		if (label === "" && fallback === null) fallback = button;
	}
	return fallback;
}
/**
* 打开设置面板并定位到「语音识别」节。
* @returns 是否成功找到入口（触发按钮或已打开的面板）。
*/
function openVoiceSettings() {
	const row = findSectionRow();
	if (row !== null) {
		row.click();
		return true;
	}
	const trigger = findTrigger();
	if (trigger === null) return false;
	trigger.click();
	let attempts = 0;
	const tryClickRow = () => {
		const sectionRow = findSectionRow();
		if (sectionRow !== null) {
			sectionRow.click();
			return;
		}
		if (++attempts < POLL_LIMIT) setTimeout(tryClickRow, POLL_INTERVAL_MS);
	};
	setTimeout(tryClickRow, POLL_INTERVAL_MS);
	return true;
}
//#endregion
//#region src/client/components/VoiceButton.tsx
/**
* dsh-voice-input-qwen-asr —— 麦克风按钮（composer 工具行，发送按钮左侧）。
*
* 点击 → 检查/自动启动 ASR 服务 → getUserMedia 采集 → WS 推流；录音期间
* portal 渲染气泡展示动画与实时部分文本；「完成并输入」收到 final 后把
* 识别文本追加进宿主输入框草稿（inputActions.setDraft）。
*/
const FINAL_TIMEOUT_MS = 6e4;
const SERVER_START_TIMEOUT_MS = 24e4;
/** 把识别文本追加到草稿（保留草稿尾部空白；英文词间自动补空格）。 */
function joinDraftText(draft, text) {
	if (text === "") return draft;
	if (draft === "") return text;
	const match = /\s*$/.exec(draft);
	const tail = match !== null ? match[0] : "";
	const body = draft.slice(0, draft.length - tail.length);
	return body + (/\w$/.test(body) && /^\w/.test(text) ? " " : "") + text + tail;
}
function VoiceButton(props) {
	const { useInput, inputActions } = props;
	const draft = typeof useInput === "function" ? useInput((state) => state.draft) : "";
	const draftRef = (0, react.useRef)(draft);
	(0, react.useEffect)(() => {
		draftRef.current = draft;
	}, [draft]);
	const btnRef = (0, react.useRef)(null);
	const [phase, setPhase] = (0, react.useState)("idle");
	const [partial, setPartial] = (0, react.useState)("");
	const [level, setLevel] = (0, react.useState)(0);
	const [elapsed, setElapsed] = (0, react.useState)(0);
	const [errorMsg, setErrorMsg] = (0, react.useState)("");
	const wsRef = (0, react.useRef)(null);
	const captureRef = (0, react.useRef)(null);
	const phaseRef = (0, react.useRef)("idle");
	const startedAtRef = (0, react.useRef)(0);
	const gotFinalRef = (0, react.useRef)(false);
	const lastLevelAtRef = (0, react.useRef)(0);
	const pcmChunksRef = (0, react.useRef)([]);
	const pcmBytesRef = (0, react.useRef)(0);
	const applyPhase = (next) => {
		phaseRef.current = next;
		setPhase(next);
	};
	const cleanup = (0, react.useCallback)(async () => {
		const socket = wsRef.current;
		wsRef.current = null;
		const capture = captureRef.current;
		captureRef.current = null;
		if (socket !== null) socket.close();
		if (capture !== null) try {
			await capture.stop();
		} catch {}
	}, []);
	(0, react.useEffect)(() => () => {
		cleanup();
	}, [cleanup]);
	const fail = (0, react.useCallback)((error) => {
		cleanup();
		setErrorMsg(error.message);
		applyPhase("error");
	}, [cleanup]);
	const resetToIdle = (0, react.useCallback)(() => {
		cleanup();
		setLevel(0);
		setPartial("");
		setElapsed(0);
		applyPhase("idle");
	}, [cleanup]);
	/** 保存识别记录（音频 + 文本成对；文本为空或无音频时跳过）。 */
	const saveRecord = (text) => {
		const chunks = pcmChunksRef.current;
		if (text === "" || chunks.length === 0) return;
		const durationMs = Math.round(pcmBytesRef.current / 2 / 16e3 * 1e3);
		const audio = buildWavBlob(chunks);
		pcmChunksRef.current = [];
		addVoiceRecord({
			id: newRecordId(),
			createdAt: Date.now(),
			durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0,
			text,
			audio
		}).catch(() => {});
	};
	const handleMessage = (0, react.useCallback)((message) => {
		if (message.type === "partial") {
			setPartial(String(message.text ?? ""));
			return;
		}
		if (message.type === "final") {
			gotFinalRef.current = true;
			const text = String(message.text ?? "");
			if (text !== "" && props.inputActions !== void 0) props.inputActions.setDraft(joinDraftText(draftRef.current, text));
			saveRecord(text);
			resetToIdle();
			return;
		}
		if (message.type === "error") fail(new Error(String(message.message ?? "ASR error")));
	}, [
		props.inputActions,
		resetToIdle,
		fail
	]);
	/** 确认/自动启动本地 ASR 服务，就绪后返回。 */
	const ensureServer = async () => {
		const status = await api("status");
		if (status.server.state === "running" && status.server.error === null) return;
		const installed = status.installed;
		if (!installed.runtime || !installed.model || !installed.venv || !installed.deps) throw new Error(t("goToSettings"));
		if (status.server.state === "error" || status.server.state === "stopped") await api("server.start");
		const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
		while (Date.now() < deadline) {
			await new Promise((resolveP) => setTimeout(resolveP, 1e3));
			const next = await api("status");
			if (next.server.state === "error") throw new Error(next.server.error ?? t("serverNotRunning"));
			if (next.server.state === "running") return;
		}
		throw new Error(t("finalTimeout"));
	};
	const start = (0, react.useCallback)(async () => {
		if (phaseRef.current !== "idle" && phaseRef.current !== "error") return;
		setErrorMsg("");
		setPartial("");
		setElapsed(0);
		setLevel(0);
		gotFinalRef.current = false;
		pcmChunksRef.current = [];
		pcmBytesRef.current = 0;
		applyPhase("connecting");
		try {
			await ensureServer();
		} catch (e) {
			fail(e instanceof Error ? e : new Error(String(e)));
			return;
		}
		try {
			const socket = await openVoiceSocket({
				onMessage: handleMessage,
				onClose: () => {
					const current = phaseRef.current;
					if ((current === "recording" || current === "finalizing") && !gotFinalRef.current) fail(new Error(t("wsClosed")));
				}
			});
			wsRef.current = socket;
			const capture = await startMicCapture((pcm, rms) => {
				pcmChunksRef.current.push(pcm);
				pcmBytesRef.current += pcm.byteLength;
				socket.sendBinary(pcm);
				const now = Date.now();
				if (now - lastLevelAtRef.current > 90) {
					lastLevelAtRef.current = now;
					setLevel(rms);
				}
			});
			captureRef.current = capture;
			startedAtRef.current = Date.now();
			applyPhase("recording");
		} catch (e) {
			if (e instanceof MicDeniedError) fail(new Error(t("micDenied")));
			else fail(e instanceof Error ? e : new Error(String(e)));
		}
	}, [handleMessage, fail]);
	const finalize = (0, react.useCallback)(() => {
		const socket = wsRef.current;
		if (socket === null || phaseRef.current !== "recording") return;
		applyPhase("finalizing");
		socket.sendJson({ type: "stop" });
		setTimeout(() => {
			if (!gotFinalRef.current && phaseRef.current === "finalizing") fail(new Error(t("finalTimeout")));
		}, FINAL_TIMEOUT_MS);
	}, [fail]);
	const cancel = (0, react.useCallback)(() => {
		wsRef.current?.sendJson({ type: "abort" });
		resetToIdle();
	}, [resetToIdle]);
	(0, react.useEffect)(() => {
		if (phase !== "recording") return;
		const timer = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1e3));
		}, 250);
		return () => clearInterval(timer);
	}, [phase]);
	const onClick = () => {
		if (phaseRef.current === "recording") finalize();
		else if (phaseRef.current === "idle" || phaseRef.current === "error") start();
	};
	const showBubble = phase !== "idle" && btnRef.current !== null;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
		ref: btnRef,
		type: "button",
		className: `dshv-mic${phase === "recording" ? " dshv-mic-active" : ""}`,
		"aria-label": t("micLabel"),
		"aria-pressed": phase === "recording",
		title: t("micLabel"),
		onClick,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 16 16",
			width: "15",
			height: "15",
			"aria-hidden": true,
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "6",
					y: "1.2",
					width: "4",
					height: "8.2",
					rx: "2",
					fill: "currentColor"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M3.4 7.4a4.6 4.6 0 0 0 9.2 0",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8 12v2.6",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round"
				})
			]
		})
	}), showBubble && btnRef.current !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(VoiceBubble, {
		phase,
		partial,
		level,
		elapsed,
		errorMsg,
		anchor: btnRef.current,
		onCancel: cancel,
		onFinish: finalize,
		onRetry: () => void start(),
		onOpenSettings: openVoiceSettings
	}) : null] });
}
//#endregion
//#region src/client/components/ConfirmModal.tsx
/**
* dsh-voice-input-qwen-asr —— 确认弹框（portal 到 document.body，遮罩点击 = 取消）。
*/
function ConfirmModal(props) {
	return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshv-modal-backdrop",
		onClick: props.onCancel,
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
			className: "dshv-modal",
			role: "dialog",
			"aria-modal": "true",
			"aria-label": props.title,
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
					className: "dshv-modal-title",
					children: props.title
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dshv-modal-body",
					children: props.body
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dshv-bubble-actions",
					style: { justifyContent: "flex-end" },
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn",
						onClick: props.onCancel,
						children: props.cancelLabel ?? t("histCancel")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: `dshv-btn ${props.danger === true ? "dshv-btn-danger" : "dshv-btn-primary"}`,
						onClick: props.onConfirm,
						children: props.confirmLabel ?? t("histConfirm")
					})]
				})
			]
		})
	}), document.body);
}
//#endregion
//#region src/client/components/HistoryCard.tsx
/**
* dsh-voice-input-qwen-asr —— 识别记录卡片（设置页内嵌）。
*
* 每次语音输入完成的「音频 + 文本」对自动保存到 IndexedDB；此处提供：
* 查看（文本展开/收起）、播放/停止、单条删除、勾选批量删除、全选、清空。
*/
function formatClock(ms) {
	const totalSeconds = Math.round(ms / 1e3);
	return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
function formatTime(createdAt) {
	const date = new Date(createdAt);
	const pad = (value) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
function HistoryCard() {
	const [records, setRecords] = (0, react.useState)(null);
	const [selected, setSelected] = (0, react.useState)(/* @__PURE__ */ new Set());
	const [expanded, setExpanded] = (0, react.useState)(/* @__PURE__ */ new Set());
	const [playingId, setPlayingId] = (0, react.useState)(null);
	const [confirmState, setConfirmState] = (0, react.useState)({ kind: "none" });
	const audioRef = (0, react.useRef)(null);
	const refresh = (0, react.useCallback)(async () => {
		try {
			setRecords(await listVoiceRecords());
		} catch {
			setRecords([]);
		}
	}, []);
	(0, react.useEffect)(() => {
		refresh();
		return () => stopPlayback();
	}, [refresh]);
	const stopPlayback = () => {
		const current = audioRef.current;
		audioRef.current = null;
		if (current !== null) {
			current.audio.pause();
			URL.revokeObjectURL(current.url);
		}
		setPlayingId(null);
	};
	const togglePlay = (record) => {
		if (playingId === record.id) {
			stopPlayback();
			return;
		}
		stopPlayback();
		const url = URL.createObjectURL(record.audio);
		const audio = new Audio(url);
		audio.onended = () => stopPlayback();
		audio.onerror = () => stopPlayback();
		audioRef.current = {
			audio,
			url
		};
		setPlayingId(record.id);
		audio.play().catch(() => stopPlayback());
	};
	const toggleSelected = (id) => {
		setSelected((previous) => {
			const next = new Set(previous);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleExpanded = (id) => {
		setExpanded((previous) => {
			const next = new Set(previous);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const allSelected = records !== null && records.length > 0 && selected.size === records.length;
	const toggleAll = () => {
		setSelected(allSelected || records === null ? /* @__PURE__ */ new Set() : new Set(records.map((record) => record.id)));
	};
	const deleteOne = (id) => {
		if (playingId === id) stopPlayback();
		deleteVoiceRecords([id]).then(() => {
			setSelected((previous) => {
				const next = new Set(previous);
				next.delete(id);
				return next;
			});
			refresh();
		});
	};
	const confirmAction = () => {
		if (confirmState.kind === "delete-selected") {
			const ids = [...selected];
			if (playingId !== null && ids.includes(playingId)) stopPlayback();
			setSelected(/* @__PURE__ */ new Set());
			setConfirmState({ kind: "none" });
			deleteVoiceRecords(ids).then(() => refresh());
			return;
		}
		if (confirmState.kind === "clear") {
			stopPlayback();
			setSelected(/* @__PURE__ */ new Set());
			setConfirmState({ kind: "none" });
			clearVoiceRecords().then(() => refresh());
		}
	};
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "dshv-card",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", {
				className: "dshv-card-title",
				children: [t("histTitle"), records !== null && records.length > 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "dshv-chip dshv-chip-idle",
					children: t("histCount", { n: records.length })
				}) : null]
			}),
			records === null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dshv-hint",
				children: t("loading")
			}) : records.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dshv-hint",
				children: t("histEmpty")
			}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-row",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						className: "dshv-hist-check dshv-hint",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "dshv-checkbox",
							checked: allSelected,
							onChange: toggleAll
						}), t("histSelectAll")]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn dshv-btn-small dshv-btn-danger",
						disabled: selected.size === 0,
						onClick: () => setConfirmState({ kind: "delete-selected" }),
						children: `${t("histDeleteSelected")}${selected.size > 0 ? ` (${selected.size})` : ""}`
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: "dshv-btn dshv-btn-small",
						onClick: () => setConfirmState({ kind: "clear" }),
						children: t("histClear")
					})
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dshv-hist-list",
				children: records.map((record) => {
					const isExpanded = expanded.has(record.id);
					const isSelected = selected.has(record.id);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshv-hist-item",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: "dshv-checkbox",
								checked: isSelected,
								onChange: () => toggleSelected(record.id),
								"aria-label": t("histDeleteSelected")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-hist-main",
								onClick: () => toggleExpanded(record.id),
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dshv-hist-meta",
									children: `${formatTime(record.createdAt)} · ${formatClock(record.durationMs)}`
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: `dshv-hist-text${isExpanded ? " dshv-hist-text-expanded" : ""}`,
									children: record.text === "" ? "…" : record.text
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-hist-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dshv-btn dshv-btn-small",
									onClick: () => togglePlay(record),
									children: playingId === record.id ? t("histStop") : t("histPlay")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dshv-btn dshv-btn-small dshv-btn-danger",
									onClick: () => deleteOne(record.id),
									children: t("histDelete")
								})]
							})
						]
					}, record.id);
				})
			})] }),
			confirmState.kind !== "none" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmModal, {
				title: t("histConfirmTitle"),
				body: confirmState.kind === "clear" ? t("histClearConfirm") : t("histDeleteConfirm"),
				danger: true,
				onConfirm: confirmAction,
				onCancel: () => setConfirmState({ kind: "none" })
			}) : null
		]
	});
}
//#endregion
//#region src/client/components/SettingsPage.tsx
/**
* dsh-voice-input-qwen-asr —— 设置页「语音识别」（settings.section）。
*
* 页面结构（对齐宿主设置页的语言习惯）：
* - ASR 服务卡片：状态徽标 / 设备 / 端口 + 启动·停止；
* - 环境安装卡片：克隆运行库 / 克隆模型库 / 创建虚拟环境 / 安装依赖 四步，
*   支持一键安装与单步重试，下方安装·服务日志标签页（轮询刷新）；
* - 配置卡片：安装目录 / Python 路径 / 端口 / 语言 / pip 镜像 / 设备等，
*   保存为运行时 overrides（宿主数据文件）；
* - 使用说明卡片。
*/
const STEP_KEYS = [
	"runtime",
	"model",
	"venv",
	"deps"
];
const STEP_LABEL = {
	runtime: "stepRuntime",
	model: "stepModel",
	venv: "stepVenv",
	deps: "stepDeps"
};
const STEP_HINT = {
	runtime: "git clone github.com/QwenLM/Qwen3-ASR",
	model: "git clone modelscope.cn/Qwen/Qwen3-ASR-0.6B（需 git-lfs）",
	venv: "python -m venv <运行库>/.venv",
	deps: "pip install -e .（含 torch，耗时较长）+ websockets numpy"
};
function stateChip(state) {
	switch (state) {
		case "done":
		case "running": return {
			cls: "dshv-chip-ok",
			label: t(state === "done" ? "stepStateDone" : "stateRunning")
		};
		case "failed":
		case "error": return {
			cls: "dshv-chip-bad",
			label: t(state === "failed" ? "stepStateFailed" : "stateError")
		};
		case "starting": return {
			cls: "dshv-chip-warn",
			label: t("stateStarting")
		};
		default: return {
			cls: "dshv-chip-idle",
			label: t(state === "idle" ? "stepStateIdle" : "stateStopped")
		};
	}
}
function stepChip(stepKey, view, usable, installed) {
	if ((stepKey === "runtime" || stepKey === "model") && usable) return {
		cls: "dshv-chip-ok",
		label: t("usable")
	};
	if ((view?.state ?? "idle") === "idle" && installed) return {
		cls: "dshv-chip-ok",
		label: t("stepStateInstalled")
	};
	return stateChip(view?.state ?? "idle");
}
function SettingsPage() {
	const [status, setStatus] = (0, react.useState)(null);
	const [draft, setDraft] = (0, react.useState)(null);
	const [savedFlash, setSavedFlash] = (0, react.useState)(false);
	const [actionError, setActionError] = (0, react.useState)("");
	const [logTab, setLogTab] = (0, react.useState)("install");
	const [serverLog, setServerLog] = (0, react.useState)([]);
	const [busy, setBusy] = (0, react.useState)(false);
	const [resetConfirm, setResetConfirm] = (0, react.useState)(false);
	const logRef = (0, react.useRef)(null);
	(0, react.useEffect)(() => {
		let alive = true;
		const tick = async () => {
			try {
				const next = await api("status");
				if (!alive) return;
				setStatus(next);
				setDraft((previous) => previous ?? next.config);
				if (logTab === "server") {
					const log = await api("server.log");
					if (alive) setServerLog(log.log);
				}
			} catch {}
		};
		tick();
		const timer = setInterval(() => void tick(), 2500);
		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, [logTab]);
	(0, react.useEffect)(() => {
		const el = logRef.current;
		if (el !== null) el.scrollTop = el.scrollHeight;
	});
	const runAction = async (action) => {
		if (busy) return;
		setBusy(true);
		setActionError("");
		try {
			await action();
		} catch (e) {
			setActionError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusy(false);
		}
	};
	const installAll = () => {
		runAction(() => api("install.start", { steps: STEP_KEYS }));
	};
	const installStep = (step) => {
		runAction(() => api("install.start", { steps: [step] }));
	};
	const startServer = () => {
		runAction(() => api("server.start"));
	};
	const stopServer = () => {
		runAction(() => api("server.stop"));
	};
	const resetEnvironment = () => {
		runAction(async () => {
			await api("install.reset");
			setResetConfirm(false);
		});
	};
	const saveConfig = () => {
		runAction(async () => {
			if (draft === null) return;
			const result = await api("config.save", { overrides: {
				installDir: draft.installDir,
				runtimeDir: draft.runtimeDir,
				modelDir: draft.modelDir,
				pythonPath: draft.pythonPath,
				asrPort: Number(draft.asrPort),
				language: draft.language,
				pipIndexUrl: draft.pipIndexUrl,
				partialIntervalMs: Number(draft.partialIntervalMs),
				maxAudioSeconds: Number(draft.maxAudioSeconds),
				device: draft.device
			} });
			setDraft(result.config);
			setSavedFlash(true);
			setTimeout(() => setSavedFlash(false), 1500);
		});
	};
	const updateDraft = (key, value) => {
		setDraft((previous) => previous === null ? previous : {
			...previous,
			[key]: value
		});
	};
	if (status === null || draft === null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
		className: "dshv-page",
		children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
			className: "dshv-page-desc",
			children: t("loading")
		})
	});
	const installing = status.installing;
	const server = status.server;
	const installed = status.installed;
	const usable = status.usable;
	const allReady = usable.runtime && usable.model && installed.venv && installed.deps;
	const customRuntime = draft.runtimeDir.trim() !== "";
	const customModel = draft.modelDir.trim() !== "";
	const logLines = logTab === "install" ? installing.log : serverLog;
	return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
		className: "dshv-page",
		children: [
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: "dshv-page-desc",
				children: t("sectionDesc")
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("h3", {
						className: "dshv-card-title",
						children: [
							t("serverCardTitle"),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `dshv-chip ${stateChip(server.state).cls}`,
								children: stateChip(server.state).label
							}),
							server.device !== null && server.state === "running" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-chip dshv-chip-idle",
								children: `${t("device")}: ${server.device}`
							}) : null,
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-chip dshv-chip-idle",
								children: `${t("port")}: ${server.port}`
							})
						]
					}),
					server.error !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dshv-hint dshv-error-text",
						children: server.error
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshv-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshv-btn dshv-btn-primary",
								disabled: busy || server.state === "running" || server.state === "starting" || !allReady,
								onClick: startServer,
								children: t("start")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshv-btn dshv-btn-danger",
								disabled: busy || server.state === "stopped",
								onClick: stopServer,
								children: t("stop")
							}),
							!allReady ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-hint",
								children: t("usageReq")
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshv-path",
						children: `${status.paths.runtimeDir}  ·  ${status.paths.modelDir}`
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: "dshv-card-title",
						children: t("installCardTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshv-steps",
						children: STEP_KEYS.map((step) => {
							const view = installing.steps[step] ?? {
								state: "idle",
								exitCode: null
							};
							const isRuntime = step === "runtime";
							const isModel = step === "model";
							const stepUsable = isRuntime && usable.runtime || isModel && usable.model;
							const chip = stepChip(step, view, stepUsable, installed[step]);
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-step",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dshv-step-name",
										children: [t(STEP_LABEL[step]), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dshv-hint",
											style: { marginLeft: 8 },
											children: STEP_HINT[step]
										})]
									}),
									isRuntime && customRuntime ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dshv-chip dshv-chip-warn",
										children: t("customPath")
									}) : null,
									isModel && customModel ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dshv-chip dshv-chip-warn",
										children: t("customPath")
									}) : null,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: `dshv-chip ${chip.cls}`,
										children: chip.label
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: "dshv-btn dshv-btn-small",
										disabled: busy || installing.running || view.state === "done" || view.state === "running" || stepUsable,
										onClick: () => installStep(step),
										children: t("stepRun")
									})
								]
							}, step);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshv-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshv-btn dshv-btn-primary",
								disabled: busy || installing.running || allReady,
								onClick: installAll,
								children: installing.running ? `${t("stepStateRunning")}…` : t("installAll")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshv-btn dshv-btn-danger",
								disabled: busy || installing.running || status.resetting,
								onClick: () => setResetConfirm(true),
								children: status.resetting ? `${t("resetEnv")}…` : t("resetEnv")
							}),
							allReady ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-chip dshv-chip-ok",
								children: t("envReadyHint")
							}) : null,
							installing.currentStep !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-hint",
								children: `→ ${t(STEP_LABEL[installing.currentStep] ?? installing.currentStep)}`
							}) : null
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "dshv-row",
						style: { justifyContent: "space-between" },
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dshv-tabs",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dshv-tab${logTab === "install" ? " dshv-tab-active" : ""}`,
								onClick: () => setLogTab("install"),
								children: t("installLog")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: `dshv-tab${logTab === "server" ? " dshv-tab-active" : ""}`,
								onClick: () => setLogTab("server"),
								children: t("serverLog")
							})]
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
						className: "dshv-log",
						ref: logRef,
						children: logLines.length > 0 ? logLines.join("\n") : " "
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: "dshv-card-title",
						children: t("saveConfig")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshv-fields",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-install-dir",
									children: t("installDir")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-install-dir",
									className: "dshv-input",
									value: draft.installDir,
									placeholder: status.paths.installDir,
									onChange: (event) => updateDraft("installDir", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dshv-label",
										htmlFor: "dshv-runtime-dir",
										children: [t("runtimeDirLabel"), customRuntime ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: `dshv-chip ${usable.runtime ? "dshv-chip-ok" : "dshv-chip-bad"}`,
											style: { marginLeft: 8 },
											children: usable.runtime ? t("usable") : t("unusable")
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "dshv-runtime-dir",
										className: "dshv-input",
										value: draft.runtimeDir,
										placeholder: status.paths.runtimeDir,
										onChange: (event) => updateDraft("runtimeDir", event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dshv-hint",
										children: customRuntime ? usable.runtime ? t("customPathHint") : t("customPathBad") : t("customPathHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "dshv-label",
										htmlFor: "dshv-model-dir",
										children: [t("modelDirLabel"), customModel ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: `dshv-chip ${usable.model ? "dshv-chip-ok" : "dshv-chip-bad"}`,
											style: { marginLeft: 8 },
											children: usable.model ? t("usable") : t("unusable")
										}) : null]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										id: "dshv-model-dir",
										className: "dshv-input",
										value: draft.modelDir,
										placeholder: status.paths.modelDir,
										onChange: (event) => updateDraft("modelDir", event.target.value)
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dshv-hint",
										children: customModel ? usable.model ? t("customPathHint") : t("customPathBad") : t("customPathHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-python",
									children: t("pythonPath")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-python",
									className: "dshv-input",
									value: draft.pythonPath,
									onChange: (event) => updateDraft("pythonPath", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-port",
									children: t("asrPortLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-port",
									className: "dshv-input",
									value: String(draft.asrPort),
									onChange: (event) => updateDraft("asrPort", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-lang",
									children: t("languageLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-lang",
									className: "dshv-input",
									value: draft.language,
									placeholder: "Auto",
									onChange: (event) => updateDraft("language", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-pip",
									children: t("pipIndex")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-pip",
									className: "dshv-input",
									value: draft.pipIndexUrl,
									placeholder: "https://pypi.tuna.tsinghua.edu.cn/simple",
									onChange: (event) => updateDraft("pipIndexUrl", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-device",
									children: t("deviceLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-device",
									className: "dshv-input",
									value: draft.device,
									placeholder: "auto",
									onChange: (event) => updateDraft("device", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-interval",
									children: t("partialInterval")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-interval",
									className: "dshv-input",
									value: String(draft.partialIntervalMs),
									onChange: (event) => updateDraft("partialIntervalMs", event.target.value)
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dshv-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									className: "dshv-label",
									htmlFor: "dshv-maxaudio",
									children: t("maxAudio")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									id: "dshv-maxaudio",
									className: "dshv-input",
									value: String(draft.maxAudioSeconds),
									onChange: (event) => updateDraft("maxAudioSeconds", event.target.value)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dshv-row",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "dshv-btn dshv-btn-primary",
								disabled: busy,
								onClick: saveConfig,
								children: t("saveConfig")
							}),
							savedFlash ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-flash",
								children: t("saved")
							}) : null,
							actionError !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dshv-hint dshv-error-text",
								children: actionError
							}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dshv-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						className: "dshv-card-title",
						children: t("usageTitle")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dshv-hint",
						children: t("usageBody")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "dshv-hint",
						children: t("usageReq")
					})
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsx)(HistoryCard, {}),
			resetConfirm ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ConfirmModal, {
				title: t("resetConfirmTitle"),
				body: t("resetConfirmBody"),
				danger: true,
				confirmLabel: t("resetEnv"),
				onConfirm: resetEnvironment,
				onCancel: () => setResetConfirm(false)
			}) : null
		]
	});
}
//#endregion
//#region src/client/plugin.tsx
/**
* dsh-voice-input-qwen-asr —— 浏览器半边插件注册。
*
* - `conversation.input.right`（list, session scope）：麦克风按钮 —— 渲染在
*   composer 工具行 trailing 组的最前，即发送按钮左侧；组件经宿主注入的
*   useInput / inputActions 在识别完成后写入输入框草稿；
* - `settings.section`（list, root scope）：独立设置页「语音识别」，承载
*   ASR 环境安装（克隆运行库/模型库、创建 venv、装依赖）与服务启停；
* - locale 服务：语言跟随宿主；styles：幂等注入 document.head。
*/
function createPlugin() {
	return {
		name: "dsh-voice-input-qwen-asr",
		inject: ["slots", "locale"],
		apply(ctx) {
			const slots = ctx.get("slots");
			if (slots === void 0) {
				console.warn("[dsh-voice-input-qwen-asr] slots 服务不可用，浏览器半边未注册任何 UI");
				return;
			}
			initI18n(ctx);
			injectStyles();
			slots.inject("conversation.input.right", () => slots.register({
				name: "conversation.input.right",
				id: "dsh-voice-input-qwen-asr-mic",
				order: 20,
				label: () => t("micLabel")
			}, VoiceButton));
			slots.inject("settings.section", () => slots.register({
				name: "settings.section",
				id: "voice-input",
				order: 60,
				label: () => t("nav")
			}, SettingsPage));
		}
	};
}
//#endregion
//#region src/client/index.ts
/**
* dsh-voice-input-qwen-asr —— 浏览器半边入口（window.__ModuleLoader__ 工厂产物）。
*/
const plugin = createPlugin();
const name = plugin.name;
const inject = plugin.inject;
const apply = plugin.apply;
//#endregion
exports.apply = apply;
exports.inject = inject;
exports.name = name;

return module.exports; } });
//# sourceMappingURL=client.js.map