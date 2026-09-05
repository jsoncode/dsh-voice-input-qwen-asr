/**
 * dsh-voice-input-qwen-asr —— 浏览器半边双语词典（zh/en）。
 *
 * 语言跟随宿主：ctx.get('locale') 快照 → locale/change 事件 → document.lang，
 * 切换时通过订阅者重渲染（与 dsh-jenkins 同一方案）。
 */
type Lang = 'zh' | 'en';
/** 初始化语言跟随宿主 locale 服务（返回反订阅清理函数）。 */
export declare function initI18n(ctx: {
    get(name: string): unknown;
    on?(event: string, listener: (...args: unknown[]) => void): unknown;
}): void;
export declare function setLang(next: Lang): void;
export declare function getLang(): Lang;
export declare function onLangChange(notify: () => void): () => void;
export declare function t(key: string, vars?: Record<string, string | number>): string;
export {};
//# sourceMappingURL=i18n.d.ts.map