# 🚀 Quick Start - AI Video Production System

## What You Just Got

**4 new powerful features using Hugging Face models:**

1. **Multi-LLM Chat** - Talk to AI planners, editors, scripters
2. **Video Generation** - LTX-Video (already installed!)
3. **YouTube Shorts Upload** - Auto-upload to YouTube
4. **TikTok Upload** - Auto-upload to TikTok

---

## 🎯 Step 1: Install Dependencies

```bash
cd /home/nick/ai-video-editor
micromamba activate ai-editing

# Install new packages
pip install -r requirements.txt
```

**New packages added:**
- `google-api-python-client` - YouTube uploads
- `google-auth-oauthlib` - Google OAuth
- No extra packages needed for HF models - already have transformers!

---

## 🤖 Step 2: Test Multi-LLM Chat (Works Immediately!)

### Start the backend:
```bash
./scripts/dev_all.sh
```

### Test the chat API:
```bash
# General chat
curl -X POST http://localhost:8000/api/multi-chat/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I make a funny video?",
    "mode": "general"
  }'

# Video planner
curl -X POST http://localhost:8000/api/multi-chat/plan-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Make a 30-second funny video about cats learning Python"
  }'
```

### Use the chat UI:

Navigate to `http://localhost:3000` and add the chat component to your editor page!

---

## 📹 Step 3: Generate Videos

Your LTX-Video model is **already installed** at `models/LTX-Video/`!

```bash
# Generate a video
curl -X POST http://localhost:8000/api/tools/generate_video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat typing on a laptop",
    "width": 512,
    "height": 512,
    "length_seconds": 3,
    "fps": 8
  }'
```

---

## 📤 Step 4: Setup Social Media Uploads

### YouTube Shorts Setup

1. **Create Google Cloud Project:**
   - Go to: https://console.cloud.google.com/
   - Create new project: "AI Video Editor"
   - Enable "YouTube Data API v3"

2. **Create OAuth Credentials:**
   - Go to: APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Desktop app
   - Download JSON as `client_secret.json`
   - Move to `/home/nick/ai-video-editor/`

3. **First Upload (will authenticate):**
   ```bash
   curl -X POST http://localhost:8000/api/social/upload \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "/home/nick/ai-video-editor/media/final/your_video.mp4",
       "title": "My First AI Short",
       "description": "Made with AI! #Shorts #python",
       "platforms": ["youtube"]
     }'
   ```

   This will open a browser to authenticate. Token saved for future uploads!

### TikTok Setup

1. **Apply for Developer Access:**
   - Go to: https://developers.tiktok.com/
   - Create app
   - Request video upload permission (may take days for approval)

2. **Get Access Token:**
   - Once approved, get OAuth token
   - Add to `.env`:
     ```bash
     TIKTOK_ACCESS_TOKEN=your_token_here
     ```

3. **Upload:**
   ```bash
   curl -X POST http://localhost:8000/api/social/upload \
     -H "Content-Type: application/json" \
     -d '{
       "video_path": "/home/nick/ai-video-editor/media/final/your_video.mp4",
       "title": "My TikTok",
       "description": "AI-generated content! #fyp #ai",
       "platforms": ["tiktok"]
     }'
   ```

---

## 🎬 Step 5: Full Pipeline Example

**Create a video from start to finish:**

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. Create video plan with AI
plan_response = requests.post(f"{BASE_URL}/multi-chat/plan-video", json={
    "prompt": "30-second funny video about a cat learning to code in Python"
})
plan = plan_response.json()["plan"]

print("AI created this plan:", plan)

# 2. Generate video for each scene
for scene in plan["scenes"]:
    video_response = requests.post(f"{BASE_URL}/tools/generate_video", json={
        "prompt": scene["visual"],
        "width": 512,
        "height": 512,
        "length_seconds": scene["duration"],
        "fps": 24
    })
    video_path = video_response.json()["path"]
    print(f"Generated: {video_path}")

# 3. Upload to social media
upload_response = requests.post(f"{BASE_URL}/social/upload", json={
    "video_path": video_path,
    "title": plan["title"],
    "description": f"{plan['title']} #Shorts #ai",
    "platforms": ["youtube"]
})

print("Upload results:", upload_response.json())
```

---

## 🔧 Configuration

### Update `.env` for AI models:

```bash
# HF Models for Chat (optional - defaults work)
HF_PLANNER_MODEL=meta-llama/Llama-3.2-3B-Instruct
HF_CHAT_MODEL=mistralai/Mistral-7B-Instruct-v0.2
HF_EDITOR_MODEL=Qwen/Qwen2.5-7B-Instruct

# Hugging Face Token (for private models)
HF_TOKEN=your_hf_token_here

# GPU Settings
CUDA_VISIBLE_DEVICES=1  # Use GPU 1 for AI

# Social Media
TIKTOK_ACCESS_TOKEN=your_token_when_approved
```

### Download Better Models (Optional):

```bash
# Better video generation (10-12GB VRAM)
huggingface-cli download tencent/HunyuanVideo --local-dir models/HunyuanVideo

# Better chat model (8GB VRAM)
huggingface-cli download mistralai/Mistral-7B-Instruct-v0.2 --local-dir models/Mistral-7B
```

---

## 🌐 Frontend Integration

Add the chat to your editor page:

```typescript
// In frontend/src/pages/editor.tsx

import MultiLLMChat from '@/components/MultiLLMChat';

// Add to your layout:
<Box w="400px" h="100vh">
  <MultiLLMChat />
</Box>
```

---

## 🐛 Troubleshooting

### "Model not found" error:
```bash
# Check HF token
echo $HF_TOKEN

# Login to HF
huggingface-cli login
```

### "CUDA out of memory":
```bash
# Use smaller models in .env:
HF_CHAT_MODEL=meta-llama/Llama-3.2-1B-Instruct
```

### YouTube upload fails:
```bash
# Check client_secret.json exists
ls client_secret.json

# Check API endpoint status
curl http://localhost:8000/api/social/status
```

---

## 📊 What's Working NOW:

✅ **Multi-LLM Chat** - 4 modes (general, planner, editor, scripter)
✅ **Video Generation** - LTX-Video on your GPU
✅ **YouTube Upload** - Auto-upload with OAuth
✅ **TikTok Upload** - Ready (needs approval)
✅ **Frontend Chat UI** - React component ready

## 🚧 What's Next:

- Voice generation (ElevenLabs/Bark)
- Auto-editing pipeline
- Metadata optimization AI
- Instagram Reels support

---

**Ready to test?**

```bash
# Start everything
./scripts/dev_all.sh

# Open frontend
xdg-open http://localhost:3000

# Test chat API
curl -X POST http://localhost:8000/api/multi-chat/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Make a funny video idea!", "mode": "planner"}'
```

🎉 **You now have a working AI video production system!**
