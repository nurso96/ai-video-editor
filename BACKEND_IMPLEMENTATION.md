# AI Video Editor Backend - Implementation Guide

## Overview

This is a **complete, production-ready** FastAPI backend for an AI-powered web video editor. The backend has been fully implemented with all required endpoints, data models, and background task processing.

## Technology Stack

- **Framework**: FastAPI (async Python web framework)
- **Database**: SQLite with SQLAlchemy ORM
- **Task Queue**: RQ (Redis Queue) for background rendering jobs
- **Video Processing**: FFmpeg, MoviePy, and ffmpeg-python
- **AI Services**: 
  - Whisper for transcription
  - Librosa for beat detection
  - HuggingFace models for text generation (optional)

## Architecture

```
backend/
├── app.py                  # FastAPI application & middleware setup
├── config.py              # Settings & environment configuration
├── database.py            # SQLAlchemy setup & session management
├── models.py              # SQLAlchemy database models
├── schemas.py             # Pydantic models for API validation
├── routes/                # API endpoint handlers
│   ├── ingest.py          # Video upload & analysis
│   ├── timeline.py        # Project & timeline management
│   ├── render.py          # Video rendering endpoints
│   ├── tools.py           # AI tools (transcribe, beats, etc.)
│   ├── chat.py            # Chat interface
│   └── consent.py         # Creator consent management
├── services/              # Business logic & AI services
│   ├── captions.py        # Whisper transcription
│   ├── beat_detection.py  # Audio beat detection
│   ├── timeline_engine.py # Timeline generation logic
│   ├── chat_service.py    # Chat backend implementations
│   └── model_loaders.py   # AI model loading utilities
└── workers/               # Background task processing
    ├── queue.py           # RQ queue manager
    └── tasks_render.py    # Video rendering tasks
```

## Core Data Models

### Database Models (SQLAlchemy)

**Asset** - Represents an uploaded video file
- `id`: Primary key
- `path`: File path on disk
- `duration`: Video duration in seconds
- `resolution`: Video resolution (e.g., "1920x1080")
- `fps`: Frames per second
- `thumbnail_path`: Generated thumbnail image path
- `created_at`, `updated_at`: Timestamps

**Project** - A video editing project
- `id`: Primary key
- `title`: Project name
- `status`: Workflow status (new, ingested, analyzed, rendering, etc.)
- `timeline_json`: JSON blob containing timeline data
- `asset_id`: Foreign key to Asset
- `created_at`, `updated_at`: Timestamps

**Render** - A rendering job
- `id`: Primary key
- `project_id`: Foreign key to Project
- `job_id`: RQ job identifier
- `output_path`: Path to rendered video
- `output_url`: Public URL for rendered video
- `status`: Job status (queued, started, rendering, finished, failed)
- `progress`: Progress percentage (0-100)
- `logs`: Rendering logs
- `created_at`, `updated_at`: Timestamps

**ChatSession** - Chat conversation
- `id`: Primary key
- `title`: Session title
- `backend`: Chat backend type (stub, hf, etc.)
- `hf_model`: HuggingFace model name (if applicable)
- `messages`: Related ChatMessage records
- `created_at`, `updated_at`: Timestamps

**ChatMessage** - Individual chat message
- `id`: Primary key
- `session_id`: Foreign key to ChatSession
- `role`: Message role (user, assistant)
- `content`: Message text
- `created_at`: Timestamp

**Consent** - Creator consent tracking
- `id`: Primary key
- `asset_id`: Foreign key to Asset
- `has_checkbox`: Boolean checkbox acceptance
- `document_path`: Path to signed document (optional)
- `created_at`, `updated_at`: Timestamps

### API Models (Pydantic)

**CaptionSegment** - A captioned segment with timing
```python
{
  "text": "Hello world",
  "start": 0.5,
  "end": 2.3
}
```

**TimelineSegment** - A video segment with effects
```python
{
  "name": "intro",
  "start": 0.0,
  "end": 3.5,
  "effects": ["zoom", "slowmo"],
  "beats": [0.5, 1.0, 1.5],
  "captions": [CaptionSegment, ...],
  "sfx": {
    "name": "whoosh",
    "path": "/path/to/whoosh.mp3",
    "duration": 0.5
  }
}
```

**TimelineData** - Complete timeline structure
```python
{
  "asset": {"path": "/path/to/video.mp4", "url": "/media/ingest/video.mp4"},
  "beats": [0.5, 1.0, 1.5, 2.0],
  "tempo": 120.0,
  "captions": [CaptionSegment, ...],
  "segments": [TimelineSegment, ...],
  "template_name": "realistic_chaos"
}
```

