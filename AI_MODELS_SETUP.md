# AI Models Setup Guide

This guide explains how to configure and use AI models with your dual RTX 3060 GPU setup.

## 🖥️ Your Hardware

- **GPUs**: 2x NVIDIA RTX 3060 (12GB VRAM each)
- **RAM**: 64GB
- **CPU**: AMD Ryzen 9 5900X
- **CUDA**: Version 13.0

### GPU Strategy
- **GPU 0** (04:00.0): Used for display - currently has 608MB VRAM used
- **GPU 1** (2B:00.0): Dedicated for AI models - nearly free (2MB used)

We configure the `.env` file to use `CUDA_VISIBLE_DEVICES=1` so AI models use GPU 1.

## 📦 Installation Steps

### 1. Create Micromamba Environment

```bash
cd /home/nick/ai-video-editor

# Create the environment (Python 3.10 + ffmpeg from conda)
micromamba env create -f environment.yml

# Activate it
micromamba activate ai-editing
```

### 2. Install PyTorch with CUDA Support

```bash
# Install PyTorch with CUDA 12.x support (compatible with your CUDA 13.0 driver)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 3. Install All Python Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- **FastAPI/Uvicorn**: Backend server
- **Transformers**: Hugging Face models
- **Diffusers**: Video generation (LTX-Video, etc.)
- **Whisper**: Audio transcription
- **MoviePy/FFmpeg**: Video processing
- **Librosa**: Beat detection

### 4. Verify GPU Setup

```bash
python -c "import torch; print('CUDA available:', torch.cuda.is_available()); print('GPU count:', torch.cuda.device_count())"
```

Expected output:
```
CUDA available: True
GPU count: 2
```

## 🤖 Model Configuration

All configuration is in `.env` (already created for you):

### Key Settings:

```bash
# Use GPU 1 for models (GPU 0 is your display)
CUDA_VISIBLE_DEVICES=1

# Enable real models (not dummy/stub)
AIVE_MODEL_DUMMY=false

# Chat backend: "stub", "hf" (Hugging Face), or "openai"
AIVE_CHAT_BACKEND=hf
AIVE_HF_TEXT_MODEL=distilgpt2

# Whisper model for transcription
AIVE_WHISPER_MODEL=small.en

# Video generation path
AIVE_VIDEO_MODEL_PATH=models/LTX-Video
```

## 🎬 Video Generation Models

### LTX-Video (Already Downloaded!)

You have **LTX-Video** model in `/home/nick/ai-video-editor/models/LTX-Video/`:
- Model file: `ltxv-13b-0.9.7-distilled-lora128.safetensors` (1.3GB)
- This is a text-to-video diffusion model

**Usage:**
```bash
# Via API (POST /api/tools/generate_video)
curl -X POST http://localhost:8000/api/tools/generate_video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cat playing piano",
    "model": "ltx-video",
    "width": 512,
    "height": 512,
    "length_seconds": 2.0,
    "fps": 8,
    "seed": 42
  }'
```

**VRAM Requirements:**
- 512x512, 16 frames (2s @ 8fps): ~6-8GB VRAM ✅ Fits your 12GB GPU
- 720x720, 32 frames: ~10-12GB VRAM ✅ Should fit
- 1024x1024, 64 frames: ~20GB+ VRAM ❌ Too large (reduce resolution/frames)

### Download More Models

You can download additional models from Hugging Face:

```bash
# Example: Download another video model
huggingface-cli download Lightricks/LTX-Video --local-dir models/LTX-Video-v2

# Example: Download image editing model
huggingface-cli download runwayml/stable-diffusion-inpainting --local-dir models/image-edit
```

## 💬 Chat Models

### Current: DistilGPT2 (Lightweight)
- **Size**: ~300MB
- **Quality**: Basic, fast responses
- **VRAM**: ~500MB

### Upgrade Options:

#### 1. Llama 3.2 1B (Good balance)
```bash
# In .env:
AIVE_HF_TEXT_MODEL=meta-llama/Llama-3.2-1B-Instruct

