import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * dsh-voice-input-qwen-asr —— 麦克风按钮（composer 工具行，发送按钮左侧）。
 *
 * 点击 → 检查/自动启动 ASR 服务 → getUserMedia 采集 → WS 推流；录音期间
 * portal 渲染气泡展示动画与实时部分文本；「完成并输入」收到 final 后把
 * 识别文本追加进宿主输入框草稿（inputActions.setDraft）。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from "../rpc.js";
import { MicDeniedError, startMicCapture } from "../mic.js";
import { openVoiceSocket } from "../voice-socket.js";
import { addVoiceRecord, buildWavBlob, newRecordId } from "../history.js";
import { VoiceBubble } from "./VoiceBubble.js";
import { openVoiceSettings } from "../settings-jump.js";
import { t } from "../i18n.js";
const FINAL_TIMEOUT_MS = 60_000;
const SERVER_START_TIMEOUT_MS = 240_000;
/** 把识别文本追加到草稿（保留草稿尾部空白；英文词间自动补空格）。 */
function joinDraftText(draft, text) {
    if (text === '')
        return draft;
    if (draft === '')
        return text;
    const match = /\s*$/.exec(draft);
    const tail = match !== null ? match[0] : '';
    const body = draft.slice(0, draft.length - tail.length);
    const separator = /\w$/.test(body) && /^\w/.test(text) ? ' ' : '';
    return body + separator + text + tail;
}
export function VoiceButton(props) {
    const { useInput, inputActions } = props;
    const draft = typeof useInput === 'function' ? useInput((state) => state.draft) : '';
    const draftRef = useRef(draft);
    useEffect(() => {
        draftRef.current = draft;
    }, [draft]);
    const btnRef = useRef(null);
    const [phase, setPhase] = useState('idle');
    const [partial, setPartial] = useState('');
    const [level, setLevel] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const wsRef = useRef(null);
    const captureRef = useRef(null);
    const phaseRef = useRef('idle');
    const startedAtRef = useRef(0);
    const gotFinalRef = useRef(false);
    const lastLevelAtRef = useRef(0);
    // 识别记录：录音期间收集的 PCM16 分片与总字节数（final 后封装 WAV 存档）
    const pcmChunksRef = useRef([]);
    const pcmBytesRef = useRef(0);
    const applyPhase = (next) => {
        phaseRef.current = next;
        setPhase(next);
    };
    const cleanup = useCallback(async () => {
        const socket = wsRef.current;
        wsRef.current = null;
        const capture = captureRef.current;
        captureRef.current = null;
        if (socket !== null)
            socket.close();
        if (capture !== null) {
            try {
                await capture.stop();
            }
            catch { /* noop */ }
        }
    }, []);
    useEffect(() => () => {
        void cleanup();
    }, [cleanup]);
    const fail = useCallback((error) => {
        void cleanup();
        setErrorMsg(error.message);
        applyPhase('error');
    }, [cleanup]);
    const resetToIdle = useCallback(() => {
        void cleanup();
        setLevel(0);
        setPartial('');
        setElapsed(0);
        applyPhase('idle');
    }, [cleanup]);
    /** 保存识别记录（音频 + 文本成对；文本为空或无音频时跳过）。 */
    const saveRecord = (text) => {
        const chunks = pcmChunksRef.current;
        if (text === '' || chunks.length === 0)
            return;
        const durationMs = Math.round((pcmBytesRef.current / 2 / 16000) * 1000);
        const audio = buildWavBlob(chunks);
        pcmChunksRef.current = [];
        void addVoiceRecord({
            id: newRecordId(),
            createdAt: Date.now(),
            durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0,
            text,
            audio,
        }).catch(() => { });
    };
    const handleMessage = useCallback((message) => {
        if (message.type === 'partial') {
            setPartial(String(message.text ?? ''));
            return;
        }
        if (message.type === 'final') {
            gotFinalRef.current = true;
            const text = String(message.text ?? '');
            if (text !== '' && props.inputActions !== undefined) {
                props.inputActions.setDraft(joinDraftText(draftRef.current, text));
            }
            saveRecord(text);
            resetToIdle();
            return;
        }
        if (message.type === 'error') {
            fail(new Error(String(message.message ?? 'ASR error')));
        }
    }, [props.inputActions, resetToIdle, fail]);
    /** 确认/自动启动本地 ASR 服务，就绪后返回。 */
    const ensureServer = async () => {
        const status = await api('status');
        if (status.server.state === 'running' && status.server.error === null)
            return;
        const installed = status.installed;
        if (!installed.runtime || !installed.model || !installed.venv || !installed.deps) {
            throw new Error(t('goToSettings'));
        }
        if (status.server.state === 'error' || status.server.state === 'stopped') {
            await api('server.start');
        }
        const deadline = Date.now() + SERVER_START_TIMEOUT_MS;
        while (Date.now() < deadline) {
            await new Promise((resolveP) => setTimeout(resolveP, 1000));
            const next = await api('status');
            if (next.server.state === 'error')
                throw new Error(next.server.error ?? t('serverNotRunning'));
            if (next.server.state === 'running')
                return;
        }
        throw new Error(t('finalTimeout'));
    };
    const start = useCallback(async () => {
        if (phaseRef.current !== 'idle' && phaseRef.current !== 'error')
            return;
        setErrorMsg('');
        setPartial('');
        setElapsed(0);
        setLevel(0);
        gotFinalRef.current = false;
        pcmChunksRef.current = [];
        pcmBytesRef.current = 0;
        applyPhase('connecting');
        try {
            await ensureServer();
        }
        catch (e) {
            fail(e instanceof Error ? e : new Error(String(e)));
            return;
        }
        try {
            const socket = await openVoiceSocket({
                onMessage: handleMessage,
                onClose: () => {
                    const current = phaseRef.current;
                    if ((current === 'recording' || current === 'finalizing') && !gotFinalRef.current) {
                        fail(new Error(t('wsClosed')));
                    }
                },
            });
            wsRef.current = socket;
            const capture = await startMicCapture((pcm, rms) => {
                pcmChunksRef.current.push(pcm);
                pcmBytesRef.current += pcm.byteLength;
                socket.sendBinary(pcm);
                const now = Date.now();
                if (now - lastLevelAtRef.current > 90) {
                    lastLevelAtRef.current = now;
                    setLevel(rms);
                }
            });
            captureRef.current = capture;
            startedAtRef.current = Date.now();
            applyPhase('recording');
        }
        catch (e) {
            if (e instanceof MicDeniedError)
                fail(new Error(t('micDenied')));
            else
                fail(e instanceof Error ? e : new Error(String(e)));
        }
    }, [handleMessage, fail]);
    const finalize = useCallback(() => {
        const socket = wsRef.current;
        if (socket === null || phaseRef.current !== 'recording')
            return;
        applyPhase('finalizing');
        socket.sendJson({ type: 'stop' });
        setTimeout(() => {
            if (!gotFinalRef.current && phaseRef.current === 'finalizing') {
                fail(new Error(t('finalTimeout')));
            }
        }, FINAL_TIMEOUT_MS);
    }, [fail]);
    const cancel = useCallback(() => {
        wsRef.current?.sendJson({ type: 'abort' });
        resetToIdle();
    }, [resetToIdle]);
    // 录音计时器
    useEffect(() => {
        if (phase !== 'recording')
            return;
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 250);
        return () => clearInterval(timer);
    }, [phase]);
    const onClick = () => {
        if (phaseRef.current === 'recording')
            finalize();
        else if (phaseRef.current === 'idle' || phaseRef.current === 'error')
            void start();
    };
    const showBubble = phase !== 'idle' && btnRef.current !== null;
    return (_jsxs(_Fragment, { children: [_jsx("button", { ref: btnRef, type: "button", className: `dshv-mic${phase === 'recording' ? ' dshv-mic-active' : ''}`, "aria-label": t('micLabel'), "aria-pressed": phase === 'recording', title: t('micLabel'), onClick: onClick, children: _jsxs("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": true, children: [_jsx("rect", { x: "6", y: "1.2", width: "4", height: "8.2", rx: "2", fill: "currentColor" }), _jsx("path", { d: "M3.4 7.4a4.6 4.6 0 0 0 9.2 0", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }), _jsx("path", { d: "M8 12v2.6", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })] }) }), showBubble && btnRef.current !== null ? (_jsx(VoiceBubble, { phase: phase, partial: partial, level: level, elapsed: elapsed, errorMsg: errorMsg, anchor: btnRef.current, onCancel: cancel, onFinish: finalize, onRetry: () => void start(), onOpenSettings: openVoiceSettings })) : null] }));
}
