/**
 * dsh-voice-input-qwen-asr —— 确认弹框（portal 到 document.body，遮罩点击 = 取消）。
 */
import type { ReactNode } from 'react';
export interface ConfirmModalProps {
    title: string;
    body: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare function ConfirmModal(props: ConfirmModalProps): React.ReactElement;
//# sourceMappingURL=ConfirmModal.d.ts.map