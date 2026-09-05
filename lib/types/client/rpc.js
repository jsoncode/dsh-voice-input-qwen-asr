/**
 * dsh-voice-input-qwen-asr —— 浏览器半边 → 宿主 HTTP RPC（/dsh-voice-input-qwen-asr/api）。
 *
 * POST JSON（{ op, ...params }），宿主以 { ok, value } / { ok, error } 信封回传。
 * 请求不进入对话命令通道，页面不会出现 command 节点 / 调试卡片。
 */
export class ApiError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ApiError';
    }
}
export async function api(op, params) {
    let res;
    try {
        res = await fetch('/dsh-voice-input-qwen-asr/api', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ op, ...(params ?? {}) }),
        });
    }
    catch (e) {
        throw new ApiError(`网络错误: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (res.status !== 200)
        throw new ApiError(`HTTP ${res.status}`);
    let body;
    try {
        body = (await res.json());
    }
    catch {
        throw new ApiError('响应解析失败');
    }
    if (!body.ok)
        throw new ApiError(body.error?.message ?? '请求失败');
    return body.value;
}
