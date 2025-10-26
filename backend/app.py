from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import get_settings
from backend.database import init_db
from backend.routes import auto_edit, chat, consent, ingest, multi_chat, render, social, timeline, tools
from backend.schemas import APIMessage, HealthResponse
from backend.workers.queue import queue_manager

settings = get_settings()

app = FastAPI(title=settings.app_name, version="0.2.0")

origins = settings.cors_origin_list() or ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")
app.include_router(multi_chat.router, prefix="/api/multi-chat", tags=["Multi-LLM Chat"])
app.include_router(social.router, prefix="/api/social", tags=["Social Media Upload"])
app.include_router(auto_edit.router, prefix="/api/auto-edit", tags=["Auto-Editing"])
app.include_router(render.router, prefix="/api")
app.include_router(consent.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(tools.router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content=APIMessage(detail=detail).model_dump())


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:  # pragma: no cover - safety net
    return JSONResponse(status_code=500, content=APIMessage(detail=str(exc)).model_dump())


@app.on_event("startup")
async def startup_event() -> None:
    init_db()
    # queue_manager.ensure_worker()  # Disabled - run worker separately with: rq worker renders


@app.on_event("shutdown")
async def shutdown_event() -> None:
    # queue_manager.shutdown_worker()  # Disabled
    pass


for directory, mount in [
    (settings.final_dir, "/media/final"),
    (settings.ingest_dir, "/media/ingest"),
    (settings.consent_dir, "/media/consent"),
    (settings.thumbnails_dir, "/media/thumbnails"),
    (settings.captions_dir, "/media/captions"),
    (settings.sfx_dir, "/media/sfx"),
]:
    directory.mkdir(parents=True, exist_ok=True)
    app.mount(mount, StaticFiles(directory=str(directory), html=False), name=mount.strip("/"))


@app.get("/", response_model=APIMessage)
async def healthcheck_root() -> APIMessage:
    return APIMessage(detail="ok")


@app.get("/api/healthz", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    redis_ok = queue_manager.ping()
    return HealthResponse(status="ok", redis=redis_ok, timestamp=datetime.utcnow())