# Requires Hugging Face token (free)
# Get token at: https://huggingface.co/settings/tokens
HF_TOKEN=your_token_here
```
- **Size**: ~2GB
- **VRAM**: ~2-3GB
- **Quality**: Much better than GPT2

#### 2. Mistral 7B (High quality)
```bash
AIVE_HF_TEXT_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```
- **Size**: ~14GB
- **VRAM**: ~8-10GB (fits your GPU)
- **Quality**: Excellent

#### 3. OpenAI (Best quality, requires API key)
```bash
AIVE_CHAT_BACKEND=openai
# Add your OpenAI API key to .env:
OPENAI_API_KEY=sk-...
```

## 🎙️ Whisper Transcription

Already configured in `.env`:

```bash
AIVE_WHISPER_MODEL=small.en
```

**Model Options** (larger = better quality but slower):
- `tiny` - 39M params, ~1GB VRAM, fastest
- `base` - 74M params, ~1GB VRAM
- `small` - 244M params, ~2GB VRAM ✅ **Current**
- `small.en` - English-only, faster ✅ **Current**
- `medium` - 769M params, ~5GB VRAM
- `large` - 1550M params, ~10GB VRAM, best quality

The service auto-detects CUDA and uses GPU when available.

## 🚀 Starting the Full Stack

```bash
# From project root
./scripts/dev_all.sh
```

This starts:
1. **Redis** (job queue)
2. **Backend API** (port 8000) - loads models on GPU 1
3. **Frontend** (port 3000)

### Manual Start (if you prefer):

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend API
micromamba activate ai-editing
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Background worker (for rendering)
micromamba activate ai-editing
rq worker renders --url redis://localhost:6379/0

# Terminal 4: Frontend
cd frontend
npm run dev
```

## 🔍 Monitoring GPU Usage

While models are running:

```bash
# Watch GPU usage in real-time
watch -n 1 nvidia-smi

# Or use nvtop (install via: sudo apt install nvtop)
nvtop
```

## 🎯 Testing Models

### Test Whisper Transcription

```python
from backend.services.captions import CaptionService
from pathlib import Path

service = CaptionService()
result = service.transcribe(Path("media/ingest/your_video.mp4"))
print(result.text)
```

### Test Chat

```python
from backend.services.chat_service import get_chat_service

service = get_chat_service(backend="hf")
response = service.generate_reply("How can I make this video funnier?")
print(response)
```

### Test Video Generation

```bash
# Start the backend, then:
curl -X POST http://localhost:8000/api/tools/generate_video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A rocket launching into space",
    "width": 512,
    "height": 512,
    "length_seconds": 2.0,
    "fps": 8
  }'
```

## ⚙️ Performance Tuning

### If You Run Out of VRAM:

1. **Reduce video resolution/frames**:
```bash
# In .env or per-request:
AIVE_VIDEO_DEFAULT_WIDTH=360
AIVE_VIDEO_DEFAULT_HEIGHT=640
AIVE_VIDEO_MAX_FRAMES=8
```

2. **Use float16 precision** (already enabled for CUDA)

3. **Enable CPU offloading** (slower but uses less VRAM):
```python
# In model_loaders.py, add:
pipe.enable_model_cpu_offload()
```

4. **Use sequential batches** instead of batch generation

### For Faster Inference:

1. **Keep models loaded** (they cache automatically)
2. **Use smaller Whisper model**: `tiny.en` instead of `small.en`
3. **Lower FPS**: 6 fps instead of 8 fps for videos
4. **Compile models** (PyTorch 2.0+):
```python
pipe.unet = torch.compile(pipe.unet)
```

## 📁 Hugging Face Hub Directory

You mentioned having a "Hugging Face Hub Directory" - models downloaded via `huggingface-cli` are typically cached at:

```bash
~/.cache/huggingface/hub/
```

You can symlink existing models to save space:

```bash
# If you have a model already downloaded:
ln -s ~/.cache/huggingface/hub/models--Lightricks--LTX-Video models/LTX-Video-cached

# Or set HF_HOME to use your custom directory:
export HF_HOME=/path/to/your/huggingface-hub
```

## 🐛 Troubleshooting

### "CUDA out of memory"
- Reduce `width`, `height`, or `length_seconds` in video generation
- Close other GPU applications
- Use `CUDA_VISIBLE_DEVICES=1` to use the free GPU

### "Model not found"
- Check `models/LTX-Video/` has `model_index.json`
- Verify `AIVE_VIDEO_MODEL_PATH` in `.env`
- Try setting `AIVE_MODEL_DUMMY=true` to test without models first

### Whisper fails to load
- Ensure PyTorch is installed with CUDA support
- Check `pip list | grep torch`
- Reinstall with: `pip install --upgrade openai-whisper`

### Chat returns stub responses
- Check `AIVE_CHAT_BACKEND=hf` in `.env`
- Verify transformers is installed: `pip list | grep transformers`
- Check backend logs for errors: `tail -f logs/backend.log`

## 📚 Resources

- **LTX-Video Docs**: https://huggingface.co/Lightricks/LTX-Video
- **Diffusers Docs**: https://huggingface.co/docs/diffusers
- **Whisper Docs**: https://github.com/openai/whisper
- **Transformers Docs**: https://huggingface.co/docs/transformers

## 🎉 Next Steps

1. **Start the full stack**: `./scripts/dev_all.sh`
2. **Upload a video** via frontend at http://localhost:3000
3. **Try transcription** with Whisper on GPU
4. **Generate a video** using LTX-Video
5. **Experiment with chat** to get editing suggestions
6. **Monitor GPU usage** with `nvidia-smi`

Happy editing! 🚀
