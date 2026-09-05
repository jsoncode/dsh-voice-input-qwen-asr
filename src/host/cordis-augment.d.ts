/**
 * 宿主 Context 的服务类型增强（声明合并）。
 *
 * 对齐 dsh-jenkins 的做法：cordis 的反射层服务读取在插件侧显式声明，
 * 保持类型安全且不依赖宿主内部类型链完整解析。
 */
declare module '@deepseek-ai/cordis' {
  interface Context {
    /** 反射层提供的服务读取（context proxy 运行时委托给 reflect）。 */
    get<T = unknown>(name: string): T | undefined
    /** 注册卸载清理函数（插件卸载/重载时执行）。 */
    effect(dispose: () => void): unknown
  }
}

export {}
