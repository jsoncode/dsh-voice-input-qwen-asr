/**
 * dsh-voice-input —— 麦克风按钮（composer 工具行，发送按钮左侧）。
 *
 * 点击 → 检查/自动启动 ASR 服务 → getUserMedia 采集 → WS 推流；录音期间
 * portal 渲染气泡展示动画与实时部分文本；「完成并输入」收到 final 后把
 * 识别文本追加进宿主输入框草稿（inputActions.setDraft）。
 */
export interface SessionSlotProps {
    /** 宿主注入的输入框状态 hook（snapshot selector）。 */
    useInput?: (selector: (state: {
        draft: string;
    }) => string) => string;
    /** 宿主注入的输入框动作面（setDraft / submit / …）。 */
    inputActions?: {
        setDraft(text: string): void;
    };
}
export declare function VoiceButton(props: SessionSlotProps): React.ReactElement;
//# sourceMappingURL=VoiceButton.d.ts.map