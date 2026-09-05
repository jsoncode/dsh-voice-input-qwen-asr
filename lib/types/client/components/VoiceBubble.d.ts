/**
 * dsh-voice-input —— 录音气泡（portal 到 document.body，锚定麦克风按钮上方）。
 *
 * 录音中的动画：红点脉冲 + 波形条（CSS 关键帧驱动，振幅由实时 RMS 音量
 * --dshv-amp 控制）+ 实时部分转写文本；停止/取消按钮见底部操作区。
 */
export type BubblePhase = 'connecting' | 'recording' | 'finalizing' | 'error';
export interface VoiceBubbleProps {
    phase: BubblePhase;
    partial: string;
    level: number;
    elapsed: number;
    errorMsg: string;
    anchor: HTMLElement;
    onCancel: () => void;
    onFinish: () => void;
    onRetry: () => void;
    /** 打开设置页「语音识别」（错误态展示）。 */
    onOpenSettings: () => void;
}
export declare function VoiceBubble(props: VoiceBubbleProps): React.ReactElement;
//# sourceMappingURL=VoiceBubble.d.ts.map