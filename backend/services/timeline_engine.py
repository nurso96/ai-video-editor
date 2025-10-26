from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from backend.config import get_settings
from backend.models import Asset
from backend.services.beat_detection import BeatAnalysis
from backend.services.captions import CaptionSegment, TranscriptionResult
from backend.services.sfx import SFXItem, SFXLibrary

LOGGER = logging.getLogger(__name__)


@dataclass
class TimelineSegment:
    name: str
    start: float
    end: float
    effects: List[str]
    beats: List[float]
    captions: List[Dict[str, float]]
    energy_peaks: List[float]
    sfx: Optional[SFXItem]

    def as_dict(self) -> Dict[str, object]:
        payload: Dict[str, object] = {
            "name": self.name,
            "start": self.start,
            "end": self.end,
            "effects": self.effects,
            "beats": self.beats,
            "energy_peaks": self.energy_peaks,
            "captions": self.captions,
        }
        if self.sfx:
            payload["sfx"] = {
                "name": self.sfx.name,
                "path": str(self.sfx.path),
                "duration": self.sfx.duration,
            }
        return payload


class TimelineEngine:
    def __init__(self, template_path: Optional[Path] = None, sfx_library: Optional[SFXLibrary] = None) -> None:
        settings = get_settings()
        self.template_path = template_path or settings.template_path
        self.template = self._load_template()
        self.template_name = self.template.get("name", Path(self.template_path).stem)
        self.sfx_library = sfx_library or SFXLibrary()

    def _load_template(self) -> Dict[str, object]:
        with open(self.template_path, "r", encoding="utf-8") as handle:
            return yaml.safe_load(handle)

    def build_timeline(
        self,
        asset: Asset,
        beat_analysis: BeatAnalysis,
        transcription: TranscriptionResult,
    ) -> Dict[str, object]:
        segments = self.template.get("segments", [])
        timeline_segments: List[TimelineSegment] = []

        for row in segments:
            name = str(row.get("name", "segment")).upper()
            start = float(row.get("start", 0.0))
            end = float(row.get("end", start + 1.0))
            if end <= start:
                end = start + 1.0

            effects = self._normalize_effects(row.get("effects", []), name)
            segment_beats = self._filter_range(beat_analysis.beats, start, end)
            segment_energy = self._filter_range(beat_analysis.energy_peaks, start, end)
            segment_captions = self._captions_for_window(transcription.segments, start, end)
            sfx = self._select_sfx(effects, name)

            timeline_segments.append(
                TimelineSegment(
                    name=name,
                    start=start,
                    end=end,
                    effects=effects,
                    beats=segment_beats,
                    captions=segment_captions,
                    energy_peaks=segment_energy,
                    sfx=sfx,
                )
            )

        timeline = {
            "template_name": self.template_name,
            "asset": {
                "id": asset.id,
                "path": asset.path,
                "duration": asset.duration,
                "resolution": asset.resolution,
                "fps": asset.fps,
            },
            "beats": beat_analysis.beats,
            "tempo": beat_analysis.tempo,
            "energy_peaks": beat_analysis.energy_peaks,
            "captions": [segment.__dict__ for segment in transcription.segments],
            "segments": [segment.as_dict() for segment in timeline_segments],
        }
        LOGGER.debug("Timeline generated using template '%s'", self.template_name)
        return timeline

    @staticmethod
    def to_json(timeline: Dict[str, object]) -> str:
        return json.dumps(timeline, indent=2)

    def _normalize_effects(self, effects: List[str], name: str) -> List[str]:
        normalized = [str(effect) for effect in effects]
        if name == "HOOK" and "zoom" not in {e.lower() for e in normalized}:
            normalized.append("zoom")
        if name == "PUNCH" and "sfx:vine_boom" not in {e.lower() for e in normalized}:
            normalized.append("sfx:vine_boom")
        if "caption" not in {e.lower() for e in normalized}:
            normalized.append("caption")
        return normalized

    def _select_sfx(self, effects: List[str], name: str) -> Optional[SFXItem]:
        for effect in effects:
            if effect.startswith("sfx:"):
                item = self.sfx_library.ensure_for_effect(effect)
                if item:
                    return item
        if name == "PUNCH":
            return self.sfx_library.get_random_sfx("punch") or self.sfx_library.get_random_sfx()
        return None

    @staticmethod
    def _filter_range(values: List[float], start: float, end: float) -> List[float]:
        return [value for value in values if start <= value <= end]

    @staticmethod
    def _captions_for_window(captions: List[CaptionSegment], start: float, end: float) -> List[Dict[str, float]]:
        window: List[Dict[str, float]] = []
        for segment in captions:
            if segment.end < start or segment.start > end:
                continue
            window.append({"text": segment.text, "start": segment.start, "end": segment.end})
        return window
