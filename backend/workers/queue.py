from __future__ import annotations

import logging
from threading import Event, Thread
from typing import Optional

from redis import Redis
from rq import Queue
from rq.job import Job
from rq.worker import SimpleWorker

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)


class WorkerHandle:
    def __init__(self, worker: SimpleWorker, thread: Thread, stop_event: Event) -> None:
        self.worker = worker
        self.thread = thread
        self.stop_event = stop_event

    def stop(self) -> None:
        self.stop_event.set()
        if self.thread.is_alive():
            self.thread.join(timeout=2)


class QueueManager:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.redis = Redis.from_url(self.settings.redis_url)
        self.queue = Queue("renders", connection=self.redis, default_timeout=60 * 45)
        self._worker_handle: Optional[WorkerHandle] = None

    def enqueue_render(self, project_id: int, watermark: Optional[bool] = None) -> Job:
        from backend.workers.tasks_render import render_project  # Local import to avoid circular dependency

        watermark_enabled = self.settings.watermark_enabled if watermark is None else bool(watermark)
        job = self.queue.enqueue(
            render_project,
            project_id,
            meta={"status": "queued", "progress": 0.0, "logs": [], "watermark": watermark_enabled},
        )
        LOGGER.info("Queued render for project %s as job %s", project_id, job.id)
        return job

    def fetch_job(self, job_id: str) -> Optional[Job]:
        try:
            return Job.fetch(job_id, connection=self.redis)
        except Exception:
            return None

    def ensure_worker(self) -> WorkerHandle:
        if self._worker_handle and self._worker_handle.thread.is_alive():
            return self._worker_handle

        stop_event = Event()
        # Use Worker with a unique name to avoid conflicts
        from rq import Worker
        import uuid
        worker_name = f"render-worker-{uuid.uuid4().hex[:8]}"
        worker = Worker([self.queue], connection=self.redis, name=worker_name)

        def _run_worker() -> None:
            LOGGER.info(f"Starting background RQ worker: {worker_name}")
            # Manually handle the work loop without signal handlers
            while not stop_event.is_set():
                try:
                    # Use burst mode with manual loop instead of signal-based stopping
                    worker.work(burst=True, with_scheduler=False, max_jobs=1)
                except Exception as e:
                    LOGGER.error(f"Worker error: {e}")
                stop_event.wait(0.5)
            LOGGER.info("RQ worker stopped")

        thread = Thread(target=_run_worker, name="rq-render-worker", daemon=True)
        thread.start()
        self._worker_handle = WorkerHandle(worker=worker, thread=thread, stop_event=stop_event)
        return self._worker_handle

    def shutdown_worker(self) -> None:
        if self._worker_handle:
            self._worker_handle.stop()
            self._worker_handle = None

    def ping(self) -> bool:
        try:
            return bool(self.redis.ping())
        except Exception:
            return False


queue_manager = QueueManager()
