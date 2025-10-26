from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.models import Consent, Project, Render
from backend.schemas import RenderRequest, RenderResponse, RenderStatus
from backend.workers.queue import queue_manager

router = APIRouter()
settings = get_settings()


@router.post("/render/{project_id}", response_model=RenderResponse)
async def enqueue_render(project_id: int, payload: RenderRequest | None = None, session: Session = Depends(get_session)) -> RenderResponse:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.asset:
        raise HTTPException(status_code=400, detail="Project is missing an asset")

    consent: Consent | None = project.asset.consent
    if not consent or not consent.has_checkbox or not consent.document_path:
        raise HTTPException(status_code=400, detail="Creator consent required before rendering")

    watermark = payload.watermark if payload else None
    job = queue_manager.enqueue_render(project_id, watermark=watermark)

    effective_watermark = settings.watermark_enabled if watermark is None else bool(watermark)
    log_line = f"Queued render job (watermark={'on' if effective_watermark else 'off'})"
    render_record = Render(project=project, job_id=job.id, status="queued", progress=0.0, logs=log_line)
    session.add(render_record)
    project.status = "queued"
    session.commit()

    status_url = f"/api/render/status/{job.id}"
    return RenderResponse(job_id=job.id, status_url=status_url)


@router.get("/render/status/{job_id}", response_model=RenderStatus)
async def render_status(job_id: str, session: Session = Depends(get_session)) -> RenderStatus:
    job = queue_manager.fetch_job(job_id)
    render_record = session.query(Render).filter_by(job_id=job_id).one_or_none()

    if not job and not render_record:
        raise HTTPException(status_code=404, detail="Job not found")

    meta = job.meta if job else {}
    status = meta.get("status", job.get_status(refresh=True) if job else (render_record.status if render_record else "unknown"))
    progress = meta.get("progress", 0.0) if job else (render_record.progress if render_record else 0.0)
    logs = meta.get("logs", []) if job else (render_record.logs.splitlines() if render_record and render_record.logs else [])
    result = meta.get("result") if job else (render_record.output_url if render_record else None)
    error = meta.get("error") if job else None
    output_url = None

    if render_record and render_record.output_url:
        output_url = render_record.output_url
        result = result or render_record.output_url

    return RenderStatus(
        id=job_id,
        status=status,
        progress=float(progress),
        logs=logs,
        result=result,
        output_url=output_url,
        error=error,
    )
