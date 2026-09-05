/**
 * dsh-voice-input-qwen-asr —— 从插件 UI 跳转到设置页「语音识别」。
 *
 * 宿主设置面板的打开状态与激活 section 是 shell 组件私有状态，未提供公开
 * API；这里以 DOM 定位驱动（触发按钮 aria-haspopup="dialog" + 文案
 * 设置/Settings；面板 = 含 <nav> 的 dialog；导航行 = 文案匹配的本节 label），
 * 全部按可观测行为定位，不依赖宿主 CSS 类名。
 */
/**
 * 打开设置面板并定位到「语音识别」节。
 * @returns 是否成功找到入口（触发按钮或已打开的面板）。
 */
export declare function openVoiceSettings(): boolean;
/** 打开设置；找不到入口时落到错误提示（气泡保持原样）。 */
export declare function openVoiceSettingsOrThrow(): void;
//# sourceMappingURL=settings-jump.d.ts.map