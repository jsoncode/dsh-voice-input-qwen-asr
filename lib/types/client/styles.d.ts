/**
 * dsh-voice-input —— 浏览器半边样式（class 前缀 dshv-，幂等注入 document.head）。
 *
 * 颜色全部走宿主设计令牌（ui-theme design-platform.css 的 --dsw-alias-* 别名层，
 * 与 ui-primitives Input.module.css 的输入框配方一致），随浅色/深色主题切换；
 * var() 兜底值仅在令牌缺失（旧宿主）时使用。
 *
 * 令牌对照（宿主实际语义）：
 * - 文字：label-primary / label-secondary / label-tertiary（弱化）
 * - 表面：bg-layer-1（卡片/输入框）、bg-layer-2（浮层/日志底）、bg-base
 * - 边框：border-l2（分隔）、border-l3（卡片）、border-l4（输入框）
 * - 交互：interactive-bg-hover（悬停）、button-primary-fill/hover（主按钮）
 * - 状态：state-error-*、state-success-*、state-warn-*、brand-primary（焦点）
 */
export declare const css: string[];
/** 幂等注入样式（插件样式与宿主 DOM 共存于 document.head）。 */
export declare function injectStyles(): void;
//# sourceMappingURL=styles.d.ts.map