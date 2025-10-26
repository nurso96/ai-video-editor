# End-to-End Testing Guide

This guide helps you verify the complete workflow of the AI Video Editor.

## Prerequisites

Before running E2E tests, ensure all services are running:

```bash
# 1. Start Redis
redis-server

# 2. Start Backend (in one terminal)
cd /path/to/ai-video-editor
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# 3. Start RQ Worker (in another terminal)
rq worker renders --url redis://localhost:6379/0

# 4. Start Frontend (in another terminal)
cd frontend
npm run dev
```

## Manual E2E Test Workflow

### 1. Access the Application

1. Open browser to `http://localhost:3000`
2. Click "Open Editor" link
3. You should see the editor with an upload interface

### 2. Upload a Video

1. Click "Choose Video File" button
2. Select a short video file (MP4, MOV, etc.)
3. Wait for upload to complete
4. Video should appear with auto-analysis (transcription + beat detection)

**Expected Results:**
- Project ID appears in header
- Video preview shows the uploaded video
- Timeline displays auto-generated segments
- URL updates to `/editor?projectId=X`

### 3. Edit Timeline

1. Click different segments in the Timeline panel
2. Selected segment should highlight
3. Right panel shows segment details:
   - Segment name and duration
   - Effects panel (editable)
   - Captions (if auto-transcribed)

**Test editing:**
1. In Effects Panel, add: `zoom, slowmo`
2. Click "Save Timeline"
3. Toast notification should confirm save

### 4. Use AI Tools

1. Click "AI Tools" button in header
2. Tools panel slides in from right
3. Test "beats" tool:
   - Click "beats" button
   - Click "Run Tool"
   - Should see beat detection results
   - Click "Apply to Timeline"
4. Test "transcribe" tool:
   - Click "transcribe" button
   - Click "Run Tool"
   - Wait for transcription (may take 30s-2min)
   - Should see caption results
   - Click "Apply to Timeline"

**Expected Results:**
- Beats added to timeline
- Captions appear in segment details
- Toast confirms application

### 5. Configure Settings

1. Click "Settings" button
2. Settings modal appears
3. Verify displayed info:
   - Watermark toggle (should be enabled by default)
   - Consent status
   - Redis health (should show "reachable")
4. Toggle watermark off/on
5. Close settings

### 6. Render the Video

1. Click "Start Export" button
2. Job should be queued
3. Progress indicator appears: "Rendering: X%"
4. Wait for completion (30s-2min depending on video length)
5. Toast shows "Render complete! Download: /media/final/..."

**Expected Results:**
- Render progress updates every 2 seconds
- Final progress reaches 100%
- Output URL is provided
- Can download rendered video

### 7. Chat Interface (Optional)

1. Click "Chat" button in header
2. Chat drawer opens from right
3. Select or create a chat session
4. Type a message about video editing
5. Send message
6. Receive AI response (stub or HF model)

## Automated E2E Test Script

Create a simple test script to verify the API workflow:

