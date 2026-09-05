/**
 * dsh-voice-input —— 运行环境路径解析与安装状态实测。
 *
 * 目录布局（installDir 默认 <storeDir>/voice-input）：
 *   <installDir>/Qwen3-ASR/            运行库（github.com/QwenLM/Qwen3-ASR）
 *     └── .venv/                       Python 虚拟环境（运行库目录下创建）
 *   <installDir>/Qwen3-ASR-0.6B/       模型库（modelscope.cn/Qwen/Qwen3-ASR-0.6B）
 *   <installDir>/Qwen3-ASR/.dsh-voice-input-deps-ok   依赖安装完成标记
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
export const RUNTIME_REPO = 'https://github.com/QwenLM/Qwen3-ASR';
export const MODEL_REPO = 'https://www.modelscope.cn/Qwen/Qwen3-ASR-0.6B.git';
export const RUNTIME_DIR_NAME = 'Qwen3-ASR';
export const MODEL_DIR_NAME = 'Qwen3-ASR-0.6B';
export function resolvePaths(config, storeDir, asrScript) {
    const installDir = config.installDir.trim() !== '' && isAbsolute(config.installDir.trim())
        ? config.installDir.trim()
        : join(storeDir, 'voice-input');
    // 自定义路径：绝对路径直接用；相对路径按 installDir 解析
    const runtimeDir = config.runtimeDir.trim() !== ''
        ? resolve(installDir, config.runtimeDir.trim())
        : join(installDir, RUNTIME_DIR_NAME);
    const modelDir = config.modelDir.trim() !== ''
        ? resolve(installDir, config.modelDir.trim())
        : join(installDir, MODEL_DIR_NAME);
    const venvDir = join(runtimeDir, '.venv');
    const venvPython = join(venvDir, process.platform === 'win32' ? 'Scripts\\python.exe' : 'bin/python');
    const depsMarker = join(runtimeDir, '.dsh-voice-input-deps-ok');
    return { installDir, runtimeDir, modelDir, venvDir, venvPython, depsMarker };
}
/** 以文件系统实测安装状态（不做双份记账）。 */
export function inspectInstalled(paths) {
    const isDir = (p) => {
        try {
            return statSync(p).isDirectory();
        }
        catch {
            return false;
        }
    };
    return {
        runtime: isDir(join(paths.runtimeDir, '.git')),
        model: isDir(join(paths.modelDir, '.git')),
        venv: existsSync(paths.venvPython),
        deps: existsSync(paths.depsMarker),
    };
}
const isDir = (p) => {
    try {
        return statSync(p).isDirectory();
    }
    catch {
        return false;
    }
};
/** git-lfs 指针文件特征（未安装 git-lfs 时克隆得到的是指针而非权重）。 */
export function isLfsPointer(text) {
    return text.includes('https://git-lfs.github.com') || text.includes('https://lfs.');
}
/** 环境可用性检测（与 git 克隆来源无关，用户自有目录同样命中）。 */
export function inspectUsable(paths) {
    const runtime = isDir(paths.runtimeDir)
        && (existsSync(join(paths.runtimeDir, 'pyproject.toml')) || existsSync(join(paths.runtimeDir, 'setup.py')));
    let model = false;
    const configJson = join(paths.modelDir, 'config.json');
    if (isDir(paths.modelDir) && existsSync(configJson)) {
        try {
            const text = readFileSync(configJson, 'utf8');
            model = !isLfsPointer(text.slice(0, 512)) && text.trim().startsWith('{');
        }
        catch {
            model = false;
        }
    }
    return { runtime, model };
}
/** 目录是否存在且非空（防止把用户自有文件当作克隆目标）。 */
export function isNonEmptyDir(p) {
    if (!isDir(p))
        return false;
    try {
        return readdirSync(p).length > 0;
    }
    catch {
        return false;
    }
}
