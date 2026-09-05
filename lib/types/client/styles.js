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
export const css = [
    `
/* ── 录音按钮（composer 工具行）──────────────────────────────── */
.dshv-mic {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex: none;
}
.dshv-mic:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-primary, #111827);
}
.dshv-mic:disabled { opacity: 0.4; cursor: default; }
.dshv-mic-active { color: var(--dsw-alias-state-error-primary, #e5484d); animation: dshv-pulse 1.2s ease-in-out infinite; }
@keyframes dshv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* ── 录音气泡（portal 到 body，锚定按钮上方）─────────────────── */
.dshv-bubble {
  position: fixed;
  z-index: 9999;
  width: 300px;
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #111827);
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
  padding: 10px 12px 12px;
  font-size: 12px;
  line-height: 1.5;
  animation: dshv-bubble-in 0.18s ease-out;
}
@keyframes dshv-bubble-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.dshv-bubble-head { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.dshv-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-error-primary, #e5484d); animation: dshv-pulse 1s infinite; flex: none; }
.dshv-dot-idle { background: var(--dsw-alias-state-warn-primary, #f5a623); animation: none; }
.dshv-bubble-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dshv-elapsed { color: var(--dsw-alias-label-tertiary, #8a8f98); font-variant-numeric: tabular-nums; margin-left: auto; flex: none; }
.dshv-wave { display: flex; align-items: center; gap: 3px; height: 22px; margin: 8px 0 4px; }
.dshv-bar {
  width: 3px;
  height: 100%;
  border-radius: 2px;
  background: var(--dsw-alias-brand-primary, linear-gradient(180deg, #4e5bff, #9b6bff));
  transform-origin: center;
  animation: dshv-wave 0.9s ease-in-out infinite;
}
@keyframes dshv-wave { 0%, 100% { transform: scaleY(0.22); } 50% { transform: scaleY(var(--dshv-amp, 0.7)); } }
.dshv-partial {
  max-height: 110px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--dsw-alias-label-secondary, #3f444c);
  min-height: 18px;
}
.dshv-partial-hint { color: var(--dsw-alias-label-tertiary, #8a8f98); font-style: italic; }
.dshv-bubble-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
.dshv-error { color: var(--dsw-alias-state-error-primary, #d93025); display: flex; flex-direction: column; gap: 8px; }
.dshv-error-text { color: var(--dsw-alias-state-error-primary, #d93025); }

/* ── 通用按钮 ─────────────────────────────────────────────────── */
.dshv-btn {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.12));
  background: transparent;
  color: var(--dsw-alias-label-primary, #111827);
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1.6;
}
.dshv-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.dshv-btn:disabled { opacity: 0.45; cursor: default; }
.dshv-btn-primary {
  background: var(--dsw-alias-button-primary-fill, #4e5bff);
  border-color: transparent;
  color: var(--dsw-alias-label-primary-inverted, #ffffff);
}
.dshv-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, #3f4be0); }
/* 主按钮禁用态不用 opacity（白字会被一起压暗看不清），改用宿主 dimmed 令牌保住对比度 */
.dshv-btn-primary:disabled {
  opacity: 1;
  background: var(--dsw-alias-button-primary-dimmed, rgba(78, 91, 255, 0.35));
  color: var(--dsw-alias-label-primary-inverted, #ffffff);
}
.dshv-btn-danger {
  background: transparent;
  border-color: var(--dsw-alias-state-error-secondary, rgba(229, 72, 77, 0.5));
  color: var(--dsw-alias-state-error-primary, #e5484d);
}
.dshv-btn-danger:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-danger, rgba(229, 72, 77, 0.08)); }
.dshv-btn-small { padding: 2px 8px; font-size: 11px; }

/* ── 设置页 ───────────────────────────────────────────────────── */
.dshv-page { display: flex; flex-direction: column; gap: 16px; max-width: 720px; font-size: 13px; }
.dshv-page-desc { color: var(--dsw-alias-label-secondary, #3f444c); line-height: 1.6; margin: 0; }
.dshv-card {
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dshv-card-title { font-size: 13px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--dsw-alias-label-primary, #111827); }
.dshv-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.dshv-label { flex: none; color: var(--dsw-alias-label-secondary, #3f444c); }

/* 参数表单：纵向排列（标签在上，输入框全宽在下） */
.dshv-fields { display: flex; flex-direction: column; gap: 12px; }
.dshv-field { display: flex; flex-direction: column; gap: 5px; }
.dshv-field .dshv-input { flex: none; width: 100%; box-sizing: border-box; }

/* 输入框：对齐宿主 ui-primitives Input 配方（bg-layer-1 + border-l4，聚焦 brand-primary） */
.dshv-input {
  appearance: none;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.14));
  background: var(--dsw-alias-bg-layer-1, rgba(0, 0, 0, 0.03));
  color: var(--dsw-alias-label-primary, #111827);
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  min-width: 0;
  flex: 1 1 200px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.dshv-input::placeholder { color: var(--dsw-alias-label-tertiary, #9aa0a8); }
.dshv-input:hover:not(:focus) { border-color: var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.22)); }
.dshv-input:focus {
  outline: none;
  border-color: var(--dsw-alias-brand-primary, #4e5bff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary, #4e5bff) 25%, transparent);
}

.dshv-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 1px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid transparent;
  flex: none;
}
.dshv-chip-ok { background: var(--dsw-alias-state-success-secondary, rgba(46, 160, 67, 0.14)); color: var(--dsw-alias-state-success-primary, #1a7f37); }
.dshv-chip-bad { background: var(--dsw-alias-state-error-secondary, rgba(229, 72, 77, 0.14)); color: var(--dsw-alias-state-error-primary, #d93025); }
.dshv-chip-warn { background: var(--dsw-alias-state-warn-secondary, rgba(245, 166, 35, 0.16)); color: var(--dsw-alias-state-warn-primary, #9a6700); }
.dshv-chip-idle {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-secondary, #6b7280);
}
.dshv-steps { display: flex; flex-direction: column; gap: 6px; }
.dshv-step { display: flex; align-items: center; gap: 10px; }
.dshv-step-name { flex: 1; color: var(--dsw-alias-label-primary, #111827); }
.dshv-hint { color: var(--dsw-alias-label-tertiary, #8a8f98); font-size: 11px; line-height: 1.6; margin: 0; }
.dshv-path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; color: var(--dsw-alias-label-secondary, #3f444c); word-break: break-all; }
.dshv-tabs { display: flex; gap: 4px; }
.dshv-tab {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b7280);
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.dshv-tab-active {
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.07));
  color: var(--dsw-alias-label-primary, #111827);
  font-weight: 600;
}
.dshv-log {
  margin: 0;
  padding: 10px 12px;
  background: var(--dsw-alias-bg-layer-2, rgba(0, 0, 0, 0.04));
  border: 1px solid var(--dsw-alias-border-l4, transparent);
  border-radius: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--dsw-alias-label-secondary, #3f444c);
}
.dshv-flash { color: var(--dsw-alias-state-success-primary, #1a7f37); font-size: 12px; }

/* ── 确认弹框 ─────────────────────────────────────────────────── */
.dshv-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10001;
  background: var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
}
.dshv-modal {
  width: min(420px, calc(100vw - 48px));
  background: var(--dsw-alias-bg-layer-2, #ffffff);
  color: var(--dsw-alias-label-primary, #111827);
  border: 1px solid var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.1));
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 16px 18px;
  font-size: 13px;
}
.dshv-modal-title { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
.dshv-modal-body { color: var(--dsw-alias-label-secondary, #3f444c); line-height: 1.6; }

/* ── 识别记录 ─────────────────────────────────────────────────── */
.dshv-hist-list { display: flex; flex-direction: column; gap: 8px; max-height: 340px; overflow-y: auto; }
.dshv-hist-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.08));
  border-radius: 10px;
  background: var(--dsw-alias-bg-layer-2, transparent);
}
.dshv-hist-main { flex: 1; min-width: 0; cursor: pointer; }
.dshv-hist-meta { font-size: 11px; color: var(--dsw-alias-label-tertiary, #8a8f98); margin-bottom: 2px; font-variant-numeric: tabular-nums; }
.dshv-hist-text {
  font-size: 12px;
  color: var(--dsw-alias-label-primary, #111827);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dshv-hist-text-expanded { -webkit-line-clamp: unset; display: block; }
.dshv-hist-actions { display: flex; flex-direction: column; gap: 4px; flex: none; }
.dshv-hist-check { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.dshv-checkbox { accent-color: var(--dsw-alias-brand-primary, #4e5bff); cursor: pointer; }
`,
];
let injected = false;
/** 幂等注入样式（插件样式与宿主 DOM 共存于 document.head）。 */
export function injectStyles() {
    if (injected || typeof document === 'undefined')
        return;
    const style = document.createElement('style');
    style.setAttribute('data-plugin-css', 'dsh-voice-input/voice.css');
    style.textContent = css.join('\n');
    document.head.appendChild(style);
    injected = true;
}
