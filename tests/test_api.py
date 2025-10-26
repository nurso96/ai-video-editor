from fastapi.testclient import TestClient

from backend.app import app
from backend.workers.queue import queue_manager


def test_healthz_smoke(monkeypatch):
    monkeypatch.setattr(queue_manager, "ensure_worker", lambda: None)
    monkeypatch.setattr(queue_manager, "shutdown_worker", lambda: None)
    monkeypatch.setattr(queue_manager, "ping", lambda: True)

    with TestClient(app) as client:
        response = client.get("/api/healthz")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["redis"] is True
