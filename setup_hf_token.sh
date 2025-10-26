#!/bin/bash
# Secure Hugging Face Token Setup
# This script helps you safely configure your HF token without exposing it to git

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 Secure Hugging Face Token Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

PROJECT_DIR="/home/nick/ai-video-editor"
ENV_FILE="$PROJECT_DIR/.env"
HF_TOKEN_FILE="$HOME/.cache/huggingface/token"

# Step 1: Verify .env is in .gitignore
echo -e "${YELLOW}Step 1: Verifying security settings...${NC}"
if ! grep -q "^\.env$" "$PROJECT_DIR/.gitignore"; then
    echo -e "${RED}❌ .env not found in .gitignore - adding it now!${NC}"
    echo ".env" >> "$PROJECT_DIR/.gitignore"
else
    echo -e "${GREEN}✅ .env is safely in .gitignore${NC}"
fi

# Verify old token files are gitignored
if ! grep -q "fix_hf_token.sh" "$PROJECT_DIR/.gitignore"; then
    echo -e "${YELLOW}⚠️  Adding old token script to .gitignore${NC}"
    echo "fix_hf_token.sh" >> "$PROJECT_DIR/.gitignore"
fi

echo ""

# Step 2: Activate environment
echo -e "${YELLOW}Step 2: Activating micromamba environment...${NC}"
eval "$(micromamba shell hook --shell bash)"
micromamba activate ai-editing

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Environment activated${NC}"
else
    echo -e "${RED}❌ Failed to activate environment${NC}"
    exit 1
fi

echo ""

# Step 3: Run huggingface-cli login
echo -e "${YELLOW}Step 3: Logging into Hugging Face...${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📝 Instructions:${NC}"
echo -e "${BLUE}1. Go to: https://huggingface.co/settings/tokens${NC}"
echo -e "${BLUE}2. Click 'New token' or use existing token${NC}"
echo -e "${BLUE}3. Copy your token (starts with 'hf_')${NC}"
echo -e "${BLUE}4. Paste it below when prompted${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Run huggingface-cli login
huggingface-cli login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Login failed. Please try again.${NC}"
    exit 1
fi

echo ""

# Step 4: Read token from cache
echo -e "${YELLOW}Step 4: Reading token from Hugging Face cache...${NC}"

if [ ! -f "$HF_TOKEN_FILE" ]; then
    echo -e "${RED}❌ Token file not found at $HF_TOKEN_FILE${NC}"
    echo -e "${RED}   Login may have failed.${NC}"
    exit 1
fi

HF_TOKEN=$(cat "$HF_TOKEN_FILE" | tr -d '[:space:]')

if [ -z "$HF_TOKEN" ]; then
    echo -e "${RED}❌ Token is empty${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token retrieved from cache${NC}"
echo -e "${GREEN}   Token: ${HF_TOKEN:0:7}...${HF_TOKEN: -4}${NC}"

echo ""

# Step 5: Update .env file
echo -e "${YELLOW}Step 5: Updating .env file...${NC}"

# Create .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file doesn't exist - creating it${NC}"
    cat > "$ENV_FILE" <<EOF
# AI Video Editor - Environment Configuration
# This file is in .gitignore and will NOT be committed to git

# Hugging Face Token - DO NOT SHARE OR COMMIT
HF_TOKEN=$HF_TOKEN

# CUDA Configuration
CUDA_VISIBLE_DEVICES=1

# AI Model Configuration
AIVE_MODEL_DUMMY=false
AIVE_CHAT_BACKEND=hf
AIVE_HF_TEXT_MODEL=distilgpt2
AIVE_WHISPER_MODEL=small.en

# Model Paths
AIVE_VIDEO_MODEL_PATH=/home/nick/ai-video-editor/models/LTX-Video

# Multi-LLM Models
HF_PLANNER_MODEL=meta-llama/Llama-3.2-3B-Instruct
HF_CHAT_MODEL=mistralai/Mistral-7B-Instruct-v0.2
HF_EDITOR_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_SCRIPTER_MODEL=meta-llama/Llama-3.2-1B-Instruct

# Social Media APIs (add your credentials)
# YOUTUBE_CLIENT_SECRET_FILE=/path/to/client_secret.json
# TIKTOK_CLIENT_KEY=your_client_key
# TIKTOK_CLIENT_SECRET=your_client_secret
EOF
    echo -e "${GREEN}✅ Created .env file with token${NC}"
