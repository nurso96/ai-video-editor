from __future__ import annotations

import json
import logging
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import uuid4

import ffmpeg
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.models import Asset, Project
from backend.schemas import AssetSchema, ConsentSchema, IngestResponse, ProjectSchema, TimelineSchema
from backend.services.beat_detection import BeatDetectionService
from backend.services.captions import CaptionService
from backend.services.timeline_engine import TimelineEngine

LOGGER = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".mkv", ".m4v"}


def _validate_extension(filename: str) -> None:
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {suffix}")


def _probe_video(path: Path) -> tuple[float, str, float]:
    try:
        probe = ffmpeg.probe(str(path))
    except ffmpeg.Error as exc:  # pragma: no cover - ffmpeg handles its own messaging
        raise HTTPException(status_code=500, detail="Failed to inspect uploaded video") from exc

    duration = float(probe["format"].get("duration", 0.0))
    video_stream = next((stream for stream in probe["streams"] if stream.get("codec_type") == "video"), None)
    if not video_stream:
        raise HTTPException(status_code=400, detail="No video stream detected in upload")

    width = int(video_stream.get("width", 0))
    height = int(video_stream.get("height", 0))
    resolution = f"{width}x{height}"

    fps_str = video_stream.get("r_frame_rate", "0/1")
    try:
        num, denom = fps_str.split("/")
        fps = float(num) / float(denom) if float(denom) != 0 else 0.0
    except Exception:
        fps = 0.0

    return duration, resolution, fps


def _generate_thumbnail(video_path: Path) -> Optional[Path]:
    thumbnails_dir = settings.thumbnails_dir
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    thumbnail_path = thumbnails_dir / f"{video_path.stem}_{uuid4().hex[:8]}.jpg"
    try:
        (
            ffmpeg
            .input(str(video_path), ss=1)
            .filter("scale", 480, -1)
            .output(str(thumbnail_path), vframes=1)
            .run(quiet=True, overwrite_output=True)
        )
    except Exception as exc:  # pragma: no cover - thumbnail failure tolerated
        LOGGER.warning("Thumbnail generation failed for %s: %s", video_path, exc)
        return None
    return thumbnail_path


def _project_to_schema(project: Project) -> ProjectSchema:
    asset = project.asset
    timeline_data = json.loads(project.timeline_json or "{}") if project.timeline_json else {}
    if asset:
        ingest_url = f"/media/ingest/{Path(asset.path).name}"
        timeline_data.setdefault("asset", {})
        timeline_data["asset"].setdefault("path", asset.path)
        timeline_data["asset"]["url"] = ingest_url
    timeline = TimelineSchema(**timeline_data) if timeline_data else TimelineSchema()
    consent = project.asset.consent
    consent_schema = None
    if consent:
        consent_schema = ConsentSchema(
            asset_id=consent.asset_id,
            has_checkbox=consent.has_checkbox,
            document_url=f"/media/consent/{Path(consent.document_path).name}" if consent.document_path else None,
            updated_at=consent.updated_at,
        )
    asset_schema = AssetSchema(
        id=asset.id,
        path=asset.path,
        duration=asset.duration,
        resolution=asset.resolution,
        fps=asset.fps,
        thumbnail_url=f"/media/thumbnails/{Path(asset.thumbnail_path).name}" if asset.thumbnail_path else None,
        ingest_url=f"/media/ingest/{Path(asset.path).name}",
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )

    return ProjectSchema(
        id=project.id,
        title=project.title,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        asset=asset_schema,
        timeline=timeline,
        consent=consent_schema,
    )


@router.post("/ingest", response_model=IngestResponse)
async def ingest_video(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    auto_analyze: bool = True,
    session: Session = Depends(get_session),
) -> IngestResponse:
    _validate_extension(file.filename)

    filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid4().hex}{Path(file.filename).suffix.lower()}"
    destination = settings.ingest_dir / filename
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    duration, resolution, fps = _probe_video(destination)
    thumbnail_path = _generate_thumbnail(destination)

    asset = Asset(
        path=str(destination),
        duration=duration,
        resolution=resolution,
        fps=fps,
        thumbnail_path=str(thumbnail_path) if thumbnail_path else None,
    )
    session.add(asset)
    session.flush()

    project_title = title or f"Project {asset.id}"
    project = Project(title=project_title, status="ingested", asset=asset)
    session.add(project)
    session.flush()

    if auto_analyze:
        caption_service = CaptionService(settings.whisper_model)
        beat_service = BeatDetectionService()
        timeline_engine = TimelineEngine()
        try:
            transcription = await run_in_threadpool(caption_service.transcribe, destination)
            beat_analysis = await run_in_threadpool(beat_service.detect_beats, destination)
            timeline = timeline_engine.build_timeline(asset, beat_analysis, transcription)
            project.timeline_json = timeline_engine.to_json(timeline)
            project.status = "analyzed"
        except Exception as exc:  # pragma: no cover - heavy dependency path
            LOGGER.exception("Auto analysis failed for project %s: %s", project.id, exc)
            project.status = "analysis_failed"
            project.timeline_json = json.dumps({})

    session.commit()
    session.refresh(asset)
    session.refresh(project)

    project_schema = _project_to_schema(project)
    return IngestResponse(asset=project_schema.asset, project=project_schema)
