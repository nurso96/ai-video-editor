#!/bin/bash
# Fix Hugging Face Token Configuration

set -e

echo "🔧 Fixing Hugging Face Token Setup"
echo "===================================="
echo ""

# Update .env with your actual token
echo "Step 1: Updating .env file..."
cd /home/nick/ai-video-editor

# Uncomment and set HF_TOKEN in .env
if grep -q "# HF_TOKEN=your_token_here" .env; then
    sed -i 's/# HF_TOKEN=your_token_here/HF_TOKEN=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/' .env
    echo "✅ HF_TOKEN set in .env"
else
    echo "✅ HF_TOKEN already configured"
fi

# Update cached token
echo ""
echo "Step 2: Updating cached token..."
echo "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" > ~/.cache/huggingface/token
echo "✅ Token cached for huggingface-cli"

# Set for current session
echo ""
echo "Step 3: Setting for current session..."
export HF_TOKEN="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"
export HUGGING_FACE_HUB_TOKEN="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"
echo "✅ Environment variables set"

# Verify
echo ""
echo "Step 4: Verifying setup..."
eval "$(micromamba shell hook --shell bash)"
micromamba activate ai-editing
python - <<'EOF'
from huggingface_hub import HfApi
api = HfApi()
try:
    user = api.whoami()
    print(f"✅ Logged in as: {user['name']}")
except Exception as e:
    print(f"❌ Authentication failed: {e}")
EOF

echo ""
echo "===================================="
echo "✅ Setup complete!"
echo ""
echo "Your token is now configured in:"
echo "  1. .env file (for backend)"
echo "  2. ~/.cache/huggingface/token (for CLI)"
echo "  3. Environment variables (for current session)"
echo ""
echo "To use in new terminals, run:"
echo "  micromamba activate ai-editing"
echo "  export HF_TOKEN=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"
echo ""
