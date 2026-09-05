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
import { fileURLToPath } from 'node:url';
import Schema from '@deepseek-ai/schemastery';
import './cordis-augment.d.ts';
import { isTrustedApiRequest } from "./fence.js";
import { Installer } from "./installer.js";
import { AsrServer } from "./asrproc.js";
import { EnvReset } from "./reset.js";
import { RelayHub } from "./relay.js";
import { runOp, sanitizeOverrides } from "./ops.js";
import { EMPTY_STORE, loadStore, resolveStoreDir, saveStore, storeFile, withDefaults } from "./store.js";
import { resolvePaths } from "./paths.js";
export const name = 'dsh-voice-input';
export const inject = ['webServer', 'connection', 'settings'];
/* ── 配置（docs/develop/basic/config）────────────────────────────── */
export const Config = Schema.object({
    installDir: Schema.string().default('').description('运行环境根目录（空 = 数据目录下 voice-input）'),
    runtimeDir: Schema.string().default('').description('自定义运行库目录（空 = <installDir>/Qwen3-ASR）；可用时跳过克隆'),
    modelDir: Schema.string().default('').description('自定义模型库目录（空 = <installDir>/Qwen3-ASR-0.6B）；可用时跳过克隆'),
    pythonPath: Schema.string().default('python').description('创建 venv 用的 Python（3.12+），PATH 名字或绝对路径'),
    asrPort: Schema.number().default(18_787).description('本地 ASR WebSocket 服务端口'),
    language: Schema.string().default('').description('强制转写语言（Chinese/English/…），空 = 自动检测'),
    pipIndexUrl: Schema.string().default('').description('pip 镜像源（空 = 默认源）'),
    partialIntervalMs: Schema.number().default(1200).description('部分转写推送间隔（毫秒）'),
    maxAudioSeconds: Schema.number().default(300).description('单次录音转写音频上限（秒）'),
    device: Schema.string().default('auto').description('推理设备：auto | cuda:0 | cpu'),
});
/* ── 常量 ────────────────────────────────────────────────────────── */
const API_PATH = '/dsh-voice-input/api';
const WS_PATH = '/api/dsh-voice-input.ws';
const API_BODY_LIMIT = 1 << 20;
/** 本文件为 lib/index.js → 包内 python/asr_server.py 在其上一级。 */
const ASR_SCRIPT = fileURLToPath(new URL('../python/asr_server.py', import.meta.url));
function writeApiJson(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
}
/* ── apply ───────────────────────────────────────────────────────── */
export function apply(ctx, config) {
    const webServer = ctx.get('webServer');
    const connection = ctx.get('connection');
    const settings = ctx.get('settings');
    const webRuntime = ctx.get('webRuntime');
    if (webServer === undefined || connection === undefined) {
        console.warn('[dsh-voice-input] 缺少 webServer/connection 服务，插件未启用');
        return;
    }
    const trustedHosts = webRuntime?.trustedHosts ?? [];
    // ── 运行时配置：静态 patch 配置 + 数据文件 overrides ──────────────
    const storeDir = resolveStoreDir(settings?.documentPath);
    const dataFile = storeFile(storeDir);
    const store = EMPTY_STORE();
    store.overrides = loadStore(dataFile).overrides;
    const effective = () => withDefaults({ ...config, ...store.overrides });
    const paths = () => resolvePaths(effective(), storeDir, ASR_SCRIPT);
    const installer = new Installer(paths, effective);
    const asr = new AsrServer(paths, effective, ASR_SCRIPT);
    const reset = new EnvReset();
    const hub = new RelayHub(() => asr);
    const saveOverrides = (overrides) => {
        store.overrides = overrides;
        saveStore(dataFile, store);
    };
    // ── HTTP API 路由（信任围栏 + 1MiB 请求体上限）────────────────────
    let unregisterRoute;
    try {
        unregisterRoute = webServer.register({
            kind: 'exact',
            path: API_PATH,
            handler: async (req, res) => {
                if (!isTrustedApiRequest(req.headers, trustedHosts)) {
                    writeApiJson(res, 403, { ok: false, error: { message: 'forbidden' } });
                    return;
                }
                if (req.method !== 'POST') {
                    writeApiJson(res, 405, { ok: false, error: { message: 'method not allowed' } });
                    return;
                }
                const body = await readBody(req, API_BODY_LIMIT);
                if (body === undefined) {
                    writeApiJson(res, 413, { ok: false, error: { message: 'request body too large' } });
                    return;
                }
                let parsed;
                try {
                    parsed = JSON.parse(body);
                }
                catch {
                    writeApiJson(res, 400, { ok: false, error: { message: 'invalid json' } });
                    return;
                }
                if (typeof parsed.op !== 'string' || parsed.op.trim() === '') {
                    writeApiJson(res, 400, { ok: false, error: { message: 'missing op' } });
                    return;
                }
                try {
                    const value = await runOp({ effective, paths, store, storeFile: dataFile, installer, asr, reset }, parsed.op, parsed);
                    writeApiJson(res, 200, { ok: true, value });
                }
                catch (e) {
                    writeApiJson(res, 200, { ok: false, error: { message: e instanceof Error ? e.message : String(e) } });
                }
            },
        });
    }
    catch (e) {
        console.warn('[dsh-voice-input] register api route failed:', e instanceof Error ? e.message : String(e));
    }
    // ── WebSocket 升级路由（录音音频流中继）───────────────────────────
    let unregisterUpgrade;
    try {
        unregisterUpgrade = webServer.registerUpgrade({
            path: WS_PATH,
            handler: (req, socket, head) => {
                const rejection = connection.requestRejection(req);
                if (rejection !== undefined) {
                    socket.destroy();
                    return;
                }
                hub.handleUpgrade(req, socket, head);
            },
        });
    }
    catch (e) {
        console.warn('[dsh-voice-input] register upgrade route failed:', e instanceof Error ? e.message : String(e));
    }
    ctx.effect(() => () => {
        try {
            unregisterRoute?.();
        }
        catch { /* already unregistered */ }
        try {
            unregisterUpgrade?.();
        }
        catch { /* already unregistered */ }
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
            if (done)
                return;
            done = true;
            resolveP(value);
        };
        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > limit) {
                finish(undefined);
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => finish(Buffer.concat(chunks).toString('utf8')));
        req.on('error', () => finish(undefined));
    });
}
export { sanitizeOverrides };
