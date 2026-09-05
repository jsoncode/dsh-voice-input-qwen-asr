import { fileURLToPath } from "node:url";
import Schema from "@deepseek-ai/schemastery";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, parse, resolve } from "node:path";
import { rm } from "node:fs/promises";
import { WebSocket, WebSocketServer } from "ws";
import { homedir } from "node:os";
//#region src/host/fence.ts
/** 规范化后的 URL hostname 是否指向本地回环（localhost / 127.0.0.0/8 / [::1]）。 */
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	const parts = hostname.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/** 规范化一个 Host 头 authority 为 URL，解析失败返回 undefined。 */
function parseAuthority(authority) {
	try {
		return new URL(`http://${authority}`);
	} catch {
		return;
	}
}
/** 规范化 authority 形式：hostname，或带端口的 hostname:port。 */
function canonicalAuthority(entry, entryUrl) {
	const port = entryUrl.port !== "" ? entryUrl.port : new URL(`https://${entry}`).port;
	return port === "" ? entryUrl.hostname : `${entryUrl.hostname}:${port}`;
}
/** 请求 authority 是否匹配 trustedHosts 中的一项（精确或省略端口）。 */
function isTrustedAuthority(hostUrl, trustedHosts) {
	return trustedHosts.some((entry) => {
		const entryUrl = parseAuthority(entry);
		if (entryUrl === void 0) return false;
		return canonicalAuthority(entry, entryUrl) === entryUrl.hostname ? entryUrl.hostname === hostUrl.hostname : entryUrl.host === hostUrl.host;
	});
}
/**
* 判定一次 /dsh-voice-input/api 请求是否可放行。
* @param headers - node HTTP 请求头。
* @param trustedHosts - 部署的非回环受信任主机（webRuntime.trustedHosts，可为空）。
* @returns true 表示 Host 是自有（回环或受信任）且浏览器标记为同源。
*/
function isTrustedApiRequest(headers, trustedHosts) {
	const raw = headers.host;
	if (typeof raw !== "string" || raw === "") return false;
	const hostUrl = parseAuthority(raw);
	if (hostUrl === void 0) return false;
	if (!isLoopbackHostname(hostUrl.hostname) && !isTrustedAuthority(hostUrl, trustedHosts)) return false;
	if (headers["sec-fetch-site"] === "cross-site") return false;
	const origin = headers.origin;
	if (typeof origin !== "string" || origin === "") return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
//#endregion
//#region src/host/paths.ts
/**
* dsh-voice-input —— 运行环境路径解析与安装状态实测。
*
* 目录布局（installDir 默认 <storeDir>/voice-input）：
*   <installDir>/Qwen3-ASR/            运行库（github.com/QwenLM/Qwen3-ASR）
*     └── .venv/                       Python 虚拟环境（运行库目录下创建）
*   <installDir>/Qwen3-ASR-0.6B/       模型库（modelscope.cn/Qwen/Qwen3-ASR-0.6B）
*   <installDir>/Qwen3-ASR/.dsh-voice-input-deps-ok   依赖安装完成标记
*/
const RUNTIME_REPO = "https://github.com/QwenLM/Qwen3-ASR";
const MODEL_REPO = "https://www.modelscope.cn/Qwen/Qwen3-ASR-0.6B.git";
const RUNTIME_DIR_NAME = "Qwen3-ASR";
const MODEL_DIR_NAME = "Qwen3-ASR-0.6B";
function resolvePaths(config, storeDir, asrScript) {
	const installDir = config.installDir.trim() !== "" && isAbsolute(config.installDir.trim()) ? config.installDir.trim() : join(storeDir, "voice-input");
	const runtimeDir = config.runtimeDir.trim() !== "" ? resolve(installDir, config.runtimeDir.trim()) : join(installDir, RUNTIME_DIR_NAME);
	const modelDir = config.modelDir.trim() !== "" ? resolve(installDir, config.modelDir.trim()) : join(installDir, MODEL_DIR_NAME);
	const venvDir = join(runtimeDir, ".venv");
	return {
		installDir,
		runtimeDir,
		modelDir,
		venvDir,
		venvPython: join(venvDir, process.platform === "win32" ? "Scripts\\python.exe" : "bin/python"),
		depsMarker: join(runtimeDir, ".dsh-voice-input-deps-ok")
	};
}
/** 以文件系统实测安装状态（不做双份记账）。 */
function inspectInstalled(paths) {
	const isDir = (p) => {
		try {
			return statSync(p).isDirectory();
		} catch {
			return false;
		}
	};
	return {
		runtime: isDir(join(paths.runtimeDir, ".git")),
		model: isDir(join(paths.modelDir, ".git")),
		venv: existsSync(paths.venvPython),
		deps: existsSync(paths.depsMarker)
	};
}
const isDir = (p) => {
	try {
		return statSync(p).isDirectory();
	} catch {
		return false;
	}
};
/** git-lfs 指针文件特征（未安装 git-lfs 时克隆得到的是指针而非权重）。 */
function isLfsPointer(text) {
	return text.includes("https://git-lfs.github.com") || text.includes("https://lfs.");
}
/** 环境可用性检测（与 git 克隆来源无关，用户自有目录同样命中）。 */
function inspectUsable(paths) {
	const runtime = isDir(paths.runtimeDir) && (existsSync(join(paths.runtimeDir, "pyproject.toml")) || existsSync(join(paths.runtimeDir, "setup.py")));
	let model = false;
	const configJson = join(paths.modelDir, "config.json");
	if (isDir(paths.modelDir) && existsSync(configJson)) try {
		const text = readFileSync(configJson, "utf8");
		model = !isLfsPointer(text.slice(0, 512)) && text.trim().startsWith("{");
	} catch {
		model = false;
	}
	return {
		runtime,
		model
	};
}
/** 目录是否存在且非空（防止把用户自有文件当作克隆目标）。 */
function isNonEmptyDir(p) {
	if (!isDir(p)) return false;
	try {
		return readdirSync(p).length > 0;
	} catch {
		return false;
	}
}
//#endregion
//#region src/host/installer.ts
/**
* dsh-voice-input —— 环境安装编排器。
*
* 四个步骤（可整体一键执行，也可单步重试）：
*   runtime : git clone https://github.com/QwenLM/Qwen3-ASR          （运行库）
*   model   : git clone https://www.modelscope.cn/Qwen/Qwen3-ASR-0.6B.git （模型库）
*   venv    : python -m venv <runtimeDir>/.venv                      （运行库目录下的虚拟环境）
*   deps    : venv pip install -e .（运行库）+ websockets/numpy       （依赖安装）
*
* 步骤在后台顺序执行，stdout/stderr 逐行进环形日志；浏览器半边轮询
* install.status 展示进度。已完成的步骤（目录/标记存在）自动跳过。
*/
const STEP_IDS = [
	"runtime",
	"model",
	"venv",
	"deps"
];
const LOG_LIMIT$1 = 800;
var Installer = class {
	getPaths;
	getConfig;
	child = null;
	running = false;
	queue = [];
	currentStep = null;
	states = new Map(STEP_IDS.map((id) => [id, "idle"]));
	exitCodes = new Map(STEP_IDS.map((id) => [id, null]));
	log = [];
	disposed = false;
	constructor(getPaths, getConfig) {
		this.getPaths = getPaths;
		this.getConfig = getConfig;
	}
	status() {
		const steps = Object.fromEntries(STEP_IDS.map((id) => [id, {
			state: this.states.get(id) ?? "idle",
			exitCode: this.exitCodes.get(id) ?? null
		}]));
		return {
			running: this.running,
			currentStep: this.currentStep,
			steps,
			log: this.log.slice(-200)
		};
	}
	/** 启动一批步骤（顺序执行）。已在安装中时拒绝。 */
	start(steps) {
		if (this.running) return {
			started: false,
			error: "已有安装任务在进行中"
		};
		const wanted = steps.filter((step) => STEP_IDS.includes(step));
		if (wanted.length === 0) return {
			started: false,
			error: "没有可执行的安装步骤"
		};
		for (const step of wanted) if (this.states.get(step) !== "done") this.states.set(step, "idle");
		this.queue = [...wanted];
		this.running = true;
		this.drain();
		return { started: true };
	}
	/** 插件卸载：终止运行中的子进程。 */
	dispose() {
		this.disposed = true;
		this.queue = [];
		this.killChild();
		this.running = false;
		if (this.currentStep !== null) this.states.set(this.currentStep, "failed");
		this.currentStep = null;
	}
	pushLog(line) {
		for (const part of line.replace(/\r$/, "").split("\n")) {
			if (part.trim() === "") continue;
			this.log.push(part);
		}
		if (this.log.length > LOG_LIMIT$1) this.log.splice(0, this.log.length - LOG_LIMIT$1);
	}
	killChild() {
		const child = this.child;
		this.child = null;
		if (child === null || child.exitCode !== null || child.killed) return;
		try {
			if (process.platform === "win32" && typeof child.pid === "number") spawn("taskkill", [
				"/T",
				"/F",
				"/PID",
				String(child.pid)
			], { windowsHide: true });
			else child.kill("SIGTERM");
		} catch {}
	}
	async drain() {
		try {
			while (this.queue.length > 0) {
				if (this.disposed) return;
				const step = this.queue.shift();
				this.currentStep = step;
				this.states.set(step, "running");
				this.pushLog(`── [${step}] 开始 ──`);
				try {
					await this.runStep(step);
					this.states.set(step, "done");
					this.exitCodes.set(step, 0);
					this.pushLog(`── [${step}] 完成 ──`);
				} catch (code) {
					this.exitCodes.set(step, typeof code === "number" ? code : -1);
					this.states.set(step, "failed");
					this.pushLog(`── [${step}] 失败（退出码 ${String(code)}）──`);
					this.pushLog("安装中止：请检查日志（常见原因：git/git-lfs 未安装、Python 版本低于 3.12、网络不通）");
					break;
				} finally {
					this.currentStep = null;
				}
			}
		} finally {
			this.running = false;
		}
	}
	async runStep(step) {
		const paths = this.getPaths();
		switch (step) {
			case "runtime": return this.stepRuntime(paths);
			case "model": return this.stepModel(paths);
			case "venv": return this.stepVenv(paths);
			case "deps": return this.stepDeps(paths);
		}
	}
	stepRuntime(paths) {
		if (inspectUsable(paths).runtime) {
			this.pushLog("[runtime] 运行库已可用（克隆目录或自定义路径），跳过克隆");
			return Promise.resolve();
		}
		if (existsSync(join(paths.runtimeDir, ".git"))) {
			this.pushLog("[runtime] 运行库目录已存在（可能未完成），跳过克隆");
			return Promise.resolve();
		}
		if (isNonEmptyDir(paths.runtimeDir)) {
			this.pushLog("[runtime] 运行库目录非空且非运行库结构，跳过克隆（避免覆盖用户文件）");
			return Promise.resolve();
		}
		this.pushLog(`[runtime] git clone ${RUNTIME_REPO}`);
		return this.exec([
			"git",
			"clone",
			"--depth",
			"1",
			RUNTIME_REPO,
			paths.runtimeDir
		], paths.installDir);
	}
	stepModel(paths) {
		if (inspectUsable(paths).model) {
			this.pushLog("[model] 模型已可用（克隆目录或自定义路径），跳过克隆");
			return Promise.resolve();
		}
		if (existsSync(join(paths.modelDir, ".git"))) {
			this.pushLog("[model] 模型库目录已存在（可能未完成），跳过克隆");
			return Promise.resolve();
		}
		if (isNonEmptyDir(paths.modelDir)) {
			this.pushLog("[model] 模型库目录非空且非模型结构，跳过克隆（避免覆盖用户文件）");
			return Promise.resolve();
		}
		this.pushLog(`[model] git clone ${MODEL_REPO}（模型权重经 git-lfs 分发，需已安装 git-lfs）`);
		return this.exec([
			"git",
			"clone",
			MODEL_REPO,
			paths.modelDir
		], paths.installDir);
	}
	async stepVenv(paths) {
		if (existsSync(paths.venvPython)) {
			this.pushLog("[venv] 虚拟环境已存在，跳过创建");
			return;
		}
		const python = this.getConfig().pythonPath.trim() || "python";
		this.pushLog(`[venv] ${python} -m venv .venv（位于运行库目录下）`);
		await this.exec([
			python,
			"-m",
			"venv",
			paths.venvDir
		], paths.installDir);
	}
	async stepDeps(paths) {
		if (!existsSync(paths.venvPython)) throw new Error("虚拟环境不存在");
		const pip = [
			paths.venvPython,
			"-m",
			"pip"
		];
		const indexArgs = this.getPipIndexArgs();
		this.pushLog("[deps] pip install -U pip");
		await this.exec([
			...pip,
			"install",
			"-U",
			"pip",
			...indexArgs
		], paths.runtimeDir);
		this.pushLog("[deps] pip install -e .（安装 Qwen3-ASR 运行库，含 torch/transformers，可能耗时较长）");
		await this.exec([
			...pip,
			"install",
			"-e",
			".",
			...indexArgs
		], paths.runtimeDir);
		this.pushLog("[deps] pip install websockets numpy");
		await this.exec([
			...pip,
			"install",
			"websockets",
			"numpy",
			...indexArgs
		], paths.runtimeDir);
		writeFileSync(paths.depsMarker, (/* @__PURE__ */ new Date()).toISOString(), "utf8");
	}
	getPipIndexArgs() {
		const index = this.getConfig().pipIndexUrl.trim();
		return index !== "" ? ["--index-url", index] : [];
	}
	/**
	* 以子进程执行一条命令，输出逐行进日志。
	* 退出码非 0 时以退出码 reject。installDir / pip 镜像在调用点已生效。
	*/
	exec(argv, cwd) {
		return new Promise((resolveP, rejectP) => {
			this.pushLog(`$ ${argv.join(" ")}  (cwd: ${cwd})`);
			let child;
			try {
				child = spawn(argv[0], argv.slice(1), {
					cwd: existsSync(cwd) ? cwd : void 0,
					windowsHide: true,
					env: this.childEnv()
				});
			} catch (e) {
				this.pushLog(`spawn 失败: ${e instanceof Error ? e.message : String(e)}`);
				rejectP(-1);
				return;
			}
			this.child = child;
			child.stdout?.setEncoding("utf8");
			child.stderr?.setEncoding("utf8");
			child.stdout?.on("data", (chunk) => this.pushLog(chunk));
			child.stderr?.on("data", (chunk) => this.pushLog(chunk));
			child.on("error", (e) => {
				this.pushLog(`进程错误: ${e.message}`);
				if (this.child === child) this.child = null;
				rejectP(-1);
			});
			child.on("close", (code) => {
				if (this.child === child) this.child = null;
				if (code === 0) resolveP();
				else rejectP(code ?? -1);
			});
		});
	}
	/** 子进程环境：追加 pip 镜像（PIP_INDEX_URL），使依赖下载与 -e . 构建同源。 */
	childEnv() {
		const index = this.getConfig().pipIndexUrl.trim();
		if (index === "") return process.env;
		return {
			...process.env,
			PIP_INDEX_URL: index
		};
	}
};
//#endregion
//#region src/host/asrproc.ts
/**
* dsh-voice-input —— 本地 ASR 服务进程管理。
*
* 以运行库 venv 的 Python 启动 python/asr_server.py（Qwen3-ASR-0.6B 推理 +
* WebSocket 服务）。进程 stdout 逐行输出 JSON 状态（loading/ready/fatal/log），
* 宿主解析后驱动状态机 stopped → starting → running/error，并维护环形服务
* 日志供设置页轮询。插件卸载（ctx.effect）时自动停止服务进程。
*/
const READY_TIMEOUT_MS = 3e5;
const LOG_LIMIT = 400;
var AsrServer = class {
	getPaths;
	getConfig;
	asrScript;
	child = null;
	state = "stopped";
	device = null;
	error = null;
	token = 0;
	readyWaiters = [];
	log = [];
	constructor(getPaths, getConfig, asrScript) {
		this.getPaths = getPaths;
		this.getConfig = getConfig;
		this.asrScript = asrScript;
	}
	status() {
		return {
			state: this.state,
			port: this.getConfig().asrPort,
			pid: this.child?.pid ?? null,
			device: this.device,
			error: this.error
		};
	}
	get isRunning() {
		return this.state === "running" && this.child !== null && this.child.exitCode === null;
	}
	logTail(count = 200) {
		return this.log.slice(-count);
	}
	/** 启动服务（幂等：starting/running 时直接返回当前状态）。 */
	async start() {
		if (this.state === "starting" || this.state === "running") return this.status();
		const cfg = this.getConfig();
		const paths = this.getPaths();
		if (!existsSync(paths.venvPython)) throw new Error("虚拟环境未创建，请先在设置页完成安装步骤");
		if (!existsSync(paths.modelDir)) throw new Error("模型库未克隆，请先在设置页完成安装步骤");
		if (!existsSync(this.asrScript)) throw new Error("插件损坏：缺少 python/asr_server.py");
		this.checkModelCloned(paths.modelDir);
		const token = ++this.token;
		this.state = "starting";
		this.device = null;
		this.error = null;
		this.pushLog(`$ 启动 ASR 服务（端口 ${cfg.asrPort}，设备 ${cfg.device}，语言 ${cfg.language || "自动"}）`);
		let child;
		try {
			child = spawn(paths.venvPython, [
				this.asrScript,
				"--model",
				paths.modelDir,
				"--port",
				String(cfg.asrPort),
				"--language",
				cfg.language,
				"--device",
				cfg.device || "auto",
				"--partial-interval-ms",
				String(Math.max(300, Math.round(cfg.partialIntervalMs))),
				"--max-audio-seconds",
				String(Math.max(5, Math.round(cfg.maxAudioSeconds)))
			], { windowsHide: true });
		} catch (e) {
			this.state = "error";
			this.error = e instanceof Error ? e.message : String(e);
			throw new Error(this.error);
		}
		this.child = child;
		child.stdout?.setEncoding("utf8");
		child.stderr?.setEncoding("utf8");
		child.stdout?.on("data", (chunk) => this.onOutput(chunk, token));
		child.stderr?.on("data", (chunk) => this.pushLog(chunk));
		child.on("error", (e) => {
			this.pushLog(`进程错误: ${e.message}`);
			this.fail(token, e.message);
		});
		child.on("close", (code, signal) => {
			if (this.child === child) this.child = null;
			this.resolveWaiters();
			if (this.state === "starting") {
				this.state = "error";
				this.error = `服务进程提前退出（code=${String(code)} signal=${String(signal)}），详见服务日志`;
			} else if (this.state === "running") {
				this.pushLog(`ASR 服务进程退出（code=${String(code)}）`);
				this.state = "stopped";
			}
		});
		await new Promise((resolveP, rejectP) => {
			const timer = setTimeout(() => {
				rejectP(/* @__PURE__ */ new Error("启动超时：模型加载超过 300s（首次 CPU 加载较慢，可查看服务日志确认进度）"));
			}, READY_TIMEOUT_MS);
			this.readyWaiters.push({
				resolve: () => {
					clearTimeout(timer);
					resolveP();
				},
				reject: (e) => {
					clearTimeout(timer);
					rejectP(e);
				},
				timer
			});
		});
		return this.status();
	}
	/** 停止服务进程（Windows 下树杀）。 */
	stop() {
		const child = this.child;
		this.resolveWaiters();
		if (child !== null && child.exitCode === null && !child.killed) try {
			if (process.platform === "win32" && typeof child.pid === "number") spawn("taskkill", [
				"/T",
				"/F",
				"/PID",
				String(child.pid)
			], { windowsHide: true });
			else child.kill("SIGTERM");
		} catch {}
		this.child = null;
		this.state = "stopped";
		this.error = null;
		return this.status();
	}
	/** 插件卸载：确保服务进程终止。 */
	dispose() {
		this.token++;
		this.stop();
	}
	/** 模型目录粗检：git-lfs 未安装时克隆得到的是指针文件，提前给出可读错误。 */
	checkModelCloned(modelDir) {
		try {
			if (isLfsPointer(readFileSync(`${modelDir}/config.json`, "utf8").slice(0, 512))) throw new Error("模型权重尚未下载（检测到 git-lfs 指针文件），请先安装 git-lfs 后重新克隆模型库");
		} catch (e) {
			if (e instanceof Error && e.message.includes("git-lfs")) throw e;
		}
	}
	onOutput(chunk, token) {
		for (const line of chunk.split("\n")) {
			const text = line.trim();
			if (text === "") continue;
			let payload;
			try {
				payload = JSON.parse(text);
			} catch {
				this.pushLog(text);
				continue;
			}
			const type = payload.type;
			if (type === "status") this.pushLog(`[asr] ${String(payload.state)}（device: ${String(payload.device ?? "?")}）`);
			else if (type === "ready") {
				this.pushLog(`[asr] ready（device: ${String(payload.device ?? "?")}）`);
				if (token === this.token) {
					this.device = typeof payload.device === "string" ? payload.device : null;
					this.state = "running";
					this.resolveWaiters();
				}
			} else if (type === "fatal") {
				this.pushLog(`[asr] fatal: ${String(payload.message ?? "")}`);
				this.fail(token, String(payload.message ?? "ASR 服务启动失败"));
			} else if (type === "log") this.pushLog(`[asr] ${String(payload.message ?? "")}`);
			else this.pushLog(text);
		}
	}
	fail(token, message) {
		if (token !== this.token) return;
		this.state = "error";
		this.error = message;
		this.rejectWaiters(new Error(message));
	}
	resolveWaiters() {
		const waiters = this.readyWaiters;
		this.readyWaiters = [];
		for (const waiter of waiters) waiter.resolve();
	}
	rejectWaiters(error) {
		const waiters = this.readyWaiters;
		this.readyWaiters = [];
		for (const waiter of waiters) waiter.reject(error);
	}
	pushLog(line) {
		for (const part of line.replace(/\r$/, "").split("\n")) {
			if (part.trim() === "") continue;
			this.log.push(part);
		}
		if (this.log.length > LOG_LIMIT) this.log.splice(0, this.log.length - LOG_LIMIT);
	}
};
//#endregion
//#region src/host/reset.ts
/**
* dsh-voice-input —— 环境重置。
*
* 清理由插件创建/管理的产物：venv、依赖标记，以及**默认位置**的运行库/模型库
* 克隆目录。用户通过配置指定的自定义 runtimeDir / modelDir 本体不会被删除
* （那是用户自己的文件），但其中的 .venv 与依赖标记属于插件产物，会被移除。
*/
var EnvReset = class {
	resetting = false;
	get inProgress() {
		return this.resetting;
	}
	async run(getConfig, getPaths, asr, installer) {
		if (this.resetting) return {
			ok: false,
			error: "环境重置正在进行中"
		};
		if (installer.status().running) return {
			ok: false,
			error: "安装任务进行中，请等待完成或稍后再试"
		};
		this.resetting = true;
		try {
			asr.stop();
			const config = getConfig();
			const paths = getPaths();
			await removeManaged(paths.venvDir);
			await removeManaged(paths.depsMarker);
			if (config.runtimeDir.trim() === "") await removeManaged(paths.runtimeDir);
			if (config.modelDir.trim() === "") await removeManaged(paths.modelDir);
			return { ok: true };
		} catch (e) {
			return {
				ok: false,
				error: e instanceof Error ? e.message : String(e)
			};
		} finally {
			this.resetting = false;
		}
	}
};
/** 安全删除：仅接受绝对路径，且拒绝文件系统根 / 盘符根 / 一级目录。 */
async function removeManaged(target) {
	if (target.trim() === "" || !isAbsolute(target)) return;
	const parsed = parse(target);
	if (target === parsed.root) return;
	if (target.slice(parsed.root.length).replace(/[\\/]+$/, "").split(/[\\/]/).filter(Boolean).length < 2) return;
	await rm(target, {
		recursive: true,
		force: true
	});
}
//#endregion
//#region src/host/relay.ts
/**
* dsh-voice-input —— 浏览器 ⇄ 本地 ASR 服务的 WebSocket 中继 Hub。
*
* 升级路由 /api/dsh-voice-input.ws（宿主 webServer 注册，connection 服务鉴权）。
* 每个浏览器连接对应一条到本地 ASR 服务（ws://127.0.0.1:<port>/ws）的上游连接：
* - 浏览器 → 宿主：二进制帧 = PCM16 音频块；文本帧 = JSON 控制（stop/abort）；
* - 宿主 → 浏览器：ASR 上游的 JSON 文本帧原样转发（partial/final/state/error）。
* 浏览器断开时向上游发送 abort 并关闭，保证会话缓冲被重置。
*/
var RelayHub = class {
	getServer;
	wss = new WebSocketServer({ noServer: true });
	browserSockets = /* @__PURE__ */ new Set();
	constructor(getServer) {
		this.getServer = getServer;
		this.wss.on("connection", (ws) => this.handleConnection(ws));
	}
	/** webServer.registerUpgrade 的 handler 入口（鉴权由插件入口完成后调用）。 */
	handleUpgrade(req, socket, head) {
		this.wss.handleUpgrade(req, socket, head, (ws) => {
			this.wss.emit("connection", ws, req);
		});
	}
	/** 插件卸载：断开所有连接。 */
	dispose() {
		for (const ws of this.browserSockets) try {
			ws.terminate();
		} catch {}
		this.browserSockets.clear();
		try {
			this.wss.close();
		} catch {}
	}
	handleConnection(ws) {
		this.browserSockets.add(ws);
		const server = this.getServer();
		const cleanup = () => {
			this.browserSockets.delete(ws);
		};
		if (!server.isRunning) {
			this.sendJson(ws, {
				type: "error",
				code: "not_running",
				message: "ASR 服务未运行，请在设置页（语音识别）中启动服务"
			});
			try {
				ws.close(1013, "asr-not-running");
			} catch {}
			cleanup();
			return;
		}
		let upstream;
		try {
			upstream = new WebSocket(`ws://127.0.0.1:${server.status().port}/ws`);
		} catch (e) {
			this.sendJson(ws, {
				type: "error",
				message: `无法连接本地 ASR 服务: ${e instanceof Error ? e.message : String(e)}`
			});
			try {
				ws.close();
			} catch {}
			cleanup();
			return;
		}
		upstream.on("open", () => {
			this.sendJson(ws, {
				type: "state",
				recording: true
			});
		});
		upstream.on("message", (data, isBinary) => {
			if (isBinary || ws.readyState !== WebSocket.OPEN) return;
			ws.send(data.toString());
		});
		upstream.on("close", () => {
			if (ws.readyState === WebSocket.OPEN) ws.close();
		});
		upstream.on("error", (err) => {
			this.sendJson(ws, {
				type: "error",
				message: `本地 ASR 连接失败: ${err.message}`
			});
			try {
				ws.close();
			} catch {}
		});
		ws.on("message", (data, isBinary) => {
			if (upstream.readyState !== WebSocket.OPEN) return;
			if (isBinary) upstream.send(data);
			else upstream.send(data.toString());
		});
		ws.on("close", () => {
			cleanup();
			if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
				try {
					upstream.send(JSON.stringify({ type: "abort" }));
				} catch {}
				try {
					upstream.close();
				} catch {}
			}
		});
		ws.on("error", () => {
			try {
				upstream.close();
			} catch {}
		});
	}
	sendJson(ws, payload) {
		if (ws.readyState !== WebSocket.OPEN) return;
		try {
			ws.send(JSON.stringify(payload));
		} catch {}
	}
};
//#endregion
//#region src/host/types.ts
const OVERRIDABLE_KEYS = [
	"installDir",
	"runtimeDir",
	"modelDir",
	"pythonPath",
	"asrPort",
	"language",
	"pipIndexUrl",
	"partialIntervalMs",
	"maxAudioSeconds",
	"device"
];
//#endregion
//#region src/host/store.ts
/**
* dsh-voice-input —— 插件数据文件（$DSH_HOME/dsh-voice-input.json）。
*
* 只存运行时可编辑的配置 overrides（设置页写入），安装状态一律以文件系统
* 实测为准（目录/venv/标记文件），不做双份记账。原子写：临时文件 + rename。
*/
const EMPTY_STORE = () => ({ overrides: {} });
/** 数据目录：settings 文档同目录 → $DSH_HOME → ~/.dsh。 */
function resolveStoreDir(documentPath) {
	if (typeof documentPath === "string" && documentPath.trim() !== "") {
		const dir = dirname(documentPath);
		if (dir.trim() !== "") return dir;
	}
	const fromEnv = process.env.DSH_HOME?.trim();
	if (fromEnv) return fromEnv;
	return join(homedir(), ".dsh");
}
function storeFile(storeDir) {
	return join(storeDir, "dsh-voice-input.json");
}
function loadStore(file) {
	try {
		const raw = JSON.parse(readFileSync(file, "utf8"));
		if (raw === null || typeof raw !== "object") return EMPTY_STORE();
		const overrides = {};
		for (const key of OVERRIDABLE_KEYS) {
			const value = raw.overrides?.[key];
			if (typeof value === "string" || typeof value === "number") overrides[key] = value;
		}
		return { overrides };
	} catch {
		return EMPTY_STORE();
	}
}
function saveStore(file, store) {
	mkdirSync(dirname(file), { recursive: true });
	const tmp = `${file}.tmp`;
	writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
	renameSync(tmp, file);
}
/** 静态 patch 配置兜底值（patch 空配置或宿主未做 schema 填充时；显式 undefined 不覆盖默认）。 */
function withDefaults(config) {
	const merged = { ...config };
	for (const key of Object.keys(merged)) if (merged[key] === void 0) delete merged[key];
	return {
		installDir: "",
		runtimeDir: "",
		modelDir: "",
		pythonPath: "python",
		asrPort: 18787,
		language: "",
		pipIndexUrl: "",
		partialIntervalMs: 1200,
		maxAudioSeconds: 300,
		device: "auto",
		...merged
	};
}
//#endregion
//#region src/host/ops.ts
/**
* dsh-voice-input —— /dsh-voice-input/api 的 op 分发。
*
* op 列表（POST JSON：{ op, ...params }）：
*   config.get                       → { config, storeDir }
*   config.save { overrides }        → { config }          设置页持久化 overrides
*   status                           → { config, paths, installed, installing, server }
*   install.start { steps }          → { started }
*   install.status                   → InstallerStatus
*   server.start / server.stop       → AsrStatus
*   server.log                       → { log }
*/
/** 校验并裁剪设置页提交的 overrides（未知键 / 类型不符一律丢弃）。 */
function sanitizeOverrides(raw) {
	const overrides = {};
	if (raw === null || typeof raw !== "object") return overrides;
	const source = raw;
	for (const key of OVERRIDABLE_KEYS) {
		const value = source[key];
		if (typeof value === "string") overrides[key] = value.trim();
		else if (typeof value === "number" && Number.isFinite(value)) overrides[key] = value;
	}
	if (typeof overrides.asrPort === "number") overrides.asrPort = Math.min(65535, Math.max(1024, Math.round(overrides.asrPort)));
	if (typeof overrides.partialIntervalMs === "number") overrides.partialIntervalMs = Math.min(1e4, Math.max(300, Math.round(overrides.partialIntervalMs)));
	if (typeof overrides.maxAudioSeconds === "number") overrides.maxAudioSeconds = Math.min(600, Math.max(5, Math.round(overrides.maxAudioSeconds)));
	return overrides;
}
async function runOp(deps, op, params) {
	switch (op) {
		case "config.get": return {
			config: deps.effective(),
			storeDir: deps.storeFile
		};
		case "config.save":
			deps.store.overrides = sanitizeOverrides(params.overrides);
			saveStore(deps.storeFile, deps.store);
			return { config: deps.effective() };
		case "status": {
			const paths = deps.paths();
			return {
				config: deps.effective(),
				paths,
				installed: inspectInstalled(paths),
				usable: inspectUsable(paths),
				installing: deps.installer.status(),
				resetting: deps.reset.inProgress,
				server: deps.asr.status()
			};
		}
		case "install.start": {
			const valid = (Array.isArray(params.steps) ? params.steps : []).filter((step) => STEP_IDS.includes(step));
			const result = deps.installer.start(valid);
			if (!result.started) throw new Error(result.error ?? "安装启动失败");
			return { started: true };
		}
		case "install.status": return deps.installer.status();
		case "install.reset": {
			const result = await deps.reset.run(deps.effective, deps.paths, deps.asr, deps.installer);
			if (!result.ok) throw new Error(result.error ?? "环境重置失败");
			return { reset: true };
		}
		case "server.start": return deps.asr.start();
		case "server.stop": return deps.asr.stop();
		case "server.log": return { log: deps.asr.logTail(200) };
		default: throw new Error(`unknown op: ${op}`);
	}
}
//#endregion
//#region src/host/index.ts
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
const name = "dsh-voice-input";
const inject = [
	"webServer",
	"connection",
	"settings"
];
const Config = Schema.object({
	installDir: Schema.string().default("").description("运行环境根目录（空 = 数据目录下 voice-input）"),
	runtimeDir: Schema.string().default("").description("自定义运行库目录（空 = <installDir>/Qwen3-ASR）；可用时跳过克隆"),
	modelDir: Schema.string().default("").description("自定义模型库目录（空 = <installDir>/Qwen3-ASR-0.6B）；可用时跳过克隆"),
	pythonPath: Schema.string().default("python").description("创建 venv 用的 Python（3.12+），PATH 名字或绝对路径"),
	asrPort: Schema.number().default(18787).description("本地 ASR WebSocket 服务端口"),
	language: Schema.string().default("").description("强制转写语言（Chinese/English/…），空 = 自动检测"),
	pipIndexUrl: Schema.string().default("").description("pip 镜像源（空 = 默认源）"),
	partialIntervalMs: Schema.number().default(1200).description("部分转写推送间隔（毫秒）"),
	maxAudioSeconds: Schema.number().default(300).description("单次录音转写音频上限（秒）"),
	device: Schema.string().default("auto").description("推理设备：auto | cuda:0 | cpu")
});
const API_PATH = "/dsh-voice-input/api";
const WS_PATH = "/api/dsh-voice-input.ws";
const API_BODY_LIMIT = 1 << 20;
/** 本文件为 lib/index.js → 包内 python/asr_server.py 在其上一级。 */
const ASR_SCRIPT = fileURLToPath(new URL("../python/asr_server.py", import.meta.url));
function writeApiJson(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function apply(ctx, config) {
	const webServer = ctx.get("webServer");
	const connection = ctx.get("connection");
	const settings = ctx.get("settings");
	const webRuntime = ctx.get("webRuntime");
	if (webServer === void 0 || connection === void 0) {
		console.warn("[dsh-voice-input] 缺少 webServer/connection 服务，插件未启用");
		return;
	}
	const trustedHosts = webRuntime?.trustedHosts ?? [];
	const storeDir = resolveStoreDir(settings?.documentPath);
	const dataFile = storeFile(storeDir);
	const store = EMPTY_STORE();
	store.overrides = loadStore(dataFile).overrides;
	const effective = () => withDefaults({
		...config,
		...store.overrides
	});
	const paths = () => resolvePaths(effective(), storeDir, ASR_SCRIPT);
	const installer = new Installer(paths, effective);
	const asr = new AsrServer(paths, effective, ASR_SCRIPT);
	const reset = new EnvReset();
	const hub = new RelayHub(() => asr);
	let unregisterRoute;
	try {
		unregisterRoute = webServer.register({
			kind: "exact",
			path: API_PATH,
			handler: async (req, res) => {
				if (!isTrustedApiRequest(req.headers, trustedHosts)) {
					writeApiJson(res, 403, {
						ok: false,
						error: { message: "forbidden" }
					});
					return;
				}
				if (req.method !== "POST") {
					writeApiJson(res, 405, {
						ok: false,
						error: { message: "method not allowed" }
					});
					return;
				}
				const body = await readBody(req, API_BODY_LIMIT);
				if (body === void 0) {
					writeApiJson(res, 413, {
						ok: false,
						error: { message: "request body too large" }
					});
					return;
				}
				let parsed;
				try {
					parsed = JSON.parse(body);
				} catch {
					writeApiJson(res, 400, {
						ok: false,
						error: { message: "invalid json" }
					});
					return;
				}
				if (typeof parsed.op !== "string" || parsed.op.trim() === "") {
					writeApiJson(res, 400, {
						ok: false,
						error: { message: "missing op" }
					});
					return;
				}
				try {
					writeApiJson(res, 200, {
						ok: true,
						value: await runOp({
							effective,
							paths,
							store,
							storeFile: dataFile,
							installer,
							asr,
							reset
						}, parsed.op, parsed)
					});
				} catch (e) {
					writeApiJson(res, 200, {
						ok: false,
						error: { message: e instanceof Error ? e.message : String(e) }
					});
				}
			}
		});
	} catch (e) {
		console.warn("[dsh-voice-input] register api route failed:", e instanceof Error ? e.message : String(e));
	}
	let unregisterUpgrade;
	try {
		unregisterUpgrade = webServer.registerUpgrade({
			path: WS_PATH,
			handler: (req, socket, head) => {
				if (connection.requestRejection(req) !== void 0) {
					socket.destroy();
					return;
				}
				hub.handleUpgrade(req, socket, head);
			}
		});
	} catch (e) {
		console.warn("[dsh-voice-input] register upgrade route failed:", e instanceof Error ? e.message : String(e));
	}
	ctx.effect(() => () => {
		try {
			unregisterRoute?.();
		} catch {}
		try {
			unregisterUpgrade?.();
		} catch {}
		hub.dispose();
		asr.dispose();
		installer.dispose();
	});
}
/** 读取有界请求体（超限返回 undefined）。 */
async function readBody(req, limit) {
	return new Promise((resolveP) => {
		let size = 0;
		const chunks = [];
		let done = false;
		const finish = (value) => {
			if (done) return;
			done = true;
			resolveP(value);
		};
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > limit) {
				finish(void 0);
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => finish(Buffer.concat(chunks).toString("utf8")));
		req.on("error", () => finish(void 0));
	});
}
//#endregion
export { Config, apply, inject, name, sanitizeOverrides };
