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
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isNonEmptyDir, inspectUsable, depsInstalled, MODEL_REPO, RUNTIME_REPO } from "./paths.js";
export const STEP_IDS = ['runtime', 'model', 'venv', 'deps'];
const LOG_LIMIT = 800;
export class Installer {
    getPaths;
    getConfig;
    child = null;
    running = false;
    queue = [];
    currentStep = null;
    states = new Map(STEP_IDS.map((id) => [id, 'idle']));
    exitCodes = new Map(STEP_IDS.map((id) => [id, null]));
    log = [];
    disposed = false;
    constructor(getPaths, getConfig) {
        this.getPaths = getPaths;
        this.getConfig = getConfig;
    }
    status() {
        const steps = Object.fromEntries(STEP_IDS.map((id) => [id, { state: this.states.get(id) ?? 'idle', exitCode: this.exitCodes.get(id) ?? null }]));
        return { running: this.running, currentStep: this.currentStep, steps, log: this.log.slice(-200) };
    }
    /** 启动一批步骤（顺序执行）。已在安装中时拒绝。 */
    start(steps) {
        if (this.running)
            return { started: false, error: '已有安装任务在进行中' };
        const wanted = steps.filter((step) => STEP_IDS.includes(step));
        if (wanted.length === 0)
            return { started: false, error: '没有可执行的安装步骤' };
        for (const step of wanted) {
            if (this.states.get(step) !== 'done')
                this.states.set(step, 'idle');
        }
        this.queue = [...wanted];
        this.running = true;
        void this.drain();
        return { started: true };
    }
    /** 插件卸载：终止运行中的子进程。 */
    dispose() {
        this.disposed = true;
        this.queue = [];
        this.killChild();
        this.running = false;
        if (this.currentStep !== null)
            this.states.set(this.currentStep, 'failed');
        this.currentStep = null;
    }
    /* ── 内部 ──────────────────────────────────────────────────────── */
    pushLog(line) {
        for (const part of line.replace(/\r$/, '').split('\n')) {
            if (part.trim() === '')
                continue;
            this.log.push(part);
        }
        if (this.log.length > LOG_LIMIT)
            this.log.splice(0, this.log.length - LOG_LIMIT);
    }
    killChild() {
        const child = this.child;
        this.child = null;
        if (child === null || child.exitCode !== null || child.killed)
            return;
        try {
            if (process.platform === 'win32' && typeof child.pid === 'number') {
                spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { windowsHide: true });
            }
            else {
                child.kill('SIGTERM');
            }
        }
        catch { /* already gone */ }
    }
    async drain() {
        try {
            while (this.queue.length > 0) {
                if (this.disposed)
                    return;
                const step = this.queue.shift();
                this.currentStep = step;
                this.states.set(step, 'running');
                this.pushLog(`── [${step}] 开始 ──`);
                try {
                    await this.runStep(step);
                    this.states.set(step, 'done');
                    this.exitCodes.set(step, 0);
                    this.pushLog(`── [${step}] 完成 ──`);
                }
                catch (code) {
                    // runStep 以退出码 reject（非 0 / 信号）
                    this.exitCodes.set(step, typeof code === 'number' ? code : -1);
                    this.states.set(step, 'failed');
                    this.pushLog(`── [${step}] 失败（退出码 ${String(code)}）──`);
                    this.pushLog('安装中止：请检查日志（常见原因：git/git-lfs 未安装、Python 版本低于 3.12、网络不通）');
                    break;
                }
                finally {
                    this.currentStep = null;
                }
            }
        }
        finally {
            this.running = false;
        }
    }
    async runStep(step) {
        const paths = this.getPaths();
        switch (step) {
            case 'runtime': return this.stepRuntime(paths);
            case 'model': return this.stepModel(paths);
            case 'venv': return this.stepVenv(paths);
            case 'deps': return this.stepDeps(paths);
        }
    }
    stepRuntime(paths) {
        // 可用性优先：默认克隆目录或用户自定义运行库（含 git 之外的来源）均命中
        if (inspectUsable(paths).runtime) {
            this.pushLog('[runtime] 运行库已可用（克隆目录或自定义路径），跳过克隆');
            return Promise.resolve();
        }
        if (existsSync(join(paths.runtimeDir, '.git'))) {
            this.pushLog('[runtime] 运行库目录已存在（可能未完成），跳过克隆');
            return Promise.resolve();
        }
        if (isNonEmptyDir(paths.runtimeDir)) {
            this.pushLog('[runtime] 运行库目录非空且非运行库结构，跳过克隆（避免覆盖用户文件）');
            return Promise.resolve();
        }
        this.pushLog(`[runtime] git clone ${RUNTIME_REPO}`);
        return this.exec(['git', 'clone', '--depth', '1', RUNTIME_REPO, paths.runtimeDir], paths.installDir);
    }
    stepModel(paths) {
        if (inspectUsable(paths).model) {
            this.pushLog('[model] 模型已可用（克隆目录或自定义路径），跳过克隆');
            return Promise.resolve();
        }
        if (existsSync(join(paths.modelDir, '.git'))) {
            this.pushLog('[model] 模型库目录已存在（可能未完成），跳过克隆');
            return Promise.resolve();
        }
        if (isNonEmptyDir(paths.modelDir)) {
            this.pushLog('[model] 模型库目录非空且非模型结构，跳过克隆（避免覆盖用户文件）');
            return Promise.resolve();
        }
        this.pushLog(`[model] git clone ${MODEL_REPO}（模型权重经 git-lfs 分发，需已安装 git-lfs）`);
        return this.exec(['git', 'clone', MODEL_REPO, paths.modelDir], paths.installDir);
    }
    async stepVenv(paths) {
        if (existsSync(paths.venvPython)) {
            this.pushLog('[venv] 虚拟环境已存在，跳过创建');
            return;
        }
        const python = this.getConfig().pythonPath.trim() || 'python';
        this.pushLog(`[venv] ${python} -m venv .venv（位于运行库目录下）`);
        await this.exec([python, '-m', 'venv', paths.venvDir], paths.installDir);
    }
    async stepDeps(paths) {
        if (!existsSync(paths.venvPython))
            throw new Error('虚拟环境不存在');
        // 已装依赖（当前名或旧名标记）则跳过，避免重复下载 torch
        if (depsInstalled(paths)) {
            this.pushLog('[deps] 依赖已安装（完成标记存在），跳过安装');
            return;
        }
        const pip = [paths.venvPython, '-m', 'pip'];
        const indexArgs = this.getPipIndexArgs();
        this.pushLog('[deps] pip install -U pip');
        await this.exec([...pip, 'install', '-U', 'pip', ...indexArgs], paths.runtimeDir);
        this.pushLog('[deps] pip install -e .（安装 Qwen3-ASR 运行库，含 torch/transformers，可能耗时较长）');
        await this.exec([...pip, 'install', '-e', '.', ...indexArgs], paths.runtimeDir);
        this.pushLog('[deps] pip install websockets numpy');
        await this.exec([...pip, 'install', 'websockets', 'numpy', ...indexArgs], paths.runtimeDir);
        writeFileSync(paths.depsMarker, new Date().toISOString(), 'utf8');
    }
    getPipIndexArgs() {
        const index = this.getConfig().pipIndexUrl.trim();
        return index !== '' ? ['--index-url', index] : [];
    }
    /**
     * 以子进程执行一条命令，输出逐行进日志。
     * 退出码非 0 时以退出码 reject。installDir / pip 镜像在调用点已生效。
     */
    exec(argv, cwd) {
        return new Promise((resolveP, rejectP) => {
            this.pushLog(`$ ${argv.join(' ')}  (cwd: ${cwd})`);
            let child;
            try {
                child = spawn(argv[0], argv.slice(1), {
                    cwd: existsSync(cwd) ? cwd : undefined,
                    windowsHide: true,
                    env: this.childEnv(),
                });
            }
            catch (e) {
                this.pushLog(`spawn 失败: ${e instanceof Error ? e.message : String(e)}`);
                rejectP(-1);
                return;
            }
            this.child = child;
            child.stdout?.setEncoding('utf8');
            child.stderr?.setEncoding('utf8');
            child.stdout?.on('data', (chunk) => this.pushLog(chunk));
            child.stderr?.on('data', (chunk) => this.pushLog(chunk));
            child.on('error', (e) => {
                this.pushLog(`进程错误: ${e.message}`);
                if (this.child === child)
                    this.child = null;
                rejectP(-1);
            });
            child.on('close', (code) => {
                if (this.child === child)
                    this.child = null;
                if (code === 0)
                    resolveP();
                else
                    rejectP(code ?? -1);
            });
        });
    }
    /** 子进程环境：追加 pip 镜像（PIP_INDEX_URL），使依赖下载与 -e . 构建同源。 */
    childEnv() {
        const index = this.getConfig().pipIndexUrl.trim();
        if (index === '')
            return process.env;
        return { ...process.env, PIP_INDEX_URL: index };
    }
}
