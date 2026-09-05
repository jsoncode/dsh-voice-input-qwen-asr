/**
 * dsh-voice-input —— 浏览器半边插件注册。
 *
 * - `conversation.input.right`（list, session scope）：麦克风按钮 —— 渲染在
 *   composer 工具行 trailing 组的最前，即发送按钮左侧；组件经宿主注入的
 *   useInput / inputActions 在识别完成后写入输入框草稿；
 * - `settings.section`（list, root scope）：独立设置页「语音识别」，承载
 *   ASR 环境安装（克隆运行库/模型库、创建 venv、装依赖）与服务启停；
 * - locale 服务：语言跟随宿主；styles：幂等注入 document.head。
 */
import { initI18n, t } from "./i18n.js";
import { injectStyles } from "./styles.js";
import { VoiceButton } from "./components/VoiceButton.js";
import { SettingsPage } from "./components/SettingsPage.js";
export function createPlugin() {
    return {
        name: 'dsh-voice-input',
        inject: ['slots', 'locale'],
        apply(ctx) {
            const slots = ctx.get('slots');
            if (slots === undefined) {
                console.warn('[dsh-voice-input] slots 服务不可用，浏览器半边未注册任何 UI');
                return;
            }
            initI18n(ctx);
            injectStyles();
            // composer 工具行 trailing 组（发送按钮左侧）
            slots.inject('conversation.input.right', () => slots.register({ name: 'conversation.input.right', id: 'dsh-voice-input-mic', order: 20, label: () => t('micLabel') }, VoiceButton));
            // 设置页「语音识别」
            slots.inject('settings.section', () => slots.register({ name: 'settings.section', id: 'voice-input', order: 60, label: () => t('nav') }, SettingsPage));
        },
    };
}