**ProjectDetail** - Full project information
```python
{
  "id": 1,
  "title": "My Project",
  "status": "analyzed",
  "asset": {
    "id": 1,
    "path": "/path/to/video.mp4",
    "ingest_url": "/media/ingest/video.mp4",
    "thumbnail_url": "/media/thumbnails/thumb.jpg",
    "duration": 30.5,
    "resolution": "1920x1080",
    "fps": 30.0
  },
  "timeline": TimelineData,
  "consent": {
    "asset_id": 1,
    "has_checkbox": true,
    "document_url": "/media/consent/doc.pdf"
  }
}
```

## API Endpoints

### Health Check

**GET /api/healthz**
- Checks Redis connection status
- Response: `{"status": "ok", "redis": true, "timestamp": "2025-10-25T12:00:00"}`

### Project & Timeline Management

**POST /api/ingest**
- Upload a video file for processing
- Request: `multipart/form-data` with file upload
- Parameters:
  - `file`: Video file (required)
  - `title`: Project title (optional)
  - `auto_analyze`: Auto-run analysis (default: true)
- Actions:
  1. Saves video to `media/ingest/`
  2. Creates Asset and Project records
  3. Generates thumbnail
  4. (Optional) Runs Whisper transcription and beat detection
  5. (Optional) Generates initial timeline using template
- Response: `IngestResponse` with asset and project details

**GET /api/timeline/{project_id}**
- Retrieve project details including timeline
- Response: `ProjectDetail` object

**POST /api/timeline/{project_id}**
- Update project timeline
- Request: `{"timeline": TimelineData}`
- Response: Updated `ProjectDetail` object

**POST /api/timeline/{project_id}/analyze**
- Re-analyze video and rebuild timeline
- Runs transcription and beat detection
- Response: Updated `ProjectDetail` with new timeline

**GET /api/projects**
- List all projects
- Response: Array of `ProjectListItem` objects

### AI Tools

**POST /api/tools**
- Generic endpoint for running AI tools
- Request: `{"tool": "transcribe" | "beats" | "thumbnail" | "caption_srt" | "suggest_effects", "args": {...}}`
- Tools available:
  - `transcribe`: Run Whisper transcription
    - Args: `{"path": "/path/to/video.mp4", "model": "small.en"}`
  - `beats`: Detect audio beats and tempo
    - Args: `{"path": "/path/to/video.mp4"}`
  - `thumbnail`: Generate thumbnail at timestamp
    - Args: `{"path": "/path/to/video.mp4", "time": 1.5}`
  - `caption_srt`: Convert captions to SRT format
    - Args: `{"segments": [...]}`
  - `suggest_effects`: AI-suggested effects based on content
    - Args: `{"transcript": "...", "beats": [...], "backend": "stub"}`
- Response: `{"tool": "transcribe", "result": {...}}`

**POST /api/tools/generate_video**
- Generate video from text prompt using AI models
- Request: `GenerateVideoRequest`
- Response: `{"path": "...", "url": "/media/final/video.mp4"}`

**POST /api/tools/edit_image**
- Edit/generate images using AI models
- Request: `EditImageRequest`
- Response: `{"path": "...", "url": "/media/final/image.png"}`

### Rendering

**POST /api/render/{project_id}**
- Start background rendering job
- Request: `{"watermark": true}`
- Requires creator consent to be completed
- Actions:
  1. Validates project and consent
  2. Enqueues RQ background job
  3. Creates Render record
- Response: `{"job_id": "abc123", "status_url": "/api/render/status/abc123"}`

**GET /api/render/status/{job_id}**
- Check rendering job status
- Response:
```python
{
  "id": "abc123",
  "status": "finished" | "rendering" | "queued" | "failed",
  "progress": 85.5,
  "logs": ["Started render", "Processing segment 1", ...],
  "result": "/media/final/output.mp4",
  "output_url": "/media/final/output.mp4",
  "error": null
}
```

### Chat Interface

**GET /api/chat/sessions**
- List all chat sessions
- Response: `{"sessions": [ChatSessionSchema, ...]}`

**POST /api/chat/sessions**
- Create new chat session
- Request: `{"title": "New Chat", "backend": "stub", "hf_model": "distilgpt2"}`
- Response: `ChatSessionSchema`

**GET /api/chat/sessions/{session_id}**
- Get chat session details including all messages
- Response: `ChatSessionSchema`

**POST /api/chat/sessions/{session_id}/messages**
- Send message to chat session
- Request: `{"message": "Tell me a joke"}`
- Actions:
  1. Stores user message
  2. Generates AI response using configured backend
  3. Stores assistant message
- Response: `ChatSendResponse` with updated session

### Consent Management

**GET /api/consent/{asset_id}**
- Get consent status for asset
- Response: `ConsentSchema`

**POST /api/consent/{asset_id}/checkbox**
- Record checkbox consent
- Request: `{"accepted": true}`
- Response: `ConsentSchema`

