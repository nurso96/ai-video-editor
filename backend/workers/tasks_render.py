from __future__ import annotations

import json
import logging
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

from moviepy.editor import (
    AudioFileClip,
    CompositeAudioClip,
    CompositeVideoClip,
    TextClip,
    VideoFileClip,
    concatenate_videoclips,
    vfx,
)
from rq import get_current_job

from backend.config import get_settings
from backend.database import session_scope
from backend.models import Consent, Project, Render
from backend.services.beat_detection import BeatDetectionService
from backend.services.captions import CaptionService
from backend.services.timeline_engine import TimelineEngine

LOGGER = logging.getLogger(__name__)
SETTINGS = get_settings()


def render_project(project_id: int) -> str:
    job = get_current_job()
    job_id = job.id if job else f"manual-{uuid4().hex}"

    _update_job(job, status="started", progress=5.0, log=f"Starting render for project {project_id}")
    watermark_override = None
    if job and "watermark" in (job.meta or {}):
        watermark_override = bool(job.meta["watermark"])

    caption_service = CaptionService()
    beat_service = BeatDetectionService()
    timeline_engine = TimelineEngine()

    with session_scope() as session:
        project: Optional[Project] = session.get(Project, project_id)
        if not project:
            message = f"Project {project_id} not found"
            _update_job(job, status="failed", progress=100.0, log=message, error=message)
            raise ValueError(message)

        if not project.asset:
            message = f"Project {project_id} has no associated asset"
            _update_job(job, status="failed", progress=100.0, log=message, error=message)
            raise ValueError(message)

        consent: Optional[Consent] = project.asset.consent
        if not consent or not consent.has_checkbox or not consent.document_path:
            message = "Consent must be completed before rendering"
            _update_job(job, status="failed", progress=100.0, log=message, error=message)
            raise PermissionError(message)

        render_record = session.query(Render).filter_by(job_id=job_id).one_or_none()
        if not render_record:
            render_record = Render(project=project, job_id=job_id)
        render_record.status = "started"
        render_record.progress = 5.0
        render_record.logs = _append_log(render_record.logs, "Render job started")
        session.add(render_record)
        session.flush()

        asset_path = Path(project.asset.path)
        if not asset_path.exists():
            message = f"Asset path not found: {asset_path}"
            render_record.status = "failed"
            render_record.progress = 100.0
            render_record.logs = _append_log(render_record.logs, message)
            session.flush()
            _update_job(job, status="failed", progress=100.0, log=message, error=message)
            raise FileNotFoundError(message)

        _update_job(job, status="analyzing", progress=15.0, log="Preparing timeline")

        timeline_data: Dict[str, Any]
        if not project.timeline_json or project.timeline_json.strip() in {"", "{}"}:
            LOGGER.info("Generating timeline on the fly for project %s", project.id)
            transcription = caption_service.transcribe(asset_path)
            beat_analysis = beat_service.detect_beats(asset_path)
            timeline_data = timeline_engine.build_timeline(project.asset, beat_analysis, transcription)
            project.timeline_json = timeline_engine.to_json(timeline_data)
            project.status = "analyzed"
        else:
            timeline_data = json.loads(project.timeline_json)
        session.flush()

        render_record.status = "rendering"
        render_record.progress = 25.0
        render_record.logs = _append_log(render_record.logs, "Timeline ready; beginning composition")
        session.flush()

        watermark_state = SETTINGS.watermark_enabled if watermark_override is None else watermark_override
        _update_job(
            job,
            status="rendering",
            progress=25.0,
            log=f"Composing video segments (watermark={'on' if watermark_state else 'off'})",
        )

        output_path = _compose_video(asset_path, timeline_data, job, render_record, watermark_override)

        public_url = f"/media/final/{output_path.name}"
        render_record.output_path = str(output_path)
        render_record.output_url = public_url
        render_record.status = "finished"
        render_record.progress = 100.0
        render_record.logs = _append_log(render_record.logs, f"Render complete -> {public_url}")
        render_record.updated_at = datetime.utcnow()
        project.status = "rendered"
        session.flush()

        _update_job(job, status="finished", progress=100.0, log="Render completed", result=public_url)
        LOGGER.info("Render finished for project %s with job %s", project_id, job_id)
        return public_url


