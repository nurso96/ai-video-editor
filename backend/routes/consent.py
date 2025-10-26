from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.models import Asset, Consent
from backend.schemas import ConsentSchema, ConsentUpdateRequest

router = APIRouter()
settings = get_settings()


def _require_asset(session: Session, asset_id: int) -> Asset:
    asset = session.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


def _to_schema(consent: Consent) -> ConsentSchema:
    document_url = None
    if consent.document_path:
        document_url = f"/media/consent/{Path(consent.document_path).name}"
    return ConsentSchema(
        asset_id=consent.asset_id,
        has_checkbox=consent.has_checkbox,
        document_url=document_url,
        updated_at=consent.updated_at,
    )


@router.get("/consent/{asset_id}", response_model=ConsentSchema)
async def get_consent(asset_id: int, session: Session = Depends(get_session)) -> ConsentSchema:
    asset = _require_asset(session, asset_id)
    consent = asset.consent
    if not consent:
        dummy = Consent(asset_id=asset.id, has_checkbox=False, document_path=None)
        dummy.updated_at = datetime.utcnow()
        return _to_schema(dummy)
    return _to_schema(consent)


@router.post("/consent/{asset_id}/checkbox", response_model=ConsentSchema)
async def update_checkbox(asset_id: int, payload: ConsentUpdateRequest, session: Session = Depends(get_session)) -> ConsentSchema:
    asset = _require_asset(session, asset_id)
    consent = asset.consent or Consent(asset=asset, has_checkbox=False)
    consent.has_checkbox = payload.accepted
    consent.updated_at = datetime.utcnow()
    session.add(consent)
    session.commit()
    session.refresh(consent)
    return _to_schema(consent)


@router.post("/consent/{asset_id}/upload", response_model=ConsentSchema)
async def upload_consent(asset_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)) -> ConsentSchema:
    asset = _require_asset(session, asset_id)
    consent = asset.consent or Consent(asset=asset, has_checkbox=False)
    settings.consent_dir.mkdir(parents=True, exist_ok=True)
    filename = f"consent_{asset_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{Path(file.filename).suffix.lower()}"
    destination = settings.consent_dir / filename
    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    consent.document_path = str(destination)
    consent.updated_at = datetime.utcnow()
    session.add(consent)
    session.commit()
    session.refresh(consent)
    return _to_schema(consent)
