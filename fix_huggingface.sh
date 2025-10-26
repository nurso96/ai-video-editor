#!/bin/bash
# Fix Hugging Face CLI installation

set -e

echo "🔧 Fixing Hugging Face Hub installation..."
echo ""

# Initialize micromamba
eval "$(micromamba shell hook --shell bash)"

# Activate environment
echo "Activating ai-editing environment..."
micromamba activate ai-editing

# Check which pip we're using
echo ""
echo "Current pip location:"
which pip
pip --version

# Install huggingface-hub in the environment
echo ""
echo "Installing huggingface_hub in ai-editing environment..."
pip install --upgrade huggingface_hub

# Verify installation
echo ""
echo "Verifying installation..."
python -c "import huggingface_hub; print('✅ huggingface_hub version:', huggingface_hub.__version__)"

# Show correct CLI location
echo ""
echo "✅ Hugging Face CLI installed at:"
which huggingface-cli

echo ""
echo "To use it, run:"
echo "  micromamba activate ai-editing"
echo "  huggingface-cli login"
echo ""
