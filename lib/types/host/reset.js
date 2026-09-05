/**
 * dsh-voice-input-qwen-asr —— 环境重置。
 *
 * 清理由插件创建/管理的产物：venv、依赖标记，以及**默认位置**的运行库/模型库
 * 克隆目录。用户通过配置指定的自定义 runtimeDir / modelDir 本体不会被删除
 * （那是用户自己的文件），但其中的 .venv 与依赖标记属于插件产物，会被移除。
 */
import { rm } from 'node:fs/promises';
import { join, parse, isAbsolute } from 'node:path';
import { LEGACY_DEPS_MARKER_NAME } from "./paths.js";
export class EnvReset {
    resetting = false;
    get inProgress() {
        return this.resetting;
    }
    async run(getConfig, getPaths, asr, installer) {
        if (this.resetting)
            return { ok: false, error: '环境重置正在进行中' };
        if (installer.status().running)
            return { ok: false, error: '安装任务进行中，请等待完成或稍后再试' };
        this.resetting = true;
        try {
            asr.stop();
            const config = getConfig();
            const paths = getPaths();
            // 先删插件产物（venv / 标记，含 v0.1.0 旧名标记），再删默认位置的克隆目录
            await removeManaged(paths.venvDir);
            await removeManaged(paths.depsMarker);
            await removeManaged(join(paths.runtimeDir, LEGACY_DEPS_MARKER_NAME));
            if (config.runtimeDir.trim() === '')
                await removeManaged(paths.runtimeDir);
            if (config.modelDir.trim() === '')
                await removeManaged(paths.modelDir);
            return { ok: true };
        }
        catch (e) {
            return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
        finally {
            this.resetting = false;
        }
    }
}
/** 安全删除：仅接受绝对路径，且拒绝文件系统根 / 盘符根 / 一级目录。 */
async function removeManaged(target) {
    if (target.trim() === '' || !isAbsolute(target))
        return;
    const parsed = parse(target);
    if (target === parsed.root)
        return;
    // 相对根至少保留两层（如 C:\x、/srv），防止误删高层目录
    const rel = target.slice(parsed.root.length).replace(/[\\/]+$/, '');
    if (rel.split(/[\\/]/).filter(Boolean).length < 2)
        return;
    await rm(target, { recursive: true, force: true });
}
