/**
 * dsh-voice-input —— 浏览器半边双语词典（zh/en）。
 *
 * 语言跟随宿主：ctx.get('locale') 快照 → locale/change 事件 → document.lang，
 * 切换时通过订阅者重渲染（与 dsh-jenkins 同一方案）。
 */
const COPY = {
    zh: {
        micLabel: '语音输入',
        recording: '录音中',
        connecting: '连接中…',
        finalizing: '识别中…',
        errorTitle: '语音输入不可用',
        cancel: '取消',
        finish: '完成并输入',
        partialHint: '正在聆听，说出你想输入的内容…',
        startServer: '正在启动 ASR 服务…',
        serverNotRunning: 'ASR 服务未运行',
        goToSettings: '请先在设置中完成环境安装并启动 ASR 服务',
        openSettings: '打开设置',
        retry: '重试',
        micDenied: '麦克风权限被拒绝，请在浏览器地址栏允许麦克风后重试',
        wsClosed: '录音连接中断',
        finalTimeout: '识别超时，请重试',
        nav: '语音识别',
        sectionDesc: '本地 Qwen3-ASR 语音识别服务：克隆运行库与模型库、创建 Python 虚拟环境并运行推理服务，为输入框旁的语音输入按钮提供后端。',
        serverCardTitle: 'ASR 服务',
        stateStopped: '未运行',
        stateStarting: '启动中',
        stateRunning: '运行中',
        stateError: '异常',
        device: '设备',
        port: '端口',
        start: '启动服务',
        stop: '停止服务',
        installCardTitle: '环境安装',
        stepRuntime: '克隆运行库',
        stepModel: '克隆模型库',
        stepVenv: '创建虚拟环境',
        stepDeps: '安装依赖',
        installAll: '一键安装',
        resetEnv: '重置环境',
        resetConfirmTitle: '重置环境',
        resetConfirmBody: '将删除插件创建的虚拟环境、依赖标记，以及默认位置克隆的运行库与模型库目录；你在下方配置的自定义路径目录本体不会被删除。该操作不可撤销，确定继续吗？',
        customPath: '自定义',
        usable: '可用',
        unusable: '不可用',
        runtimeDirLabel: '运行库目录',
        modelDirLabel: '模型库目录',
        customPathHint: '已配置自定义路径（留空则使用默认位置克隆）',
        customPathBad: '自定义路径当前不可用，请检查目录内容',
        envReadyHint: '环境已就绪',
        histTitle: '识别记录',
        histEmpty: '暂无识别记录，语音输入完成后会自动保存在这里',
        histPlay: '播放',
        histStop: '停止',
        histDelete: '删除',
        histDeleteSelected: '删除所选',
        histClear: '清空',
        histSelectAll: '全选',
        histDeleteConfirm: '确认删除选中的识别记录？删除后不可恢复。',
        histClearConfirm: '确认清空全部识别记录？删除后不可恢复。',
        histConfirmTitle: '删除识别记录',
        histConfirm: '确认',
        histCancel: '取消',
        histCount: '{n} 条',
        stepRun: '执行',
        installDir: '安装目录',
        pythonPath: 'Python 路径',
        asrPortLabel: '服务端口',
        languageLabel: '识别语言',
        pipIndex: 'pip 镜像',
        partialInterval: '部分转写间隔(ms)',
        maxAudio: '录音上限(秒)',
        deviceLabel: '推理设备',
        saveConfig: '保存设置',
        saved: '已保存',
        installLog: '安装日志',
        serverLog: '服务日志',
        stepStateIdle: '未安装',
        stepStateRunning: '进行中',
        stepStateDone: '完成',
        stepStateFailed: '失败',
        usageTitle: '使用说明',
        usageBody: '点击输入框右侧的麦克风按钮开始录音；录音中的部分文本会实时显示在气泡里，点击「完成并输入」后识别文本写入输入框。首次使用请先在本页完成环境安装并启动服务。',
        usageReq: '环境要求：git（模型库需 git-lfs）、Python 3.12+；有 NVIDIA GPU 时自动使用 CUDA，否则回退 CPU（较慢）。',
        loading: '加载中…',
        copyOk: '路径已复制',
    },
    en: {
        micLabel: 'Voice input',
        recording: 'Recording',
        connecting: 'Connecting…',
        finalizing: 'Transcribing…',
        errorTitle: 'Voice input unavailable',
        cancel: 'Cancel',
        finish: 'Done, insert',
        partialHint: 'Listening… speak what you want to type',
        startServer: 'Starting ASR service…',
        serverNotRunning: 'ASR service not running',
        goToSettings: 'Finish the environment setup and start the service in Settings first',
        openSettings: 'Open settings',
        retry: 'Retry',
        micDenied: 'Microphone permission denied. Allow mic access in the browser and retry',
        wsClosed: 'Recording connection lost',
        finalTimeout: 'Transcription timed out, please retry',
        nav: 'Voice',
        sectionDesc: 'Local Qwen3-ASR speech recognition: clone the runtime and model repos, create a Python virtualenv and run the inference server backing the mic button next to the composer.',
        serverCardTitle: 'ASR service',
        stateStopped: 'Stopped',
        stateStarting: 'Starting',
        stateRunning: 'Running',
        stateError: 'Error',
        device: 'Device',
        port: 'Port',
        start: 'Start service',
        stop: 'Stop service',
        installCardTitle: 'Environment setup',
        stepRuntime: 'Clone runtime',
        stepModel: 'Clone model',
        stepVenv: 'Create virtualenv',
        stepDeps: 'Install deps',
        installAll: 'Install all',
        resetEnv: 'Reset environment',
        resetConfirmTitle: 'Reset environment',
        resetConfirmBody: 'This deletes the virtualenv, the deps marker, and the cloned runtime/model directories at the DEFAULT location. Directories you configured as custom paths below are kept (their .venv created by this plugin is removed). This cannot be undone. Continue?',
        customPath: 'Custom',
        usable: 'Ready',
        unusable: 'Not ready',
        runtimeDirLabel: 'Runtime dir',
        modelDirLabel: 'Model dir',
        customPathHint: 'Custom path configured (empty = clone at the default location)',
        customPathBad: 'Custom path is currently not usable, please check its contents',
        envReadyHint: 'Environment ready',
        histTitle: 'History',
        histEmpty: 'No records yet — finished voice inputs are saved here automatically',
        histPlay: 'Play',
        histStop: 'Stop',
        histDelete: 'Delete',
        histDeleteSelected: 'Delete selected',
        histClear: 'Clear',
        histSelectAll: 'All',
        histDeleteConfirm: 'Delete the selected records? This cannot be undone.',
        histClearConfirm: 'Clear ALL records? This cannot be undone.',
        histConfirmTitle: 'Delete records',
        histConfirm: 'Confirm',
        histCancel: 'Cancel',
        histCount: '{n} items',
        stepRun: 'Run',
        installDir: 'Install dir',
        pythonPath: 'Python path',
        asrPortLabel: 'Service port',
        languageLabel: 'Language',
        pipIndex: 'pip index',
        partialInterval: 'Partial interval (ms)',
        maxAudio: 'Max audio (s)',
        deviceLabel: 'Device',
        saveConfig: 'Save',
        saved: 'Saved',
        installLog: 'Install log',
        serverLog: 'Server log',
        stepStateIdle: 'Not installed',
        stepStateRunning: 'Running',
        stepStateDone: 'Done',
        stepStateFailed: 'Failed',
        usageTitle: 'Usage',
        usageBody: 'Click the mic button on the right of the composer to record; partial text streams live into the bubble, and "Done, insert" writes the recognized text into the input box. Finish the environment setup on this page before first use.',
        usageReq: 'Requirements: git (git-lfs for the model repo), Python 3.12+. CUDA is used automatically when an NVIDIA GPU is present, otherwise CPU (slower).',
        loading: 'Loading…',
        copyOk: 'Path copied',
    },
};
let lang = 'zh';
const subscribers = new Set();
function normalize(value) {
    return typeof value === 'string' && value.toLowerCase().startsWith('en') ? 'en' : 'zh';
}
/** 初始化语言跟随宿主 locale 服务（返回反订阅清理函数）。 */
export function initI18n(ctx) {
    try {
        const locale = ctx.get('locale');
        const snapshot = locale?.getSnapshot?.();
        if (snapshot && snapshot.active !== undefined)
            setLang(normalize(snapshot.active));
    }
    catch { /* keep default */ }
    if (typeof document !== 'undefined' && lang === 'zh') {
        setLang(normalize(document.documentElement.lang || 'zh'));
    }
    ctx.on?.('locale/change', (...args) => {
        const next = args[0];
        setLang(normalize(typeof next === 'string' ? next : next?.active));
    });
}
export function setLang(next) {
    if (next === lang)
        return;
    lang = next;
    for (const notify of subscribers)
        notify();
}
export function getLang() {
    return lang;
}
export function onLangChange(notify) {
    subscribers.add(notify);
    return () => subscribers.delete(notify);
}
export function t(key, vars) {
    let text = COPY[lang][key] ?? COPY.zh[key] ?? key;
    if (vars !== undefined) {
        for (const [name, value] of Object.entries(vars)) {
            text = text.replaceAll(`{${name}}`, String(value));
        }
    }
    return text;
}
