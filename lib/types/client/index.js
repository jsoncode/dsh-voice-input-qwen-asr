/**
 * dsh-voice-input —— 浏览器半边入口（window.__ModuleLoader__ 工厂产物）。
 */
import { createPlugin } from "./plugin.js";
const plugin = createPlugin();
export const name = plugin.name;
export const inject = plugin.inject;
export const apply = plugin.apply;
