import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * dsh-voice-input —— 确认弹框（portal 到 document.body，遮罩点击 = 取消）。
 */
import { createPortal } from 'react-dom';
import { t } from "../i18n.js";
export function ConfirmModal(props) {
    return createPortal(_jsx("div", { className: "dshv-modal-backdrop", onClick: props.onCancel, children: _jsxs("div", { className: "dshv-modal", role: "dialog", "aria-modal": "true", "aria-label": props.title, onClick: (event) => event.stopPropagation(), children: [_jsx("h3", { className: "dshv-modal-title", children: props.title }), _jsx("div", { className: "dshv-modal-body", children: props.body }), _jsxs("div", { className: "dshv-bubble-actions", style: { justifyContent: 'flex-end' }, children: [_jsx("button", { type: "button", className: "dshv-btn", onClick: props.onCancel, children: props.cancelLabel ?? t('histCancel') }), _jsx("button", { type: "button", className: `dshv-btn ${props.danger === true ? 'dshv-btn-danger' : 'dshv-btn-primary'}`, onClick: props.onConfirm, children: props.confirmLabel ?? t('histConfirm') })] })] }) }), document.body);
}