def _compose_video(asset_path: Path, timeline: Dict[str, Any], job, render_record: Render, watermark_override: Optional[bool]) -> Path:
    asset_clip = VideoFileClip(str(asset_path))
    segment_clips: List[VideoFileClip] = []
    overlay_audio: List[AudioFileClip] = []
    overlay_resources: List[TextClip] = []
    cumulative_time = 0.0
    final_clip = None

    try:
        segments = sorted(timeline.get("segments", []), key=lambda item: item.get("start", 0.0))
        total_segments = max(len(segments), 1)
        for index, segment in enumerate(segments, start=1):
            start = float(segment.get("start", 0.0))
            end = float(segment.get("end", start + 1.0))
            if end <= start:
                end = start + 0.5
            segment_clip = asset_clip.subclip(max(start, 0.0), min(end, asset_clip.duration))

            effects = [str(effect).lower() for effect in segment.get("effects", [])]
            if "zoom" in effects:
                segment_clip = segment_clip.fx(vfx.resize, 1.12)
            if "slowmo" in effects:
                segment_clip = segment_clip.fx(vfx.speedx, 0.85)

            overlays: List[TextClip] = []
            for caption in segment.get("captions", []):
                text = str(caption.get("text", "")).strip()
                if not text:
                    continue
                caption_start = max(0.0, float(caption.get("start", start)) - start)
                caption_end = float(caption.get("end", end))
                duration = max(0.1, caption_end - float(caption.get("start", start)))
                try:
                    text_clip = (
                        TextClip(
                            text,
                            fontsize=64,
                            color="white",
                            font="DejaVu-Sans",
                            method="caption",
                            size=(960, None),
                        )
                        .set_start(caption_start)
                        .set_duration(duration)
                        .set_position(("center", "bottom"))
                    )
                    overlays.append(text_clip)
                    overlay_resources.append(text_clip)
                except Exception as exc:  # pragma: no cover - font/imagemagick issues
                    LOGGER.warning("Caption rendering failed: %s", exc)

            if overlays:
                segment_clip = CompositeVideoClip([segment_clip, *overlays])

            sfx = segment.get("sfx") or {}
            sfx_path = Path(str(sfx.get("path", ""))) if sfx else None
            if sfx_path and sfx_path.exists():
                try:
                    sfx_clip = AudioFileClip(str(sfx_path)).volumex(1.35)
                    overlay_audio.append(sfx_clip.set_start(cumulative_time))
                except Exception as exc:  # pragma: no cover - optional path
                    LOGGER.warning("Failed to load SFX %s: %s", sfx_path, exc)

            segment_clips.append(segment_clip)
            cumulative_time += segment_clip.duration

            progress = 25.0 + (index / total_segments) * 40.0
            render_record.progress = progress
            render_record.logs = _append_log(render_record.logs, f"Processed segment {segment.get('name', index)}")
            _update_job(job, status="rendering", progress=progress, log=f"Segment {index}/{total_segments} composed")

        if not segment_clips:
            segment_clips = [asset_clip]
            cumulative_time = asset_clip.duration

        final_clip = concatenate_videoclips(segment_clips, method="compose")

        if overlay_audio:
            base_audio = final_clip.audio
            tracks = [base_audio] if base_audio else []
            tracks.extend(overlay_audio)
            final_clip = final_clip.set_audio(CompositeAudioClip(tracks))

        final_clip = _ensure_vertical(final_clip)

        output_dir = SETTINGS.final_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        output_name = f"project_{asset_path.stem}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        temp_path = output_dir / f"{output_name}_temp.mp4"
        final_path = output_dir / f"{output_name}.mp4"

        render_record.logs = _append_log(render_record.logs, "Writing video stream")
        _update_job(job, status="rendering", progress=70.0, log="Exporting composed video")
        final_clip.write_videofile(
            str(temp_path),
            codec="libx264",
            audio_codec="aac",
            fps=30,
            preset="medium",
            threads=4,
            verbose=False,
            logger=None,
        )

        _update_job(job, status="post-processing", progress=85.0, log="Applying watermark & metadata")
        render_record.logs = _append_log(render_record.logs, "Applying watermark/metadata")
        _apply_watermark_and_metadata(temp_path, final_path, timeline, watermark_override)

        return final_path
    finally:
        if final_clip is not None:
            final_clip.close()
        asset_clip.close()
        for clip in segment_clips:
            clip.close()
        for clip in overlay_audio:
            clip.close()
        for overlay in overlay_resources:
            overlay.close()


def _ensure_vertical(clip: VideoFileClip) -> VideoFileClip:
    target_height = 1920
    target_width = 1080
    resized = clip.resize(height=target_height)
    if resized.w < target_width:
        scale_factor = target_width / resized.w
        resized = resized.resize(scale_factor)
    return resized.crop(width=target_width, height=target_height, x_center=resized.w / 2, y_center=resized.h / 2)


def _apply_watermark_and_metadata(temp_path: Path, final_path: Path, timeline: Dict[str, Any], watermark_override: Optional[bool]) -> None:
    watermark_filters: List[str] = []
    watermark_enabled = SETTINGS.watermark_enabled if watermark_override is None else watermark_override
    if watermark_enabled:
        text = SETTINGS.watermark_text or SETTINGS.app_name
        safe_text = text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
        watermark_filters.append(
            "drawtext=text='{}':fontcolor=white@0.82:fontsize=48:x=w-text_w-40:y=h-text_h-40:".format(safe_text)
            + "box=1:boxcolor=black@0.35:boxborderw=15"
        )

    vf_arg = []
    if watermark_filters:
        vf_arg = ["-vf", ",".join(watermark_filters)]

    metadata_args = [
        "-metadata",
        f"comment=Generated by {SETTINGS.app_name}",
        "-metadata",
        f"timeline_template={timeline.get('template_name', 'unknown')}",
        "-metadata",
        f"rendered_at={datetime.utcnow().isoformat()}",
    ]

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(temp_path),
        *vf_arg,
        *metadata_args,
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(final_path),
    ]

    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    if watermark_enabled:
        LOGGER.info("Applied watermark to %s", final_path)
    LOGGER.debug("ffmpeg output: %s", result.stderr.strip())
    temp_path.unlink(missing_ok=True)


def _update_job(job, *, status: Optional[str] = None, progress: Optional[float] = None, log: Optional[str] = None, result: Optional[str] = None, error: Optional[str] = None) -> None:
    if job is None:
        return
    meta = job.meta or {}
    if status:
        meta["status"] = status
    if progress is not None:
        meta["progress"] = round(progress, 2)
    logs = meta.setdefault("logs", [])
    if log:
        logs.append(log)
    if result is not None:
        meta["result"] = result
    if error is not None:
        meta["error"] = error
    job.meta = meta
    job.save_meta()


def _append_log(existing: str, message: str) -> str:
    existing = existing or ""
    timestamp = datetime.utcnow().isoformat()
    entry = f"[{timestamp}] {message}"
    if existing:
        return existing + "\n" + entry
    return entry