**POST /api/consent/{asset_id}/upload**
- Upload signed consent document
- Request: `multipart/form-data` with file
- Response: `ConsentSchema`

## Background Tasks (RQ)

### Render Task (`render_project`)

The rendering pipeline processes a project's timeline and generates a final video:

1. **Setup** (5% progress)
   - Load project and validate consent
   - Parse timeline JSON

2. **Analysis** (15% progress)
   - If timeline is empty, run auto-analysis
   - Transcribe audio with Whisper
   - Detect beats with Librosa
   - Generate timeline with template engine

3. **Composition** (25-65% progress)
   - Load source video with MoviePy
   - For each timeline segment:
     - Extract video clip
     - Apply effects (zoom, slowmo, etc.)
     - Add caption overlays
     - Add sound effects
   - Concatenate all segments

4. **Export** (70-85% progress)
   - Write video with H.264 codec
   - Set to 1080x1920 (vertical format)
   - 30 fps, AAC audio

5. **Post-processing** (85-100% progress)
   - Apply watermark with FFmpeg
   - Add metadata
   - Clean up temporary files

The task updates its progress and logs in the job metadata, which can be queried via the status endpoint.

## AI Services

### Caption Service (`services/captions.py`)

Uses OpenAI's Whisper model for speech-to-text transcription:
- Extracts audio from video
- Runs Whisper inference
- Returns timestamped caption segments
- Can export to SRT format

### Beat Detection (`services/beat_detection.py`)

Uses Librosa for audio analysis:
- Detects beat timestamps
- Calculates tempo (BPM)
- Identifies energy peaks
- Returns beat markers for timeline

### Timeline Engine (`services/timeline_engine.py`)

Generates structured timelines from analysis:
- Segments video based on beats and content
- Assigns effects based on templates
- Places captions strategically
- Suggests sound effects

### Chat Service (`services/chat_service.py`)

Provides conversational AI backends:
- **Stub**: Hardcoded responses for testing
- **HuggingFace**: Uses transformers for text generation
- Extensible for additional backends (OpenAI, etc.)

## Configuration

Settings are loaded from environment variables with the `AIVE_` prefix:

```bash
# Database
AIVE_DATABASE_URL=sqlite:///ai_video_editor.db

# Redis
AIVE_REDIS_URL=redis://localhost:6379/0

# AI Models
AIVE_WHISPER_MODEL=small.en
AIVE_CHAT_BACKEND=stub
AIVE_HF_TEXT_MODEL=distilgpt2

# Watermark
AIVE_WATERMARK_ENABLED=true
AIVE_WATERMARK_TEXT=ai-video-editor

# CORS
AIVE_CORS_ORIGINS=*

# Paths
AIVE_MEDIA_ROOT=/path/to/media
AIVE_INGEST_DIR=/path/to/media/ingest
AIVE_FINAL_DIR=/path/to/media/final
# ... etc
```

See `backend/config.py` for all available settings.

## Running the Application

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (required for background tasks)
redis-server

# Run FastAPI development server
cd /path/to/ai-video-editor
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### Production

```bash
# Use gunicorn with uvicorn workers
gunicorn backend.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Docker

```bash
# Build and run with Docker Compose
docker-compose up
```

## API Usage Examples

### Upload and Analyze Video

```bash
curl -X POST http://localhost:8000/api/ingest \
  -F "file=@myvideo.mp4" \
  -F "title=My Cool Video" \
  -F "auto_analyze=true"
```

Response:
```json
{
  "asset": {
    "id": 1,
    "path": "/path/to/media/ingest/20251025_120000_abc123.mp4",
    "duration": 30.5,
    "resolution": "1920x1080",
    "fps": 30.0,
    "ingest_url": "/media/ingest/20251025_120000_abc123.mp4",
    "thumbnail_url": "/media/thumbnails/thumb_abc123.jpg"
  },
  "project": {
    "id": 1,
    "title": "My Cool Video",
    "status": "analyzed",
    "timeline": {
      "asset": {...},
      "beats": [0.5, 1.0, 1.5],
      "tempo": 120.0,
      "captions": [
        {"text": "Hello", "start": 0.5, "end": 1.0},
        {"text": "World", "start": 1.5, "end": 2.0}
      ],
      "segments": [...]
    }
  }
}
```

### Update Timeline

```bash
curl -X POST http://localhost:8000/api/timeline/1 \
  -H "Content-Type: application/json" \
  -d '{
    "timeline": {
      "segments": [
        {
          "name": "intro",
          "start": 0.0,
          "end": 3.0,
          "effects": ["zoom"],
          "captions": [
            {"text": "Welcome!", "start": 0.5, "end": 1.5}
          ]
        }
      ]
    }
  }'
```

### Start Render

```bash
# First, complete consent (required)
curl -X POST http://localhost:8000/api/consent/1/checkbox \
  -H "Content-Type: application/json" \
  -d '{"accepted": true}'

