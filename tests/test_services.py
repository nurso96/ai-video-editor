from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from backend.models import Asset
from backend.services.beat_detection import BeatAnalysis, BeatDetectionService
from backend.services.captions import CaptionSegment, CaptionService, TranscriptionResult
from backend.services.timeline_engine import TimelineEngine


def test_caption_service_srt_formatting(tmp_path):
    segments = [
        CaptionSegment(start=0.0, end=1.5, text="Hello"),
        CaptionSegment(start=1.5, end=3.0, text="World"),
    ]
    srt = CaptionService.to_srt(segments)
    assert "00:00:00,000 --> 00:00:01,500" in srt
    assert "Hello" in srt


def test_beat_detection_detects_clicks(tmp_path):
    sr = 22050
    duration = 2.0
    clicks = librosa.clicks(times=[0.5, 1.0, 1.5], sr=sr, length=int(sr * duration))
    audio_path = tmp_path / "clicks.wav"
    sf.write(audio_path, clicks, sr)

    service = BeatDetectionService(sample_rate=sr)
    analysis = service.detect_beats(Path(audio_path))
    assert isinstance(analysis.beats, list)
    assert len(analysis.beats) >= 2
    assert analysis.tempo > 0


def test_timeline_engine_merges_segments(tmp_path):
    asset = Asset(id=1, path="/tmp/video.mp4", duration=15.0, resolution="1920x1080")
    beat_analysis = BeatAnalysis(beats=[0.5, 1.0, 2.0, 3.0], tempo=120.0, energy_peaks=[1.0, 2.5])
    transcription = TranscriptionResult(
        segments=[
            CaptionSegment(start=0.2, end=1.4, text="Hook"),
            CaptionSegment(start=1.6, end=2.8, text="Build"),
            CaptionSegment(start=3.0, end=4.0, text="Punch"),
        ],
        language="en",
        text="",
        json_path=None,
        srt_path=None,
    )
    engine = TimelineEngine()
    timeline = engine.build_timeline(asset, beat_analysis, transcription)
    assert "segments" in timeline
    assert len(timeline["segments"]) >= 1
    first_segment = timeline["segments"][0]
    assert "effects" in first_segment
    assert "captions" in first_segment
