from __future__ import annotations

import os
from pathlib import Path

from fastapi.testclient import TestClient


def test_loader_generate_video_tmp(tmp_path: Path, monkeypatch) -> None:
    # Force dummy mode for fast test
    monkeypatch.setenv("AIVE_MODEL_DUMMY", "1")

    from backend.services.model_loaders import LTXVideoLoader
    from backend.config import get_settings

    settings = get_settings()
    # Redirect output dir to tmp_path for isolation
    settings.final_dir = tmp_path

    loader = LTXVideoLoader(use_dummy=True)
    out = loader.generate("a quick test prompt", width=160, height=160, length_seconds=0.5, fps=4, seed=42)

    assert out.exists(), f"Expected generated file at {out}"
    assert out.suffix.lower() == ".mp4"


def test_generate_video_endpoint(tmp_path: Path, monkeypatch) -> None:
    # Force dummy and neutralize background worker interactions
    monkeypatch.setenv("AIVE_MODEL_DUMMY", "1")

    from backend.app import app
    from backend.config import get_settings
    from backend.routes import tools as tools_mod
    from backend.workers import queue as qmod

    # Avoid spinning RQ worker threads in tests
    monkeypatch.setattr(qmod.queue_manager, "ensure_worker", lambda: None)
    monkeypatch.setattr(qmod.queue_manager, "shutdown_worker", lambda: None)

    # Send generated files to tmp_path
    settings = get_settings()
    settings.final_dir = tmp_path
    tools_mod.settings.final_dir = tmp_path  # module-level reference used in routes

    with TestClient(app) as client:
        resp = client.post(
            "/api/tools/generate_video",
            json={
                "model": "ltx-video",
                "prompt": "a playful kitten",
                "width": 160,
                "height": 160,
                "length_seconds": 0.5,
                "fps": 4,
            },
        )
        assert resp.status_code == 200, resp.text
        payload = resp.json()
        path = Path(payload["path"]) if payload.get("path") else None
        assert path and path.exists(), f"Output file missing: {path}"
        assert payload["url"].startswith("/media/final/")

