import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * dsh-voice-input —— 识别记录卡片（设置页内嵌）。
 *
 * 每次语音输入完成的「音频 + 文本」对自动保存到 IndexedDB；此处提供：
 * 查看（文本展开/收起）、播放/停止、单条删除、勾选批量删除、全选、清空。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { clearVoiceRecords, deleteVoiceRecords, listVoiceRecords, } from "../history.js";
import { t } from "../i18n.js";
import { ConfirmModal } from "./ConfirmModal.js";
function formatClock(ms) {
    const totalSeconds = Math.round(ms / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
}
function formatTime(createdAt) {
    const date = new Date(createdAt);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
export function HistoryCard() {
    const [records, setRecords] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [expanded, setExpanded] = useState(new Set());
    const [playingId, setPlayingId] = useState(null);
    const [confirmState, setConfirmState] = useState({ kind: 'none' });
    const audioRef = useRef(null);
    const refresh = useCallback(async () => {
        try {
            setRecords(await listVoiceRecords());
        }
        catch {
            setRecords([]);
        }
    }, []);
    useEffect(() => {
        void refresh();
        return () => stopPlayback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh]);
    const stopPlayback = () => {
        const current = audioRef.current;
        audioRef.current = null;
        if (current !== null) {
            current.audio.pause();
            URL.revokeObjectURL(current.url);
        }
        setPlayingId(null);
    };
    const togglePlay = (record) => {
        if (playingId === record.id) {
            stopPlayback();
            return;
        }
        stopPlayback();
        const url = URL.createObjectURL(record.audio);
        const audio = new Audio(url);
        audio.onended = () => stopPlayback();
        audio.onerror = () => stopPlayback();
        audioRef.current = { audio, url };
        setPlayingId(record.id);
        void audio.play().catch(() => stopPlayback());
    };
    const toggleSelected = (id) => {
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const toggleExpanded = (id) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const allSelected = records !== null && records.length > 0 && selected.size === records.length;
    const toggleAll = () => {
        setSelected(allSelected || records === null ? new Set() : new Set(records.map((record) => record.id)));
    };
    const deleteOne = (id) => {
        if (playingId === id)
            stopPlayback();
        void deleteVoiceRecords([id]).then(() => {
            setSelected((previous) => {
                const next = new Set(previous);
                next.delete(id);
                return next;
            });
            void refresh();
        });
    };
    const confirmAction = () => {
        if (confirmState.kind === 'delete-selected') {
            const ids = [...selected];
            if (playingId !== null && ids.includes(playingId))
                stopPlayback();
            setSelected(new Set());
            setConfirmState({ kind: 'none' });
            void deleteVoiceRecords(ids).then(() => refresh());
            return;
        }
        if (confirmState.kind === 'clear') {
            stopPlayback();
            setSelected(new Set());
            setConfirmState({ kind: 'none' });
            void clearVoiceRecords().then(() => refresh());
        }
    };
    return (_jsxs("div", { className: "dshv-card", children: [_jsxs("h3", { className: "dshv-card-title", children: [t('histTitle'), records !== null && records.length > 0 ? (_jsx("span", { className: "dshv-chip dshv-chip-idle", children: t('histCount', { n: records.length }) })) : null] }), records === null ? (_jsx("p", { className: "dshv-hint", children: t('loading') })) : records.length === 0 ? (_jsx("p", { className: "dshv-hint", children: t('histEmpty') })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "dshv-row", children: [_jsxs("label", { className: "dshv-hist-check dshv-hint", children: [_jsx("input", { type: "checkbox", className: "dshv-checkbox", checked: allSelected, onChange: toggleAll }), t('histSelectAll')] }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small dshv-btn-danger", disabled: selected.size === 0, onClick: () => setConfirmState({ kind: 'delete-selected' }), children: `${t('histDeleteSelected')}${selected.size > 0 ? ` (${selected.size})` : ''}` }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small", onClick: () => setConfirmState({ kind: 'clear' }), children: t('histClear') })] }), _jsx("div", { className: "dshv-hist-list", children: records.map((record) => {
                            const isExpanded = expanded.has(record.id);
                            const isSelected = selected.has(record.id);
                            return (_jsxs("div", { className: "dshv-hist-item", children: [_jsx("input", { type: "checkbox", className: "dshv-checkbox", checked: isSelected, onChange: () => toggleSelected(record.id), "aria-label": t('histDeleteSelected') }), _jsxs("div", { className: "dshv-hist-main", onClick: () => toggleExpanded(record.id), children: [_jsx("div", { className: "dshv-hist-meta", children: `${formatTime(record.createdAt)} · ${formatClock(record.durationMs)}` }), _jsx("div", { className: `dshv-hist-text${isExpanded ? ' dshv-hist-text-expanded' : ''}`, children: record.text === '' ? '…' : record.text })] }), _jsxs("div", { className: "dshv-hist-actions", children: [_jsx("button", { type: "button", className: "dshv-btn dshv-btn-small", onClick: () => togglePlay(record), children: playingId === record.id ? t('histStop') : t('histPlay') }), _jsx("button", { type: "button", className: "dshv-btn dshv-btn-small dshv-btn-danger", onClick: () => deleteOne(record.id), children: t('histDelete') })] })] }, record.id));
                        }) })] })), confirmState.kind !== 'none' ? (_jsx(ConfirmModal, { title: t('histConfirmTitle'), body: confirmState.kind === 'clear' ? t('histClearConfirm') : t('histDeleteConfirm'), danger: true, onConfirm: confirmAction, onCancel: () => setConfirmState({ kind: 'none' }) })) : null] }));
}
