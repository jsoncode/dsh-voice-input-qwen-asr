import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useRef, useState } from 'react';
import { api } from "../rpc.js";
import { t } from "../i18n.js";
import { ConfirmModal } from "./ConfirmModal.js";
import { HistoryCard } from "./HistoryCard.js";
const STEP_KEYS = ['runtime', 'model', 'venv', 'deps'];
const STEP_LABEL = {
    runtime: 'stepRuntime',
    model: 'stepModel',
    venv: 'stepVenv',
    deps: 'stepDeps',
};
const STEP_HINT = {
    runtime: 'git clone github.com/QwenLM/Qwen3-ASR',
    model: 'git clone modelscope.cn/Qwen/Qwen3-ASR-0.6B（需 git-lfs）',
    venv: 'python -m venv <运行库>/.venv',
    deps: 'pip install -e .（含 torch，耗时较长）+ websockets numpy',
};
function stateChip(state) {
    switch (state) {
        case 'done':
        case 'running':
            return { cls: 'dshv-chip-ok', label: t(state === 'done' ? 'stepStateDone' : 'stateRunning') };
        case 'failed':
        case 'error':
            return { cls: 'dshv-chip-bad', label: t(state === 'failed' ? 'stepStateFailed' : 'stateError') };
        case 'starting':
            return { cls: 'dshv-chip-warn', label: t('stateStarting') };
        default:
            return { cls: 'dshv-chip-idle', label: t(state === 'idle' ? 'stepStateIdle' : 'stateStopped') };
    }
}
function stepChip(stepKey, view, usable, installed) {
    // 克隆步骤以可用性检测结果为准（自定义路径可用同样算就绪）
    if ((stepKey === 'runtime' || stepKey === 'model') && usable) {
        return { cls: 'dshv-chip-ok', label: t('usable') };
    }
    // 安装编排器的步骤状态是会话内的（插件重启后回到 idle）：
    // idle 且文件系统实测已安装时，按实测显示，避免把已有环境误报成未安装
    if ((view?.state ?? 'idle') === 'idle' && installed) {
        return { cls: 'dshv-chip-ok', label: t('stepStateInstalled') };
    }
    return stateChip(view?.state ?? 'idle');
}
export function SettingsPage() {
    const [status, setStatus] = useState(null);
    const [draft, setDraft] = useState(null);
    const [savedFlash, setSavedFlash] = useState(false);
    const [actionError, setActionError] = useState('');
    const [logTab, setLogTab] = useState('install');
    const [serverLog, setServerLog] = useState([]);
    const [busy, setBusy] = useState(false);
    const [resetConfirm, setResetConfirm] = useState(false);
    const logRef = useRef(null);
    // 轮询状态（安装进行中 / 服务启动中时保持较低间隔，其余放宽）
    useEffect(() => {
        let alive = true;
        const tick = async () => {
            try {
                const next = await api('status');
                if (!alive)
                    return;
                setStatus(next);
                setDraft((previous) => previous ?? next.config);
                if (logTab === 'server') {
                    const log = await api('server.log');
                    if (alive)
                        setServerLog(log.log);
                }
            }
            catch { /* 宿主路由未就绪：下轮重试 */ }
        };
        void tick();
        const timer = setInterval(() => void tick(), 2500);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [logTab]);
    // 日志自动滚底
    useEffect(() => {
        const el = logRef.current;
        if (el !== null)
            el.scrollTop = el.scrollHeight;
    });
    const runAction = async (action) => {
        if (busy)
            return;
        setBusy(true);
        setActionError('');
        try {
            await action();
        }
        catch (e) {
            setActionError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    };
    const installAll = () => {
        void runAction(() => api('install.start', { steps: STEP_KEYS }));
    };
    const installStep = (step) => {
        void runAction(() => api('install.start', { steps: [step] }));
    };
    const startServer = () => {
        void runAction(() => api('server.start'));
    };
    const stopServer = () => {
        void runAction(() => api('server.stop'));
    };
    const resetEnvironment = () => {
        void runAction(async () => {
            await api('install.reset');
            setResetConfirm(false);
        });
    };
    const saveConfig = () => {
        void runAction(async () => {
            if (draft === null)
                return;
            const result = await api('config.save', {
                overrides: {
                    installDir: draft.installDir,
                    runtimeDir: draft.runtimeDir,
                    modelDir: draft.modelDir,
                    pythonPath: draft.pythonPath,
                    asrPort: Number(draft.asrPort),
                    language: draft.language,
                    pipIndexUrl: draft.pipIndexUrl,
                    partialIntervalMs: Number(draft.partialIntervalMs),
                    maxAudioSeconds: Number(draft.maxAudioSeconds),
                    device: draft.device,
                },
            });
            setDraft(result.config);
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 1500);
        });
    };
    const updateDraft = (key, value) => {
        setDraft((previous) => (previous === null ? previous : { ...previous, [key]: value }));
    };
    if (status === null || draft === null) {
        return _jsx("div", { className: "dshv-page", children: _jsx("p", { className: "dshv-page-desc", children: t('loading') }) });
    }
    const installing = status.installing;
    const server = status.server;
    const installed = status.installed;
    const usable = status.usable;
    // 环境就绪 = 运行库可用（含自定义路径）+ 模型可用 + venv + 依赖
    const allReady = usable.runtime && usable.model && installed.venv && installed.deps;
    const customRuntime = draft.runtimeDir.trim() !== '';
    const customModel = draft.modelDir.trim() !== '';
    const logLines = logTab === 'install' ? installing.log : serverLog;
    return (_jsxs("div", { className: "dshv-page", children: [_jsx("p", { className: "dshv-page-desc", children: t('sectionDesc') }), _jsxs("div", { className: "dshv-card", children: [_jsxs("h3", { className: "dshv-card-title", children: [t('serverCardTitle'), _jsx("span", { className: `dshv-chip ${stateChip(server.state).cls}`, children: stateChip(server.state).label }), server.device !== null && server.state === 'running' ? (_jsx("span", { className: "dshv-chip dshv-chip-idle", children: `${t('device')}: ${server.device}` })) : null, _jsx("span", { className: "dshv-chip dshv-chip-idle", children: `${t('port')}: ${server.port}` })] }), server.error !== null ? _jsx("p", { className: "dshv-hint dshv-error-text", children: server.error }) : null, _jsxs("div", { className: "dshv-row", children: [_jsx("button", { type: "button", className: "dshv-btn dshv-btn-primary", disabled: busy || server.state === 'running' || server.state === 'starting' || !allReady, onClick: startServer, children: t('start') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-danger", disabled: busy || server.state === 'stopped', onClick: stopServer, children: t('stop') }), !allReady ? _jsx("span", { className: "dshv-hint", children: t('usageReq') }) : null] }), _jsx("div", { className: "dshv-path", children: `${status.paths.runtimeDir}  ·  ${status.paths.modelDir}` })] }), _jsxs("div", { className: "dshv-card", children: [_jsx("h3", { className: "dshv-card-title", children: t('installCardTitle') }), _jsx("div", { className: "dshv-steps", children: STEP_KEYS.map((step) => {
                            const view = installing.steps[step] ?? { state: 'idle', exitCode: null };
                            const isRuntime = step === 'runtime';
                            const isModel = step === 'model';
                            const stepUsable = (isRuntime && usable.runtime) || (isModel && usable.model);
                            const chip = stepChip(step, view, stepUsable, installed[step]);
                            return (_jsxs("div", { className: "dshv-step", children: [_jsxs("span", { className: "dshv-step-name", children: [t(STEP_LABEL[step]), _jsx("span", { className: "dshv-hint", style: { marginLeft: 8 }, children: STEP_HINT[step] })] }), isRuntime && customRuntime ? _jsx("span", { className: "dshv-chip dshv-chip-warn", children: t('customPath') }) : null, isModel && customModel ? _jsx("span", { className: "dshv-chip dshv-chip-warn", children: t('customPath') }) : null, _jsx("span", { className: `dshv-chip ${chip.cls}`, children: chip.label }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small", disabled: busy || installing.running || view.state === 'done' || view.state === 'running' || stepUsable, onClick: () => installStep(step), children: t('stepRun') })] }, step));
                        }) }), _jsxs("div", { className: "dshv-row", children: [_jsx("button", { type: "button", className: "dshv-btn dshv-btn-primary", disabled: busy || installing.running || allReady, onClick: installAll, children: installing.running ? `${t('stepStateRunning')}…` : t('installAll') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-danger", disabled: busy || installing.running || status.resetting, onClick: () => setResetConfirm(true), children: status.resetting ? `${t('resetEnv')}…` : t('resetEnv') }), allReady ? _jsx("span", { className: "dshv-chip dshv-chip-ok", children: t('envReadyHint') }) : null, installing.currentStep !== null ? (_jsx("span", { className: "dshv-hint", children: `→ ${t(STEP_LABEL[installing.currentStep] ?? installing.currentStep)}` })) : null] }), _jsx("div", { className: "dshv-row", style: { justifyContent: 'space-between' }, children: _jsxs("div", { className: "dshv-tabs", children: [_jsx("button", { type: "button", className: `dshv-tab${logTab === 'install' ? ' dshv-tab-active' : ''}`, onClick: () => setLogTab('install'), children: t('installLog') }), _jsx("button", { type: "button", className: `dshv-tab${logTab === 'server' ? ' dshv-tab-active' : ''}`, onClick: () => setLogTab('server'), children: t('serverLog') })] }) }), _jsx("pre", { className: "dshv-log", ref: logRef, children: logLines.length > 0 ? logLines.join('\n') : ' ' })] }), _jsxs("div", { className: "dshv-card", children: [_jsx("h3", { className: "dshv-card-title", children: t('saveConfig') }), _jsxs("div", { className: "dshv-fields", children: [_jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-install-dir", children: t('installDir') }), _jsx("input", { id: "dshv-install-dir", className: "dshv-input", value: draft.installDir, placeholder: status.paths.installDir, onChange: (event) => updateDraft('installDir', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsxs("label", { className: "dshv-label", htmlFor: "dshv-runtime-dir", children: [t('runtimeDirLabel'), customRuntime ? (_jsx("span", { className: `dshv-chip ${usable.runtime ? 'dshv-chip-ok' : 'dshv-chip-bad'}`, style: { marginLeft: 8 }, children: usable.runtime ? t('usable') : t('unusable') })) : null] }), _jsx("input", { id: "dshv-runtime-dir", className: "dshv-input", value: draft.runtimeDir, placeholder: status.paths.runtimeDir, onChange: (event) => updateDraft('runtimeDir', event.target.value) }), _jsx("span", { className: "dshv-hint", children: customRuntime ? (usable.runtime ? t('customPathHint') : t('customPathBad')) : t('customPathHint') })] }), _jsxs("div", { className: "dshv-field", children: [_jsxs("label", { className: "dshv-label", htmlFor: "dshv-model-dir", children: [t('modelDirLabel'), customModel ? (_jsx("span", { className: `dshv-chip ${usable.model ? 'dshv-chip-ok' : 'dshv-chip-bad'}`, style: { marginLeft: 8 }, children: usable.model ? t('usable') : t('unusable') })) : null] }), _jsx("input", { id: "dshv-model-dir", className: "dshv-input", value: draft.modelDir, placeholder: status.paths.modelDir, onChange: (event) => updateDraft('modelDir', event.target.value) }), _jsx("span", { className: "dshv-hint", children: customModel ? (usable.model ? t('customPathHint') : t('customPathBad')) : t('customPathHint') })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-python", children: t('pythonPath') }), _jsx("input", { id: "dshv-python", className: "dshv-input", value: draft.pythonPath, onChange: (event) => updateDraft('pythonPath', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-port", children: t('asrPortLabel') }), _jsx("input", { id: "dshv-port", className: "dshv-input", value: String(draft.asrPort), onChange: (event) => updateDraft('asrPort', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-lang", children: t('languageLabel') }), _jsx("input", { id: "dshv-lang", className: "dshv-input", value: draft.language, placeholder: "Auto", onChange: (event) => updateDraft('language', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-pip", children: t('pipIndex') }), _jsx("input", { id: "dshv-pip", className: "dshv-input", value: draft.pipIndexUrl, placeholder: "https://pypi.tuna.tsinghua.edu.cn/simple", onChange: (event) => updateDraft('pipIndexUrl', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-device", children: t('deviceLabel') }), _jsx("input", { id: "dshv-device", className: "dshv-input", value: draft.device, placeholder: "auto", onChange: (event) => updateDraft('device', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-interval", children: t('partialInterval') }), _jsx("input", { id: "dshv-interval", className: "dshv-input", value: String(draft.partialIntervalMs), onChange: (event) => updateDraft('partialIntervalMs', event.target.value) })] }), _jsxs("div", { className: "dshv-field", children: [_jsx("label", { className: "dshv-label", htmlFor: "dshv-maxaudio", children: t('maxAudio') }), _jsx("input", { id: "dshv-maxaudio", className: "dshv-input", value: String(draft.maxAudioSeconds), onChange: (event) => updateDraft('maxAudioSeconds', event.target.value) })] })] }), _jsxs("div", { className: "dshv-row", children: [_jsx("button", { type: "button", className: "dshv-btn dshv-btn-primary", disabled: busy, onClick: saveConfig, children: t('saveConfig') }), savedFlash ? _jsx("span", { className: "dshv-flash", children: t('saved') }) : null, actionError !== '' ? _jsx("span", { className: "dshv-hint dshv-error-text", children: actionError }) : null] })] }), _jsxs("div", { className: "dshv-card", children: [_jsx("h3", { className: "dshv-card-title", children: t('usageTitle') }), _jsx("p", { className: "dshv-hint", children: t('usageBody') }), _jsx("p", { className: "dshv-hint", children: t('usageReq') })] }), _jsx(HistoryCard, {}), resetConfirm ? (_jsx(ConfirmModal, { title: t('resetConfirmTitle'), body: t('resetConfirmBody'), danger: true, confirmLabel: t('resetEnv'), onConfirm: resetEnvironment, onCancel: () => setResetConfirm(false) })) : null] }));
}
