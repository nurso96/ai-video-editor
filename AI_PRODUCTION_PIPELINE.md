# 🎬 AI Video Production Pipeline - Complete Architecture

## Nicholas Urso's Fully Autonomous AI Video Producer

**Goal**: Create hilarious content + educational videos with minimal human effort using multi-LLM orchestration.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│          "Make a funny video about cats learning Python"         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: PLANNING AI (GPT-4o / Claude 3.5 Sonnet)             │
│  - Understands request                                           │
│  - Creates script, scenes, shots                                 │
│  - Determines: comedy style, educational points, visuals needed  │
│  Output: Production plan JSON                                    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 2: CONTENT GENERATION (Parallel Processing)              │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Video Gen AI    │  │ Voice/Audio AI   │  │ CGI/Animation  │ │
│  │ - LTX-Video     │  │ - ElevenLabs     │  │ - AnimateDiff  │ │
│  │ - HunyuanVideo  │  │ - Bark           │  │ - Stable Diff  │ │
│  │ - CogVideoX     │  │ - XTTS-v2        │  │ - ControlNet   │ │
│  └─────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  Output: Raw video clips, audio tracks, CGI elements            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 3: EDITING AI (Gemini 1.5 Pro / Llama 3.2)              │
│  - Scene assembly                                                │
│  - Timing optimization                                           │
│  - Effects/transitions                                           │
│  - Caption placement                                             │
│  - Music/SFX sync                                                │
│  Output: Edited video (MP4)                                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 4: OPTIMIZATION AI (Small specialized model)             │
│  - Platform-specific optimization                                │
│  - TikTok: 9:16, <60s, trending sounds                          │
│  - YouTube Shorts: 9:16, <60s, hooks                            │
│  - IG Reels: 9:16, <90s                                         │
│  Output: Platform-optimized versions                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 5: UPLOAD & ANALYTICS (Automation)                       │
│  - Auto-upload to TikTok, YouTube Shorts, IG Reels              │
│  - Generate SEO titles, descriptions, hashtags                   │
│  - Schedule posting times                                        │
│  - Track performance                                             │
│  Output: Published content + analytics                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 AI Model Breakdown by Stage

### STAGE 1: Planning & Scripting

**Primary Model**: GPT-4o or Claude 3.5 Sonnet
- **Why**: Best at understanding creative intent, humor, storytelling
- **VRAM**: 0 (API-based)
- **Cost**: $0.01-0.03 per request
- **Alternative (Self-hosted)**: Llama 3.3 70B (quantized to 24GB)

**Input**: User prompt
**Output**:
```json
{
  "title": "Cats Learn Python - Episode 1",
  "style": "comedy + educational",
  "duration": 45,
  "scenes": [
    {
      "scene_id": 1,
      "duration": 8,
      "type": "intro",
      "visual": "Cartoon cat sitting at laptop",
      "voiceover": "Meet Whiskers, a cat who wants to code!",
      "effects": ["zoom_in", "playful_music"]
    },
    {
      "scene_id": 2,
      "duration": 15,
      "type": "educational",
      "visual": "Screen recording showing Python print() statement",
      "voiceover": "First, Whiskers learns print('Hello World')",
      "captions": ["print('meow')"],
      "effects": ["code_highlight"]
    }
  ]
}
```

---

### STAGE 2A: Video Generation

**Best Models for Your Dual RTX 3060 Setup:**

#### 1. **LTX-Video** (Already installed! ✅)
- **Use for**: Fast, smooth motion, camera movements
- **VRAM**: 6-8GB for 512x512@24fps
- **Speed**: 4 seconds for 5-second clip
- **Best for**: Quick cuts, action scenes, transitions
- **Your setup**: Perfect fit! Use GPU 1

#### 2. **HunyuanVideo** (Recommended download)
```bash
huggingface-cli download tencent/HunyuanVideo --local-dir models/HunyuanVideo
```
- **Use for**: High-quality, professional shots
- **VRAM**: 10-12GB (fits your 12GB GPU)
- **Best for**: Hero shots, establishing scenes
- **Slower but higher quality**

#### 3. **CogVideoX-5B** (Alternative)
```bash
huggingface-cli download THUDM/CogVideoX-5b --local-dir models/CogVideoX
```
- **Use for**: Detail-rich scenes
- **VRAM**: 8-10GB
- **Best for**: Close-ups, product shots

#### 4. **AnimateDiff** (For animation/CGI)
```bash
huggingface-cli download guoyww/animatediff --local-dir models/AnimateDiff
```
- **Use for**: Cartoon-style animations
- **VRAM**: 6-8GB
- **Best for**: Stylized content, memes

**Strategy**: Use LTX-Video for 80% of shots (speed), HunyuanVideo for key moments (quality)

---

### STAGE 2B: Voice/Audio Generation

#### **ElevenLabs** (API - Best quality)
- **Use for**: Professional voiceovers
- **Cost**: $5/month for 30,000 characters
- **Supports**: Multiple voices, emotions, languages
- **Integration**: Simple REST API

#### **Bark** (Self-hosted - Free)
```bash
pip install bark
```
- **Use for**: Quick voice generation
- **VRAM**: 4GB
- **Supports**: Emotions, laughter, background sounds
- **Run on**: CPU or GPU 0

#### **XTTS-v2** (Coqui TTS - Voice cloning)
```bash
pip install TTS
```
- **Use for**: Clone your voice or consent-provided voices
- **VRAM**: 3GB
- **Best for**: Consistent narrator voice

