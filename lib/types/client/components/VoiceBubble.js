import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * dsh-voice-input —— 录音气泡（portal 到 document.body，锚定麦克风按钮上方）。
 *
 * 录音中的动画：红点脉冲 + 波形条（CSS 关键帧驱动，振幅由实时 RMS 音量
 * --dshv-amp 控制）+ 实时部分转写文本；停止/取消按钮见底部操作区。
 */
import { createPortal } from 'react-dom';
import { t } from "../i18n.js";
const BAR_FACTORS = [0.45, 0.8, 0.55, 1, 0.65, 0.9, 0.5, 0.75, 0.4];
function formatElapsed(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
export function VoiceBubble(props) {
    const { phase, partial, level, elapsed, errorMsg, anchor } = props;
    const rect = anchor.getBoundingClientRect();
    const style = {
        right: Math.max(12, Math.round(window.innerWidth - rect.right)),
        bottom: Math.max(12, Math.round(window.innerHeight - rect.top + 10)),
    };
    // RMS → 气泡波形振幅（0.25 ~ 1），轻量压缩避免爆表
    const amp = Math.min(1, 0.25 + level * 5);
    let headLabel = t('connecting');
    if (phase === 'recording')
        headLabel = t('recording');
    else if (phase === 'finalizing')
        headLabel = t('finalizing');
    else if (phase === 'error')
        headLabel = t('errorTitle');
    return createPortal(_jsxs("div", { className: "dshv-bubble", style: style, role: "status", "aria-live": "polite", children: [_jsxs("div", { className: "dshv-bubble-head", children: [_jsx("span", { className: `dshv-dot${phase === 'error' ? ' dshv-dot-idle' : ''}` }), _jsx("span", { className: "dshv-bubble-label", children: headLabel }), (phase === 'recording' || phase === 'finalizing') && (_jsx("span", { className: "dshv-elapsed", children: formatElapsed(elapsed) }))] }), phase === 'error' ? (_jsxs("div", { className: "dshv-error", children: [_jsx("span", { children: errorMsg || t('errorTitle') }), _jsxs("div", { className: "dshv-bubble-actions", style: { justifyContent: 'flex-start' }, children: [_jsx("button", { type: "button", className: "dshv-btn dshv-btn-primary dshv-btn-small", onClick: props.onOpenSettings, children: t('openSettings') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small", onClick: props.onRetry, children: t('retry') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small", onClick: props.onCancel, children: t('cancel') })] })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "dshv-wave", style: { ['--dshv-amp']: String(amp) }, "aria-hidden": true, children: BAR_FACTORS.map((factor, index) => (_jsx("span", { className: "dshv-bar", style: { animationDelay: `${-index * 0.11}s`, animationDuration: `${0.8 + factor * 0.35}s` } }, index))) }), _jsx("div", { className: `dshv-partial${partial === '' ? ' dshv-partial-hint' : ''}`, children: phase === 'connecting'
                            ? t('startServer')
                            : partial !== ''
                                ? partial
                                : t('partialHint') }), _jsxs("div", { className: "dshv-bubble-actions", children: [_jsx("button", { type: "button", className: "dshv-btn", onClick: props.onCancel, disabled: phase === 'finalizing', children: t('cancel') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-primary", onClick: props.onFinish, disabled: phase !== 'recording', children: t('finish') })] })] }))] }), document.body);
}
