#!/usr/bin/env python3
"""dsh-voice-input-qwen-asr · Qwen3-ASR 本地推理服务（WebSocket 实时转写）。

由 dsh-voice-input-qwen-asr 插件的宿主半边以运行库虚拟环境的 Python 启动：

    <runtime>/.venv/bin/python asr_server.py \
        --model <model-dir> --port 18787 [--language Auto] \
        [--partial-interval-ms 1200] [--max-audio-seconds 300]

协议（与宿主中继、浏览器半边约定）：
- 进程生命周期通过 stdout JSON 行上报（宿主逐行解析，flush=True）：
    {"type":"status","state":"loading","device":"cuda:0"}
    {"type":"ready","device":"cuda:0"}
    {"type":"fatal","message":"..."}            # 致命错误，进程退出
- WebSocket /ws（二进制 = PCM16 LE 单声道 16kHz 音频块；文本 = JSON 控制）：
    ← {"type":"stop"}   结束录音：转写全部缓冲，回 {"type":"final","text":...}
    ← {"type":"abort"}  丢弃缓冲
    → {"type":"partial","text":...}              # 周期性部分转写（尾部窗口）
    → {"type":"state","recording":true|false}    # 会话状态同步
    → {"type":"error","message":...}

模型加载使用运行库（QwenLM/Qwen3-ASR，pip install -e .）提供的 transformers 接口：
    Qwen3ASRModel.from_pretrained(...) / model.transcribe(audio=(np.ndarray, sr))
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time

import numpy as np

try:
    import websockets
except ImportError:  # pragma: no cover
    print(json.dumps({"type": "fatal", "message": "缺少依赖 websockets，请在设置页重新执行『安装依赖』"}, ensure_ascii=False), flush=True)
    sys.exit(1)

SAMPLE_RATE = 16_000
PARTIAL_WINDOW_SECONDS = 30.0  # partial 只转写尾部窗口，控制推理耗时


def emit(payload: dict) -> None:
    print(json.dumps(payload, ensure_ascii=False), flush=True)


def load_model(model_path: str, device_pref: str):
    try:
        from qwen_asr import Qwen3ASRModel
    except ImportError as exc:
        emit({"type": "fatal", "message": f"运行库不可用（{exc}），请先在设置页完成『克隆运行库』与『安装依赖』"})
        sys.exit(1)

    import torch

    if device_pref == "auto":
        device = "cuda:0" if torch.cuda.is_available() else "cpu"
    else:
        device = device_pref
    dtype = torch.bfloat16 if str(device).startswith("cuda") else torch.float32

    emit({"type": "status", "state": "loading", "device": device})
    model = Qwen3ASRModel.from_pretrained(
        model_path,
        dtype=dtype,
        device_map=device,
        max_inference_batch_size=1,
    )
    emit({"type": "ready", "device": device})
    return model


class Session:
    """一个 WebSocket 录音会话：PCM 累积缓冲 + 周期性部分转写。"""

    def __init__(self, engine: "Engine"):
        self.engine = engine
        self.pcm = np.zeros(0, dtype=np.float32)
        self.busy = False
        self.last_partial = time.monotonic()

    def reset(self) -> None:
        self.pcm = np.zeros(0, dtype=np.float32)
        self.busy = False
        self.last_partial = time.monotonic()

    def append(self, data: bytes) -> None:
        chunk = np.frombuffer(data, dtype="<i2").astype(np.float32) / 32768.0
        self.pcm = np.concatenate([self.pcm, chunk])
        max_len = self.engine.max_audio_seconds * SAMPLE_RATE
        if len(self.pcm) > max_len:
            self.pcm = self.pcm[-max_len:]

    def should_partial(self) -> bool:
        if self.busy or len(self.pcm) < SAMPLE_RATE // 2:
            return False
        return (time.monotonic() - self.last_partial) * 1000.0 >= self.engine.partial_interval_ms

    def _transcribe(self, audio: np.ndarray) -> str:
        result = self.engine.model.transcribe(audio=(audio, SAMPLE_RATE), language=self.engine.language or None)
        text = getattr(result[0], "text", "") if result else ""
        return (text or "").strip()

    async def partial(self, send) -> None:
        """转写尾部窗口并推送部分文本（不消费缓冲，最终文本由 final 给出）。"""
        self.busy = True
        self.last_partial = time.monotonic()
        try:
            window = self.pcm[-int(PARTIAL_WINDOW_SECONDS * SAMPLE_RATE):]
            text = await asyncio.get_event_loop().run_in_executor(self.engine.pool, self._transcribe, window.copy())
            if text:
                await send(json.dumps({"type": "partial", "text": text}, ensure_ascii=False))
        except Exception as exc:  # noqa: BLE001 —— 单次转写失败不断开录音
            emit({"type": "log", "level": "warn", "message": f"partial 转写失败: {exc}"})
        finally:
            self.busy = False

    async def final(self, send) -> None:
        audio = self.pcm
        if len(audio) == 0:
            await send(json.dumps({"type": "final", "text": ""}, ensure_ascii=False))
            return
        self.busy = True
        try:
            text = await asyncio.get_event_loop().run_in_executor(self.engine.pool, self._transcribe, audio.copy())
            await send(json.dumps({"type": "final", "text": text}, ensure_ascii=False))
        except Exception as exc:  # noqa: BLE001
            emit({"type": "log", "level": "error", "message": f"final 转写失败: {exc}"})
            await send(json.dumps({"type": "error", "message": f"转写失败: {exc}"}, ensure_ascii=False))
        finally:
            self.busy = False
            self.reset()


class Engine:
    def __init__(self, args):
        self.model = load_model(args.model, args.device)
        self.language = "" if args.language.strip().lower() in ("", "auto") else args.language.strip()
        self.partial_interval_ms = max(300, args.partial_interval_ms)
        self.max_audio_seconds = max(5, args.max_audio_seconds)
        self.pool = None  # 惰性创建：模型加载完成后再建（GPU 下避免无谓线程）

    async def handler(self, websocket):
        session = Session(self)
        if self.pool is None:
            self.pool = __import__("concurrent.futures", fromlist=["ThreadPoolExecutor"]).ThreadPoolExecutor(max_workers=1)
        peer = getattr(websocket, "remote_address", None)
        emit({"type": "log", "level": "info", "message": f"client connected: {peer}"})
        try:
            await websocket.send(json.dumps({"type": "state", "recording": True}, ensure_ascii=False))
            async for message in websocket:
                if isinstance(message, (bytes, bytearray)):
                    session.append(bytes(message))
                    if session.should_partial():
                        asyncio.create_task(session.partial(websocket.send))
                    continue
                try:
                    control = json.loads(message)
                except (ValueError, TypeError):
                    continue
                kind = control.get("type")
                if kind == "stop":
                    await session.final(websocket.send)
                elif kind == "abort":
                    session.reset()
                    await websocket.send(json.dumps({"type": "state", "recording": True}, ensure_ascii=False))
        except websockets.ConnectionClosed:
            pass
        finally:
            emit({"type": "log", "level": "info", "message": f"client disconnected: {peer}"})


def parse_args():
    parser = argparse.ArgumentParser(description="Qwen3-ASR streaming server for dsh-voice-input-qwen-asr")
    parser.add_argument("--model", required=True, help="模型权重目录（Qwen3-ASR-0.6B 本地克隆路径）")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18787)
    parser.add_argument("--language", default="", help="强制语言（如 Chinese/English），空或 Auto 为自动检测")
    parser.add_argument("--device", default="auto", help="auto | cuda:0 | cpu")
    parser.add_argument("--partial-interval-ms", type=int, default=1200, dest="partial_interval_ms")
    parser.add_argument("--max-audio-seconds", type=int, default=300, dest="max_audio_seconds")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    try:
        engine = Engine(args)
    except SystemExit:
        raise
    except Exception as exc:  # noqa: BLE001 —— 模型加载失败必须让宿主看到原因
        emit({"type": "fatal", "message": f"模型加载失败: {exc}"})
        sys.exit(1)

    async def serve() -> None:
        server = await websockets.serve(engine.handler, args.host, args.port, max_size=4 * 1024 * 1024)
        emit({"type": "log", "level": "info", "message": f"listening ws://{args.host}:{args.port}/ws"})
        await server.wait_closed()

    try:
        asyncio.run(serve())
    except KeyboardInterrupt:
        pass
    except Exception as exc:  # noqa: BLE001
        emit({"type": "fatal", "message": f"服务异常退出: {exc}"})
        sys.exit(1)


if __name__ == "__main__":
    main()
