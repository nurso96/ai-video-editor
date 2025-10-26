#!/bin/bash
# AI Video Editor - Model Setup Script
# This script helps you set up the AI models and verify your environment

set -e

echo "🚀 AI Video Editor - Model Setup"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if micromamba is installed
echo "Checking for micromamba..."
if ! command -v micromamba &> /dev/null; then
    echo -e "${RED}❌ micromamba not found${NC}"
    echo "Please install micromamba first:"
    echo "  curl -Ls https://micro.mamba.pm/install.sh | bash"
    exit 1
fi
echo -e "${GREEN}✅ micromamba found${NC}"

# Initialize shell
eval "$(micromamba shell hook --shell bash)"

# Check if environment exists
echo ""
echo "Checking for ai-editing environment..."
if ! micromamba env list | grep -q "ai-editing"; then
    echo -e "${YELLOW}⚠️  Environment not found. Creating it now...${NC}"
    micromamba env create -f environment.yml
    echo -e "${GREEN}✅ Environment created${NC}"
else
    echo -e "${GREEN}✅ Environment exists${NC}"
fi

# Activate environment
echo ""
echo "Activating environment..."
micromamba activate ai-editing
echo -e "${GREEN}✅ Environment activated${NC}"

# Check Python version
echo ""
echo "Checking Python version..."
PYTHON_VERSION=$(python --version)
echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"

# Install PyTorch with CUDA support
echo ""
echo "Installing PyTorch with CUDA support..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install other dependencies
echo ""
echo "Installing other dependencies..."
pip install -r requirements.txt

# Verify GPU setup
echo ""
echo "Verifying GPU setup..."
python -c "
import torch
print('CUDA available:', torch.cuda.is_available())
if torch.cuda.is_available():
    print('CUDA version:', torch.version.cuda)
    print('GPU count:', torch.cuda.device_count())
    for i in range(torch.cuda.device_count()):
        print(f'  GPU {i}: {torch.cuda.get_device_name(i)} ({torch.cuda.get_device_properties(i).total_memory / 1024**3:.1f} GB)')
else:
    print('⚠️  CUDA not available. Models will run on CPU (very slow)')
"

# Check NVIDIA drivers
echo ""
echo "Checking NVIDIA drivers..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=index,name,memory.total,memory.used,memory.free --format=csv,noheader,nounits | while IFS=',' read -r idx name total used free; do
        echo -e "${GREEN}GPU $idx: $name - ${free}MB free / ${total}MB total${NC}"
    done
else
    echo -e "${RED}❌ nvidia-smi not found${NC}"
fi

# Check if LTX-Video model exists
echo ""
echo "Checking for LTX-Video model..."
if [ -f "models/LTX-Video/model_index.json" ]; then
    echo -e "${GREEN}✅ LTX-Video model found${NC}"
    MODEL_SIZE=$(du -sh models/LTX-Video | cut -f1)
    echo "   Model size: $MODEL_SIZE"
else
    echo -e "${YELLOW}⚠️  LTX-Video model not found or incomplete${NC}"
    echo "   The model files exist but may need reorganization."
    echo "   See AI_MODELS_SETUP.md for download instructions."
fi

# Check .env file
echo ""
echo "Checking .env configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    echo "   Key settings:"
    grep -E "^(CUDA_VISIBLE_DEVICES|AIVE_MODEL_DUMMY|AIVE_CHAT_BACKEND|AIVE_WHISPER_MODEL)" .env | sed 's/^/   /'
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   A default .env has been created for you."
fi

# Test imports
echo ""
echo "Testing critical imports..."
python - <<'EOF'
import sys

errors = []
packages = [
    ('torch', 'torch'),
    ('diffusers', 'diffusers'),
    ('transformers', 'transformers'),
    ('whisper', 'whisper'),
    ('moviepy', 'moviepy'),
]

for module_name, display_name in packages:
    try:
        __import__(module_name)
        print(f'✅ {display_name}')
    except ImportError as e:
        errors.append(display_name)
        print(f'❌ {display_name}: {e}')

if errors:
    print(f'\n⚠️  Missing packages: {", ".join(errors)}')
    print('Run: pip install -r requirements.txt')
    sys.exit(1)
EOF

# Summary
echo ""
echo "================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Make sure Redis is running: redis-server"
echo "  2. Start the full stack: ./scripts/dev_all.sh"
echo "  3. Or start backend only: uvicorn backend.app:app --reload"
echo "  4. Monitor GPU usage: watch -n 1 nvidia-smi"
echo ""
echo "📖 Read AI_MODELS_SETUP.md for detailed configuration"
echo ""