---

### STAGE 3: Editing & Assembly

**Model**: Gemini 1.5 Pro or Llama 3.2 Vision
- **Why**: Understands video content, can analyze scenes
- **Use for**: Deciding cuts, transitions, pacing
- **How**: Analyzes thumbnails of clips, creates edit decision list (EDL)

**Editing Engine**: FFmpeg + MoviePy (Python-based)
- No AI needed - just follows the EDL from AI

---

### STAGE 4: Platform Optimization

**Small specialized model**: Fine-tuned Llama 3.2 3B
- **Task**: Generate platform-specific metadata
- **Trained on**: Viral TikTok/YouTube Shorts data
- **VRAM**: 2GB
- **Output**: Titles, hashtags, descriptions that trend

---

### STAGE 5: Upload Automation

**YouTube Shorts API**:
```python
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# Upload video
youtube = build('youtube', 'v3', credentials=creds)
request = youtube.videos().insert(
    part="snippet,status",
    body={
        "snippet": {
            "title": "Cats Learn Python #shorts",
            "description": "Watch Whiskers code! #python #coding #cats",
            "tags": ["python", "coding", "cats", "funny"],
            "categoryId": "22"
        },
        "status": {"privacyStatus": "public"}
    },
    media_body="video.mp4"
)
```

**TikTok API**:
```python
# TikTok requires approval - apply at:
# https://developers.tiktok.com/

import requests
response = requests.post(
    'https://open-api.tiktok.com/share/video/upload/',
    headers={'Authorization': f'Bearer {access_token}'},
    files={'video': open('video.mp4', 'rb')},
    data={
        'description': 'Cats Learn Python! 🐱💻 #coding #python',
        'privacy_level': 'PUBLIC_TO_EVERYONE'
    }
)
```

---

## 💬 Frontend Chat Integration

### Multi-LLM Chat Architecture

**Backend** (`backend/services/multi_llm_chat.py`):
```python
class MultiLLMOrchestrator:
    def __init__(self):
        self.planner = GPT4Client()  # or Claude
        self.video_gen = LTXVideoLoader()
        self.voice_gen = ElevenLabsClient()
        self.editor = GeminiClient()

    async def chat(self, user_message, session_id):
        # 1. Route to appropriate AI based on intent
        intent = self.classify_intent(user_message)

        if intent == "plan_video":
            response = await self.planner.create_plan(user_message)
        elif intent == "generate_clip":
            response = await self.video_gen.generate(user_message)
        elif intent == "edit_suggestion":
            response = await self.editor.suggest_edits(user_message)

        # 2. Store in session
        self.save_to_session(session_id, user_message, response)

        return response
```

**Frontend** (`frontend/src/components/AIChat.tsx`):
```typescript
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const response = await fetch('/api/chat/multi-llm', {
      method: 'POST',
      body: JSON.stringify({
        message: input,
        session_id: sessionStorage.getItem('chat_session')
      })
    });

    const data = await response.json();
    setMessages([...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: data.response, model: data.model_used }
    ]);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
            {msg.model && <span className="model-badge">{msg.model}</span>}
          </div>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
  );
};
```

---

## 🎯 Recommended Model Stack for Your Setup

### GPU Allocation (Dual RTX 3060, 12GB each)

**GPU 0** (Display GPU - 11GB available):
- Bark voice generation (4GB)
- Llama 3.2 3B metadata gen (2GB)
- Spare for inference (5GB)

**GPU 1** (AI GPU - 12GB available):
- LTX-Video (primary, 8GB)
- OR HunyuanVideo (when quality needed, 12GB)
- AnimateDiff (6GB, can run with LTX)

### API-Based Models (No VRAM)
- GPT-4o: Planning & scripting ($0.01/request)
- Claude 3.5 Sonnet: Alternative planner
- ElevenLabs: Voice generation ($5/month)
- Gemini 1.5 Pro: Video analysis (free tier available)

---

## 📊 Cost Analysis

### Self-Hosted (Your GPUs)
- **Hardware**: ✅ Already own
- **Electricity**: ~$30/month (running 24/7)
- **Models**: Free (open source)

### API-Based (Hybrid)
- **GPT-4o**: $20-50/month (500-1000 videos)
- **ElevenLabs**: $5-22/month
- **Total**: ~$50-100/month

### Recommended: **Hybrid Approach**
- Use APIs for planning (GPT-4o/Claude)
- Use local GPUs for video generation
- **Total cost**: ~$25-30/month + electricity

---

## 🚀 Quick Start Implementation Order

1. **Week 1**: Multi-LLM chat integration
2. **Week 2**: Video generation pipeline (LTX + HunyuanVideo)
3. **Week 3**: Voice generation (ElevenLabs + Bark)
4. **Week 4**: Auto-editing engine (FFmpeg + MoviePy)
5. **Week 5**: YouTube/TikTok upload automation
6. **Week 6**: Metadata optimization AI
7. **Week 7**: Full pipeline testing

---

## 📝 Next Steps

1. Set up API keys (OpenAI, ElevenLabs, Google YouTube)
2. Apply for TikTok Developer access
3. Download HunyuanVideo model
4. Install voice generation packages
5. Create multi-LLM orchestrator backend
6. Build chat UI component
7. Implement upload automation

Want me to start implementing any of these stages?