```bash
#!/bin/bash

API_BASE="http://localhost:8000/api"
TEST_VIDEO="path/to/test-video.mp4"

echo "=== E2E Test: AI Video Editor ==="

# 1. Health Check
echo "1. Checking backend health..."
HEALTH=$(curl -s $API_BASE/healthz)
echo "Health: $HEALTH"

if [[ $HEALTH != *"\"redis\":true"* ]]; then
  echo "❌ Redis not connected"
  exit 1
fi
echo "✅ Backend healthy"

# 2. Upload Video
echo "2. Uploading test video..."
UPLOAD_RESULT=$(curl -s -X POST $API_BASE/ingest \
  -F "file=@$TEST_VIDEO" \
  -F "title=E2E Test Video" \
  -F "auto_analyze=true")

PROJECT_ID=$(echo $UPLOAD_RESULT | jq -r '.project.id')
echo "✅ Video uploaded, Project ID: $PROJECT_ID"

# 3. Get Project Timeline
echo "3. Fetching project timeline..."
sleep 2  # Wait for auto-analysis
TIMELINE=$(curl -s $API_BASE/timeline/$PROJECT_ID)
SEGMENTS=$(echo $TIMELINE | jq -r '.timeline.segments | length')
echo "✅ Timeline loaded, $SEGMENTS segments"

# 4. Update Timeline
echo "4. Updating timeline..."
UPDATE_PAYLOAD=$(echo $TIMELINE | jq '.timeline.segments[0].effects += ["zoom"]')
UPDATE_RESULT=$(curl -s -X POST $API_BASE/timeline/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -d "{\"timeline\": $UPDATE_PAYLOAD}")
echo "✅ Timeline updated"

# 5. Start Render
echo "5. Starting render job..."
RENDER_RESULT=$(curl -s -X POST $API_BASE/render/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -d '{"watermark": true}')

JOB_ID=$(echo $RENDER_RESULT | jq -r '.job_id')
echo "✅ Render queued, Job ID: $JOB_ID"

# 6. Poll Render Status
echo "6. Waiting for render to complete..."
while true; do
  STATUS=$(curl -s $API_BASE/render/status/$JOB_ID)
  RENDER_STATUS=$(echo $STATUS | jq -r '.status')
  PROGRESS=$(echo $STATUS | jq -r '.progress')

  echo "   Status: $RENDER_STATUS, Progress: $(echo "$PROGRESS * 100" | bc -l | cut -d. -f1)%"

  if [[ $RENDER_STATUS == "finished" ]]; then
    OUTPUT_URL=$(echo $STATUS | jq -r '.output_url')
    echo "✅ Render complete: $OUTPUT_URL"
    break
  elif [[ $RENDER_STATUS == "failed" ]]; then
    ERROR=$(echo $STATUS | jq -r '.error')
    echo "❌ Render failed: $ERROR"
    exit 1
  fi

  sleep 2
done

echo ""
echo "=== E2E Test Complete ==="
echo "All tests passed! ✅"
```

Save as `scripts/e2e_test.sh` and run:

```bash
chmod +x scripts/e2e_test.sh
./scripts/e2e_test.sh
```

## Frontend Component Testing

Run the test suite:

```bash
cd frontend
npm test
```

**Expected output:**
```
Test Suites: 5 passed, 5 total
Tests:       16 passed, 16 total
```

## Common Issues & Solutions

### Upload Fails
- **Cause**: Backend not running or CORS issue
- **Fix**: Check backend logs, verify NEXT_PUBLIC_API_BASE

### Render Gets Stuck
- **Cause**: RQ worker not running
- **Fix**: Start worker with `rq worker renders --url redis://localhost:6379/0`

### Transcription Fails
- **Cause**: Whisper model not downloaded
- **Fix**: First run downloads model (~500MB), be patient

### Video Preview Not Loading
- **Cause**: Incorrect media URL
- **Fix**: Check media directory permissions, verify `/media/*` routes work

### Chat Not Responding
- **Cause**: Default stub backend has limited responses
- **Fix**: Normal behavior, or configure HF/OpenAI backend

## Performance Benchmarks

Typical performance on a modern machine:

- **Upload**: 5-30s (depends on file size)
- **Auto-analysis**: 10-60s (transcription + beats)
- **Timeline save**: <1s
- **Render**: 30s-5min (depends on video length and effects)

## Next Steps

After successful E2E testing:

1. Deploy to staging environment
2. Run E2E tests in staging
3. Load test with multiple concurrent users
4. Security audit
5. Deploy to production

## Monitoring E2E in Production

Set up automated E2E tests to run periodically:

```bash
# Cron job: every hour
0 * * * * /path/to/scripts/e2e_test.sh >> /var/log/ai-video-e2e.log 2>&1
```

Use monitoring tools to alert on failures:
- Sentry for error tracking
- Uptime Robot for availability
- Custom Slack/email alerts from cron
