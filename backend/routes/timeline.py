from __future__ import annotations

import json
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.models import Asset, Consent, Project, Render
from backend.schemas import (
    APIMessage,
    AssetSchema,
    ConsentSchema,
    ProjectListItem,
    ProjectSchema,
    TimelineSchema,
    TimelineUpdateRequest,
)
from backend.services.beat_detection import BeatDetectionService
from backend.services.captions import CaptionService
from backend.services.timeline_engine import TimelineEngine

router = APIRouter()
settings = get_settings()


def _public_ingest_url(asset: Asset) -> str:
    return f"/media/ingest/{Path(asset.path).name}"


def _public_thumbnail_url(asset: Asset) -> str | None:
    if not asset.thumbnail_path:
        return None
    return f"/media/ingest/{Path(asset.thumbnail_path).name}"


def _asset_to_schema(asset: Asset) -> AssetSchema:
    return AssetSchema(
        id=asset.id,
        path=asset.path,
        duration=asset.duration,
        resolution=asset.resolution,
        fps=asset.fps,
        thumbnail_url=_public_thumbnail_url(asset),
        ingest_url=_public_ingest_url(asset),
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )


def _consent_to_schema(consent: Consent | None) -> ConsentSchema | None:
    if not consent:
        return None
    document_url = f"/media/consent/{Path(consent.document_path).name}" if consent.document_path else None
    return ConsentSchema(asset_id=consent.asset_id, has_checkbox=consent.has_checkbox, document_url=document_url, updated_at=consent.updated_at)


def _project_to_schema(project: Project) -> ProjectSchema:
    timeline_data = json.loads(project.timeline_json or "{}") if project.timeline_json else {}

    if project.asset:
        timeline_data.setdefault("asset", {})
        timeline_data["asset"].setdefault("path", project.asset.path)
        timeline_data["asset"]["url"] = _public_ingest_url(project.asset)

    timeline = TimelineSchema(**timeline_data) if timeline_data else TimelineSchema()
    asset_schema = _asset_to_schema(project.asset)
    consent_schema = _consent_to_schema(project.asset.consent)

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


@router.get("/projects", response_model=List[ProjectListItem])
async def list_projects(session: Session = Depends(get_session)) -> List[ProjectListItem]:
    projects = session.query(Project).order_by(Project.created_at.desc()).all()
    items: List[ProjectListItem] = []
    for project in projects:
        last_render = session.query(Render).filter(Render.project_id == project.id, Render.status == "finished").order_by(Render.created_at.desc()).first()
        items.append(
            ProjectListItem(
                id=project.id,
                title=project.title,
                status=project.status,
                created_at=project.created_at,
                updated_at=project.updated_at,
                asset_id=project.asset.id,
                ingest_url=_public_ingest_url(project.asset),
                last_render_url=last_render.output_url if last_render else None,
            )
        )
    return items


@router.get("/timeline/{project_id}", response_model=ProjectSchema)
async def get_timeline(project_id: int, session: Session = Depends(get_session)) -> ProjectSchema:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_schema(project)


@router.post("/timeline/{project_id}", response_model=ProjectSchema)
async def update_timeline(project_id: int, payload: TimelineUpdateRequest, session: Session = Depends(get_session)) -> ProjectSchema:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.timeline_json = json.dumps(payload.timeline.model_dump(), indent=2)
    project.status = "timeline_updated"
    session.add(project)
    session.commit()
    session.refresh(project)
    return _project_to_schema(project)


@router.post("/timeline/{project_id}/analyze", response_model=ProjectSchema)
async def rebuild_timeline(project_id: int, session: Session = Depends(get_session)) -> ProjectSchema:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.asset:
        raise HTTPException(status_code=400, detail="Project missing asset")

    asset_path = Path(project.asset.path)
    if not asset_path.exists():
        raise HTTPException(status_code=404, detail="Asset file missing on disk")

    caption_service = CaptionService()
    beat_service = BeatDetectionService()
    timeline_engine = TimelineEngine()

    transcription = await run_in_threadpool(caption_service.transcribe, asset_path)
    beat_analysis = await run_in_threadpool(beat_service.detect_beats, asset_path)
    timeline = timeline_engine.build_timeline(project.asset, beat_analysis, transcription)
    project.timeline_json = timeline_engine.to_json(timeline)
    project.status = "analyzed"
    session.add(project)
    session.commit()
    session.refresh(project)
    return _project_to_schema(project)
