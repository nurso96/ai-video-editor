from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from threading import Lock
from typing import Dict, Iterable, List, Optional

import whisper

try:
    import torch
except ImportError:  # pragma: no cover - torch provided via conda env normally
    torch = None

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)
_SETTINGS = get_settings()
_MODEL_LOCK = Lock()


@dataclass
class CaptionSegment:
    start: float
    end: float
    text: str


@dataclass
class TranscriptionResult:
    segments: List[CaptionSegment]
    language: str
    text: str
    json_path: Optional[Path]
    srt_path: Optional[Path]

    def to_dict(self) -> Dict[str, object]:
        return {
            "language": self.language,
            "text": self.text,
            "segments": [segment.__dict__ for segment in self.segments],
            "json_path": str(self.json_path) if self.json_path else None,
            "srt_path": str(self.srt_path) if self.srt_path else None,
        }


class CaptionService:
    def __init__(self, model_name: Optional[str] = None) -> None:
        self.model_name = model_name or _SETTINGS.whisper_model
        self.captions_dir = _SETTINGS.captions_dir
        self.captions_dir.mkdir(parents=True, exist_ok=True)
        self._model: Optional[whisper.Whisper] = None
        self._device = self._detect_device()

    def _detect_device(self) -> str:
        if torch is None:
            return "cpu"
        if torch.cuda.is_available():
            return "cuda"
        return "cpu"

    def _load_model(self) -> whisper.Whisper:
        if self._model is not None:
            return self._model
        with _MODEL_LOCK:
            if self._model is not None:
                return self._model
            LOGGER.info("Loading Whisper model '%s' on %s", self.model_name, self._device)
            try:
                self._model = whisper.load_model(self.model_name, device=self._device)
            except Exception as exc:  # pragma: no cover - fallback path
                LOGGER.warning("Failed loading Whisper model '%s': %s", self.model_name, exc)
                LOGGER.info("Falling back to tiny Whisper model on CPU")
                self._model = whisper.load_model("tiny", device="cpu")
        return self._model

    def transcribe(self, media_path: Path, save_files: bool = True) -> TranscriptionResult:
        model = self._load_model()
        result = model.transcribe(
            str(media_path),
            task="transcribe",
            fp16=self._device == "cuda",
            temperature=0,
        )
        segments = [
            CaptionSegment(start=float(segment["start"]), end=float(segment["end"]), text=str(segment["text"]).strip())
            for segment in result.get("segments", [])
        ]
        language = result.get("language", "en")
        text = result.get("text", "").strip()

        json_path: Optional[Path] = None
        srt_path: Optional[Path] = None
        if save_files:
            stem = Path(media_path).stem
            json_path = self.captions_dir / f"{stem}.json"
            srt_path = self.captions_dir / f"{stem}.srt"
            payload = {
                "language": language,
                "text": text,
                "segments": [segment.__dict__ for segment in segments],
            }
            json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
            srt_path.write_text(self.to_srt(segments), encoding="utf-8")

        return TranscriptionResult(
            segments=segments,
            language=language,
            text=text,
            json_path=json_path,
            srt_path=srt_path,
        )

    @staticmethod
    def to_srt(segments: Iterable[CaptionSegment]) -> str:
        lines: List[str] = []
        for index, segment in enumerate(segments, start=1):
            start = CaptionService._format_timestamp(segment.start)
            end = CaptionService._format_timestamp(segment.end)
            lines.extend([str(index), f"{start} --> {end}", segment.text, ""])
        return "\n".join(lines).strip()

    @staticmethod
    def _format_timestamp(seconds: float) -> str:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds % 1) * 1000))
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
