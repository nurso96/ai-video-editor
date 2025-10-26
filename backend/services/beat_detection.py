from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import List

import librosa
import numpy as np

LOGGER = logging.getLogger(__name__)


@dataclass
class BeatAnalysis:
    beats: List[float]
    tempo: float
    energy_peaks: List[float]


class BeatDetectionService:
    def __init__(self, sample_rate: int = 22050) -> None:
        self.sample_rate = sample_rate

    def detect_beats(self, audio_path: Path) -> BeatAnalysis:
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {path}")

        try:
            signal, sr = librosa.load(str(path), sr=self.sample_rate, res_type="soxr_hq")
        except Exception:  # pragma: no cover - fallback when soxr not available
            signal, sr = librosa.load(str(path), sr=self.sample_rate)

        trimmed, _ = librosa.effects.trim(signal, top_db=30)
        if trimmed.size == 0:
            trimmed = signal

        onset_env = librosa.onset.onset_strength(y=trimmed, sr=sr)
        tempo, beat_frames = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)

        energy_frames = librosa.util.normalize(onset_env)
        # Identify peaks above percentile threshold for comedic emphasis points
        threshold = np.percentile(energy_frames, 90)
        peaks = np.where(energy_frames >= threshold)[0]
        peak_times = librosa.frames_to_time(peaks, sr=sr)

        LOGGER.debug("Detected %d beats and %d energy peaks", len(beat_times), len(peak_times))
        return BeatAnalysis(beats=beat_times.tolist(), tempo=float(tempo), energy_peaks=peak_times.tolist())
