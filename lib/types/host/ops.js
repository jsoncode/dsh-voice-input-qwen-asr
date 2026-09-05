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
import { STEP_IDS } from "./installer.js";
import { OVERRIDABLE_KEYS } from "./types.js";
import { saveStore } from "./store.js";
import { inspectInstalled, inspectUsable } from "./paths.js";
/** 校验并裁剪设置页提交的 overrides（未知键 / 类型不符一律丢弃）。 */
export function sanitizeOverrides(raw) {
    const overrides = {};
    if (raw === null || typeof raw !== 'object')
        return overrides;
    const source = raw;
    for (const key of OVERRIDABLE_KEYS) {
        const value = source[key];
        if (typeof value === 'string') {
            ;
            overrides[key] = value.trim();
        }
        else if (typeof value === 'number' && Number.isFinite(value)) {
            ;
            overrides[key] = value;
        }
    }
    // 数值字段范围约束
    if (typeof overrides.asrPort === 'number') {
        overrides.asrPort = Math.min(65535, Math.max(1024, Math.round(overrides.asrPort)));
    }
    if (typeof overrides.partialIntervalMs === 'number') {
        overrides.partialIntervalMs = Math.min(10_000, Math.max(300, Math.round(overrides.partialIntervalMs)));
    }
    if (typeof overrides.maxAudioSeconds === 'number') {
        overrides.maxAudioSeconds = Math.min(600, Math.max(5, Math.round(overrides.maxAudioSeconds)));
    }
    return overrides;
}
export async function runOp(deps, op, params) {
    switch (op) {
        case 'config.get':
            return { config: deps.effective(), storeDir: deps.storeFile };
        case 'config.save': {
            deps.store.overrides = sanitizeOverrides(params.overrides);
            saveStore(deps.storeFile, deps.store);
            return { config: deps.effective() };
        }
        case 'status': {
            const paths = deps.paths();
            return {
                config: deps.effective(),
                paths,
                installed: inspectInstalled(paths),
                usable: inspectUsable(paths),
                installing: deps.installer.status(),
                resetting: deps.reset.inProgress,
                server: deps.asr.status(),
            };
        }
        case 'install.start': {
            const steps = Array.isArray(params.steps) ? params.steps : [];
            const valid = steps.filter((step) => STEP_IDS.includes(step));
            const result = deps.installer.start(valid);
            if (!result.started)
                throw new Error(result.error ?? '安装启动失败');
            return { started: true };
        }
        case 'install.status':
            return deps.installer.status();
        case 'install.reset': {
            const result = await deps.reset.run(deps.effective, deps.paths, deps.asr, deps.installer);
            if (!result.ok)
                throw new Error(result.error ?? '环境重置失败');
            return { reset: true };
        }
        case 'server.start':
            return deps.asr.start();
        case 'server.stop':
            return deps.asr.stop();
        case 'server.log':
            return { log: deps.asr.logTail(200) };
        default:
            throw new Error(`unknown op: ${op}`);
    }
}
