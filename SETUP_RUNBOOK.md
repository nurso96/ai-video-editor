# Setup Models Script - Runbook

## What Changed

### Fixed Python Import Testing Block

**Problem**: The original script used `python -c "..."` with embedded f-strings containing single quotes, which caused syntax errors:
```python
print(f'❌ torch: {e}')  # Single quotes conflict with outer shell quotes
```

**Solution**: Replaced with heredoc-based Python block using `python - <<'EOF'`:
- Eliminates quote escaping issues
- Cleaner, more readable Python code
- Proper handling of f-strings and formatting
- Maintained exit code behavior (non-zero on missing packages)

**Key Changes**:
1. Changed from `python -c "..."` to `python - <<'EOF' ... EOF`
2. Refactored duplicate try-except blocks into a loop over package list
3. Fixed comma-join quote issue: `{', '.join(errors)}` → `{", ".join(errors)}`
4. Preserved all functionality: checks torch, diffusers, transformers, whisper, moviepy

## How to Run

### First Time Setup

```bash
cd /home/nick/ai-video-editor
./setup_models.sh
```

### What It Does

The script performs these steps:

1. ✅ **Check micromamba** - Verifies installation
2. ✅ **Create/verify environment** - Creates `ai-editing` if missing
3. ✅ **Activate environment** - Activates `ai-editing`
4. ✅ **Check Python** - Displays Python version
5. 📦 **Install PyTorch** - Installs with CUDA 12.1 support
6. 📦 **Install dependencies** - Runs `pip install -r requirements.txt`
7. 🔍 **Verify GPU** - Checks CUDA availability and GPU count
8. 🔍 **Check NVIDIA drivers** - Displays GPU memory info
9. 🔍 **Check LTX-Video model** - Verifies model files exist
10. 🔍 **Check .env** - Verifies configuration file
11. ✅ **Test imports** - **[FIXED]** Tests critical Python packages
12. 🎉 **Summary** - Shows next steps

### Expected Output

```
🚀 AI Video Editor - Model Setup
=================================

Checking for micromamba...
✅ micromamba found

Checking for ai-editing environment...
✅ Environment exists

Activating environment...
✅ Environment activated

Checking Python version...
✅ Python 3.10.14

Installing PyTorch with CUDA support...
[pip install output...]

Installing other dependencies...
[pip install output...]

Verifying GPU setup...
CUDA available: True
CUDA version: 12.1
GPU count: 2
  GPU 0: NVIDIA GeForce RTX 3060 (11.8 GB)
  GPU 1: NVIDIA GeForce RTX 3060 (11.8 GB)

Checking NVIDIA drivers...
GPU 0: NVIDIA GeForce RTX 3060 - 11680MB free / 12288MB total
GPU 1: NVIDIA GeForce RTX 3060 - 12286MB free / 12288MB total

Checking for LTX-Video model...
✅ LTX-Video model found
   Model size: 1.3G

Checking .env configuration...
✅ .env file found
   Key settings:
   CUDA_VISIBLE_DEVICES=1
   AIVE_MODEL_DUMMY=false
   AIVE_CHAT_BACKEND=hf
   AIVE_WHISPER_MODEL=small.en

Testing critical imports...
✅ torch
✅ diffusers
✅ transformers
✅ whisper
✅ moviepy

=================================
✅ Setup complete!

Next steps:
  1. Make sure Redis is running: redis-server
  2. Start the full stack: ./scripts/dev_all.sh
  3. Or start backend only: uvicorn backend.app:app --reload
  4. Monitor GPU usage: watch -n 1 nvidia-smi

📖 Read AI_MODELS_SETUP.md for detailed configuration
```

### If Imports Fail

If packages are missing, you'll see:

```
Testing critical imports...
❌ torch: No module named 'torch'
❌ diffusers: No module named 'diffusers'
✅ transformers
✅ whisper
✅ moviepy

⚠️  Missing packages: torch, diffusers
Run: pip install -r requirements.txt
```

The script will exit with code 1, preventing you from continuing with broken dependencies.

### Manual Recovery

If the script fails partway through:

```bash
# Activate environment manually
eval "$(micromamba shell hook --shell bash)"
micromamba activate ai-editing

# Install PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install other dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; print('CUDA:', torch.cuda.is_available())"
```

## After Setup

### Start Development Server

```bash
# Option 1: All services at once
./scripts/dev_all.sh

# Option 2: Manual control
# Terminal 1: Redis
redis-server

# Terminal 2: Backend + Worker
micromamba activate ai-editing
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000 &
rq worker renders --url redis://localhost:6379/0

# Terminal 3: Frontend
cd frontend
npm run dev
```

### Test GPU Usage

```bash
# Monitor in real-time
watch -n 1 nvidia-smi

# Or use nvtop (install: sudo apt install nvtop)
nvtop
```

### Test Model Loading

```python
# In Python shell within ai-editing environment
from backend.services.captions import CaptionService
import torch

# Check CUDA
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"Current device: {torch.cuda.current_device() if torch.cuda.is_available() else 'CPU'}")

# Test Whisper
service = CaptionService()
print(f"Whisper model: {service.model_name}")
print(f"Device: {service._device}")
```

## Troubleshooting

### "micromamba: command not found"

Install micromamba:
```bash
curl -Ls https://micro.mamba.pm/install.sh | bash
# Restart shell or source your .bashrc
source ~/.bashrc
```

### "python: command not found" during script

The environment isn't activated. The script handles this, but if you're debugging:
```bash
eval "$(micromamba shell hook --shell bash)"
micromamba activate ai-editing
```

### "CUDA not available" but GPUs exist

Check PyTorch CUDA installation:
```bash
python -c "import torch; print(torch.version.cuda)"
```

If it returns `None`, reinstall PyTorch:
```bash
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### Script exits at import check

This is expected! It means required packages are missing. Run:
```bash
pip install -r requirements.txt
```

Then re-run the setup script.

## Files Modified

- `setup_models.sh` - Main setup script (FIXED Python block)
- `requirements.txt` - Added AI/ML dependencies
- `.env` - Created with GPU configuration
- `backend/services/model_loaders.py` - Added real LTX-Video inference

## Environment Variables

The `ai-editing` environment uses these settings:

- `CUDA_VISIBLE_DEVICES=1` - Use GPU 1 for models (GPU 0 for display)
- `AIVE_MODEL_DUMMY=false` - Enable real models
- `AIVE_CHAT_BACKEND=hf` - Use Hugging Face for chat
- `AIVE_WHISPER_MODEL=small.en` - English Whisper model
- `HF_HOME` - (optional) Custom Hugging Face cache location

## Next Steps

1. ✅ Run `./setup_models.sh`
2. ✅ Start development: `./scripts/dev_all.sh`
3. 📖 Read `AI_MODELS_SETUP.md` for model configuration
4. 🎬 Upload video and test transcription
5. 🤖 Try video generation with LTX-Video

---

**Last Updated**: 2025-10-26
**Environment**: ai-editing (Python 3.10, CUDA 12.1)
**GPUs**: 2x RTX 3060 (12GB each)
