# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-Video-Editor is a monorepo containing a full-stack AI-powered video editing application:
- **Backend**: FastAPI-based API server with AI services (transcription, beat detection, chat)
- **Frontend**: Next.js/React app with Chakra UI and Zustand state management
- **Architecture**: Async task processing via Redis/RQ, SQLAlchemy ORM, media file serving

## Development Commands

### Quick Start (All Services)
```bash
# Start Redis, backend API, and frontend dev server together
./scripts/dev_all.sh
```

### Backend Only
```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (required for background jobs)
redis-server

# Run development server
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Run background worker (separate terminal)
rq worker renders --url redis://localhost:6379/0
```

Backend runs at `http://localhost:8000`, API docs at `http://localhost:8000/docs`

### Frontend Only
```bash
cd frontend
npm ci                    # Install dependencies
npm run dev               # Start dev server on :3000
npm run build             # Production build
npm run lint              # ESLint
npm test                  # Run Jest tests
```

Environment: Create `frontend/.env.local` with:
```
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```

### Testing
```bash
# Backend API endpoint tests
python test_api_endpoints.py

# Backend workflow demo
python demo_workflow.py

# Frontend unit tests
cd frontend && npm test
```

## Architecture

### Backend Request Flow
1. **API Routes** (`backend/routes/*.py`) - HTTP endpoints, request validation
2. **Services** (`backend/services/*.py`) - Business logic, AI model inference
3. **Workers** (`backend/workers/*.py`) - Background tasks via RQ (rendering)
4. **Database** (`backend/models.py`) - SQLAlchemy ORM models

**Key models**: `Asset` (uploaded video), `Project` (timeline + metadata), `Render` (background job), `Consent` (creator approval), `ChatSession`/`ChatMessage`

**Queue system**: `queue_manager` (backend/workers/queue.py) wraps Redis Queue. Rendering runs async to avoid request timeouts.

### Frontend State Management
- **Zustand store** (`src/stores/editorStore.ts`) - Global editor state (project, segments, rendering status)
- **API client** (`src/lib/api.ts`) - Axios wrapper with typed methods
- **Component hierarchy**:
  - `pages/editor.tsx` - Main editor page, loads project
  - `components/Editor/VideoPreview.tsx` - Video playback
  - `components/Editor/Timeline.tsx` - Segment editing
  - `components/Editor/Exporter.tsx` - Render triggering
  - `components/ChatDrawer.tsx` - AI chat interface

### Media File Structure
```
media/
├── ingest/       # Uploaded source videos (POST /api/ingest)
├── final/        # Rendered outputs (POST /api/render/{id})
├── thumbnails/   # Auto-generated previews
├── captions/     # Whisper transcription SRT files
├── sfx/          # Sound effects library
└── consent/      # Uploaded consent documents
```

All media served via `/media/*` routes (configured in `backend/app.py`).

### Configuration
Backend uses environment variables prefixed with `AIVE_` (see `backend/config.py`):
- `AIVE_DATABASE_URL` - SQLAlchemy connection string (default: sqlite)
- `AIVE_REDIS_URL` - Redis connection for RQ (default: localhost:6379)
- `AIVE_WHISPER_MODEL` - Whisper model size (default: "small.en")
- `AIVE_CHAT_BACKEND` - Chat backend: "stub", "hf", or "openai"
- `AIVE_WATERMARK_ENABLED` - Apply watermark to renders (default: true)
- `AIVE_CORS_ORIGINS` - CORS allowed origins (default: "*")

### Timeline Data Structure
Projects store timeline as JSON in `timeline_json` field:
```json
{
  "asset": {"path": "/path/to/video.mp4", "url": "/media/ingest/video.mp4"},
  "beats": [0.5, 1.0, 1.5],
  "tempo": 120.0,
  "captions": [{"text": "Hello", "start": 0.5, "end": 1.0}],
  "segments": [{
    "name": "intro",
    "start": 0.0,
    "end": 3.5,
    "effects": ["zoom", "slowmo"],
    "captions": [{"text": "Welcome!", "start": 0.5, "end": 1.5}],
    "sfx": {"name": "whoosh", "path": "/path/to/sfx.mp3", "duration": 0.5}
  }]
}
```

## Common Workflows

### Adding a New API Endpoint
1. Create route function in `backend/routes/*.py`
2. Add Pydantic request/response schemas in `backend/schemas.py`
3. Include router in `backend/app.py` if new file
4. Add corresponding API wrapper method in `frontend/src/lib/api.ts`
5. Update TypeScript types in `frontend/src/types/index.ts`

### Adding a New AI Service
1. Implement service in `backend/services/*.py`
2. Add endpoint to `backend/routes/tools.py` (or new route file)
3. Model loading: Use lazy loading pattern (see `services/model_loaders.py`)
4. For long-running tasks: Create worker task in `backend/workers/tasks_*.py`

### Video Processing Pipeline
1. **Upload**: POST `/api/ingest` → creates `Asset` + `Project`
2. **Analysis**: POST `/api/timeline/{id}/analyze` → runs transcription + beat detection
3. **Editing**: POST `/api/timeline/{id}` → updates `timeline_json`
4. **Consent**: POST `/api/consent/{asset_id}/checkbox` → required before render
5. **Rendering**: POST `/api/render/{id}` → enqueues RQ job, returns `job_id`
6. **Polling**: GET `/api/render/status/{job_id}` → check progress

### Database Migrations
```bash
# After modifying backend/models.py:
# 1. Update the model classes
# 2. Delete ai_video_editor.db (development only)
# 3. Restart server to recreate tables via init_db()

# Production: Use Alembic for proper migrations
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Dependencies

**Backend Python packages** (requirements.txt):
- `fastapi`, `uvicorn` - Web framework
- `sqlalchemy` - ORM
- `redis`, `rq` - Background job queue
- `moviepy`, `ffmpeg-python` - Video processing
- `librosa` - Audio analysis (beat detection)
- `transformers` - Whisper transcription

**Frontend npm packages** (package.json):
- `next`, `react` - Framework
- `@chakra-ui/react` - UI components
- `zustand` - State management
- `axios` - HTTP client
- `jest`, `@testing-library/react` - Testing

## Important Implementation Details

**CORS**: Backend automatically configures CORS based on `AIVE_CORS_ORIGINS`. Frontend must set `NEXT_PUBLIC_API_BASE` to match backend URL.

**File uploads**: Use `FormData` with `multipart/form-data`. See `routes/ingest.py` for example.

**Background jobs**: Always use RQ for operations >10s (rendering, transcription). Store job metadata in `meta` dict for progress tracking.

**Error handling**:
- Backend: Custom exception handlers in `app.py` return consistent `APIMessage` format
- Frontend: Wrap API calls in try/catch, display errors via `editorStore.setError()`

**Static files**: Backend serves media via `StaticFiles` mounts. Never use relative paths - always use `/media/*` URLs returned by API.

**Testing**:
- Backend: Uses pytest (run `pytest` in root)
- Frontend: Uses Jest + Testing Library (run `npm test` in frontend/)
- Integration: See `test_api_endpoints.py` for full workflow example