else
    # Update existing .env
    if grep -q "^HF_TOKEN=" "$ENV_FILE"; then
        # Replace existing token
        sed -i "s|^HF_TOKEN=.*|HF_TOKEN=$HF_TOKEN|" "$ENV_FILE"
        echo -e "${GREEN}✅ Updated HF_TOKEN in existing .env${NC}"
    else
        # Add token
        echo "" >> "$ENV_FILE"
        echo "# Hugging Face Token" >> "$ENV_FILE"
        echo "HF_TOKEN=$HF_TOKEN" >> "$ENV_FILE"
        echo -e "${GREEN}✅ Added HF_TOKEN to .env${NC}"
    fi
fi

echo ""

# Step 6: Set environment variables for current session
echo -e "${YELLOW}Step 6: Setting environment variables...${NC}"
export HF_TOKEN="$HF_TOKEN"
export HUGGING_FACE_HUB_TOKEN="$HF_TOKEN"
echo -e "${GREEN}✅ Environment variables set for current session${NC}"

echo ""

# Step 7: Verify authentication
echo -e "${YELLOW}Step 7: Verifying authentication...${NC}"
python3 << EOF
from huggingface_hub import HfApi
import sys

api = HfApi()
try:
    user = api.whoami()
    print(f"${GREEN}✅ Successfully authenticated!${NC}")
    print(f"${GREEN}   Username: {user['name']}${NC}")
    print(f"${GREEN}   Email: {user.get('email', 'N/A')}${NC}")
except Exception as e:
    print(f"${RED}❌ Authentication failed: {e}${NC}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Verification failed${NC}"
    exit 1
fi

echo ""

# Step 8: Security check
echo -e "${YELLOW}Step 8: Running security checks...${NC}"

# Check if .env is staged or committed
if git ls-files --error-unmatch .env 2>/dev/null; then
    echo -e "${RED}❌ WARNING: .env is tracked by git!${NC}"
    echo -e "${YELLOW}   Running: git rm --cached .env${NC}"
    git rm --cached .env 2>/dev/null || true
    echo -e "${GREEN}✅ Removed .env from git tracking${NC}"
else
    echo -e "${GREEN}✅ .env is not tracked by git${NC}"
fi

# Check for hardcoded tokens in tracked files
echo -e "${YELLOW}   Checking for hardcoded tokens in git...${NC}"
if git grep -q "hf_[a-zA-Z0-9]\{34\}" 2>/dev/null; then
    echo -e "${RED}❌ WARNING: Found hardcoded tokens in git history!${NC}"
    echo -e "${YELLOW}   Files with tokens:${NC}"
    git grep -l "hf_[a-zA-Z0-9]\{34\}" | sed 's/^/      /'
    echo ""
    echo -e "${YELLOW}   ⚠️  These files should be removed from git history!${NC}"
    echo -e "${YELLOW}   Run this command to see the tokens:${NC}"
    echo -e "${YELLOW}   git grep 'hf_' ${NC}"
else
    echo -e "${GREEN}✅ No hardcoded tokens found in tracked files${NC}"
fi

echo ""

# Step 9: Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}Your HF token is now configured in:${NC}"
echo -e "  1. ${BLUE}~/.cache/huggingface/token${NC} (for huggingface-cli)"
echo -e "  2. ${BLUE}$ENV_FILE${NC} (for backend)"
echo -e "  3. ${BLUE}Environment variables${NC} (for current session)"
echo ""
echo -e "${YELLOW}📝 Important Notes:${NC}"
echo -e "  • Your token is ${GREEN}safely stored${NC} and ${GREEN}NOT in git${NC}"
echo -e "  • To use in new terminals: ${BLUE}micromamba activate ai-editing${NC}"
echo -e "  • Backend will auto-load token from .env"
echo -e "  • If token is invalidated, just run this script again"
echo ""
echo -e "${YELLOW}🔒 Security:${NC}"
echo -e "  • ${GREEN}.env is in .gitignore${NC} - won't be committed"
echo -e "  • Token stored in HuggingFace cache - secure"
echo -e "  • Never share your token or commit it to git"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "  1. Start backend: ${BLUE}./scripts/dev_all.sh${NC}"
echo -e "  2. Test AI models: ${BLUE}python3 backend/test_load_ltx.py${NC}"
echo -e "  3. Check your tokens: ${BLUE}https://huggingface.co/settings/tokens${NC}"
echo ""
