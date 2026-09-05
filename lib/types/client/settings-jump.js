/**
 * dsh-voice-input —— 从插件 UI 跳转到设置页「语音识别」。
 *
 * 宿主设置面板的打开状态与激活 section 是 shell 组件私有状态，未提供公开
 * API；这里以 DOM 定位驱动（触发按钮 aria-haspopup="dialog" + 文案
 * 设置/Settings；面板 = 含 <nav> 的 dialog；导航行 = 文案匹配的本节 label），
 * 全部按可观测行为定位，不依赖宿主 CSS 类名。
 */
import { t } from "./i18n.js";
/** 本节 nav 行文案（zh/en 两种语言都要能匹配）。 */
const SECTION_LABELS = new Set(['语音识别', 'Voice']);
/** 设置触发按钮文案（ui-settings-general locales: trigger）。 */
const TRIGGER_LABELS = new Set(['设置', 'Settings']);
const POLL_INTERVAL_MS = 60;
const POLL_LIMIT = 25;
function buttonText(el) {
    return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}
/** 设置面板：aria-modal dialog 且包含 nav（排除业务弹窗）。 */
function findSettingsDialog() {
    const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    for (const dialog of dialogs) {
        if (dialog.querySelector('nav') !== null)
            return dialog;
    }
    return null;
}
/** 面板导航里的本节行。 */
function findSectionRow() {
    const dialog = findSettingsDialog();
    if (dialog === null)
        return null;
    const rows = dialog.querySelectorAll('nav button');
    for (const row of rows) {
        if (SECTION_LABELS.has(buttonText(row)))
            return row;
    }
    return null;
}
/** 侧栏底部的设置触发按钮（图标态无文案时退化为 aria-haspopup 唯一命中）。 */
function findTrigger() {
    const triggers = document.querySelectorAll('button[aria-haspopup="dialog"]');
    let fallback = null;
    for (const button of triggers) {
        const label = buttonText(button);
        if (TRIGGER_LABELS.has(label))
            return button;
        if (label === '' && fallback === null)
            fallback = button;
    }
    return fallback;
}
/**
 * 打开设置面板并定位到「语音识别」节。
 * @returns 是否成功找到入口（触发按钮或已打开的面板）。
 */
export function openVoiceSettings() {
    // 面板已打开：直接切换到本节
    const row = findSectionRow();
    if (row !== null) {
        row.click();
        return true;
    }
    const trigger = findTrigger();
    if (trigger === null)
        return false;
    trigger.click();
    // 等面板渲染完成（React 提交后），轮询点击本节 nav 行
    let attempts = 0;
    const tryClickRow = () => {
        const sectionRow = findSectionRow();
        if (sectionRow !== null) {
            sectionRow.click();
            return;
        }
        if (++attempts < POLL_LIMIT)
            setTimeout(tryClickRow, POLL_INTERVAL_MS);
    };
    setTimeout(tryClickRow, POLL_INTERVAL_MS);
    return true;
}
/** 打开设置；找不到入口时落到错误提示（气泡保持原样）。 */
export function openVoiceSettingsOrThrow() {
    if (!openVoiceSettings()) {
        throw new Error(t('goToSettings'));
    }
}
