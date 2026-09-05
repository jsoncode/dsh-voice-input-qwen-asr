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
/** 浏览器插件 ctx 最小视图。 */
export interface ClientCtx {
    get(name: string): unknown;
    on?(event: string, listener: (...args: unknown[]) => void): unknown;
}
export interface ClientPlugin {
    name: string;
    inject: string[];
    apply: (ctx: ClientCtx) => void;
}
export declare function createPlugin(): ClientPlugin;
//# sourceMappingURL=plugin.d.ts.map