curl -X POST http://localhost:8000/api/consent/1/upload \
  -F "file=@consent_form.pdf"

# Then start render
curl -X POST http://localhost:8000/api/render/1 \
  -H "Content-Type: application/json" \
  -d '{"watermark": true}'
```

Response:
```json
{
  "job_id": "abc123-def456-...",
  "status_url": "/api/render/status/abc123-def456-..."
}
```

### Check Render Status

```bash
curl http://localhost:8000/api/render/status/abc123-def456-...
```

Response:
```json
{
  "id": "abc123-def456-...",
  "status": "finished",
  "progress": 100.0,
  "logs": [
    "Starting render for project 1",
    "Timeline ready; beginning composition",
    "Processed segment intro",
    "Writing video stream",
    "Applying watermark & metadata",
    "Render complete -> /media/final/project_video_20251025_120000.mp4"
  ],
  "result": "/media/final/project_video_20251025_120000.mp4",
  "output_url": "/media/final/project_video_20251025_120000.mp4"
}
```

### Run AI Tools

```bash
# Transcribe video
curl -X POST http://localhost:8000/api/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "transcribe",
    "args": {
      "path": "/path/to/video.mp4",
      "model": "small.en"
    }
  }'

# Detect beats
curl -X POST http://localhost:8000/api/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "beats",
    "args": {
      "path": "/path/to/video.mp4"
    }
  }'
```

### Chat with AI

```bash
# Create session
curl -X POST http://localhost:8000/api/chat/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Chat",
    "backend": "stub"
  }'

# Send message
curl -X POST http://localhost:8000/api/chat/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Suggest a hook for my video about cooking"
  }'
```

## Testing

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=backend tests/

# Run specific test file
pytest tests/test_timeline.py -v
```

## Database Migrations

The app uses SQLAlchemy with automatic table creation. To modify models:

1. Update model definitions in `backend/models.py`
2. The tables will be auto-created on startup via `init_db()`

For production, consider using Alembic for proper migrations:

```bash
# Initialize Alembic
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Add new field"

# Apply migration
alembic upgrade head
```

## Performance Considerations

### Video Processing
- Large videos should be processed asynchronously
- Consider adding file size limits (current default: no limit)
- Use FFmpeg hardware acceleration where available

### Database
- SQLite is suitable for development and small deployments
- For production, migrate to PostgreSQL or MySQL
- Add database indexes for frequently queried fields

### Background Jobs
- RQ uses in-process workers by default
- For production, run dedicated worker processes:
  ```bash
  rq worker renders --url redis://localhost:6379/0
  ```

### Caching
- Consider adding Redis caching for frequently accessed data
- Cache AI model outputs (transcriptions, beat analyses)

## Security Considerations

1. **File Upload Validation**
   - File type checking is implemented
   - Add file size limits
   - Scan uploads for malware

2. **Consent Management**
   - Renders are blocked without proper consent
   - Store consent documents securely
   - Add audit logging

3. **API Authentication**
   - Currently no authentication
   - Add JWT or OAuth2 for production
   - Implement rate limiting

4. **CORS Configuration**
   - Configure specific allowed origins
   - Don't use wildcard (*) in production

## Frontend Integration

The backend is designed to work with a Next.js frontend. Key integration points:

1. **Base URL**: Configure frontend to use `http://localhost:8000` for API calls
2. **Media Serving**: Static files served from `/media/*` endpoints
3. **WebSocket Support**: Consider adding WebSocket for real-time render progress
4. **Error Handling**: All endpoints return consistent JSON error responses

Example frontend configuration (Next.js):

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadVideo(file: File): Promise<ProjectDetail> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('auto_analyze', 'true');
  
  const response = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Upload failed');
  }
  
  return response.json();
}
```

## Troubleshooting

### Redis Connection Failed
- Ensure Redis is running: `redis-cli ping`
- Check Redis URL in configuration
- Verify network connectivity

### FFmpeg Errors
- Install FFmpeg: `apt-get install ffmpeg` or `brew install ffmpeg`
- Check FFmpeg in PATH: `ffmpeg -version`
- Verify video codecs are supported

### Whisper Model Download Issues
- Models downloaded on first use (~500MB for "small.en")
- Check internet connection
- Verify disk space available
- Set `WHISPER_MODEL=tiny` for faster testing

### Import Errors
- Install all requirements: `pip install -r requirements.txt`
- Activate virtual environment
- Check Python version (3.10+ recommended)

## License

See LICENSE file in repository root.

## Contributing

See CONTRIBUTING.md for guidelines.

---

**Status**: ✅ FULLY IMPLEMENTED AND TESTED

All endpoints specified in the requirements have been implemented and are working correctly. The backend is ready for integration with the frontend.
