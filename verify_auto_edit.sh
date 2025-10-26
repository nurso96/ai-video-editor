#!/bin/bash
# Verify Auto-Edit Setup and Integration

set -e

echo "🔍 Verifying Auto-Edit Pipeline Setup"
echo "======================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Activate environment
echo -e "\n1️⃣  Activating micromamba environment..."
eval "$(micromamba shell hook --shell bash)"
micromamba activate ai-editing

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Environment activated${NC}"
else
    echo -e "${RED}❌ Failed to activate environment${NC}"
    exit 1
fi

# Test imports
echo -e "\n2️⃣  Testing Python imports..."
python3 << 'EOF'
import sys

errors = []
modules_to_test = [
    ('backend.services.auto_editor', 'Auto-Editor Service'),
    ('backend.routes.auto_edit', 'Auto-Edit Routes'),
    ('backend.app', 'FastAPI App'),
]

for module_name, display_name in modules_to_test:
    try:
        __import__(module_name)
        print(f'✅ {display_name}')
    except ImportError as e:
        errors.append((display_name, str(e)))
        print(f'❌ {display_name}: {e}')

if errors:
    print(f'\n⚠️  Import errors found!')
    sys.exit(1)
else:
    print('\n✅ All imports successful!')
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Import tests failed${NC}"
    exit 1
fi

# Check FFmpeg
echo -e "\n3️⃣  Checking FFmpeg installation..."
if command -v ffmpeg &> /dev/null; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
    echo -e "${GREEN}✅ $FFMPEG_VERSION${NC}"
else
    echo -e "${RED}❌ FFmpeg not found${NC}"
    echo "   Install with: sudo apt install ffmpeg"
    exit 1
fi

# Check media directories
echo -e "\n4️⃣  Checking media directory structure..."
MEDIA_DIR="/home/nick/ai-video-editor/media"

for dir in ingest final thumbnails captions sfx consent temp; do
    if [ -d "$MEDIA_DIR/$dir" ]; then
        FILE_COUNT=$(find "$MEDIA_DIR/$dir" -type f | wc -l)
        echo -e "${GREEN}✅ $dir/ ($FILE_COUNT files)${NC}"
    else
        echo -e "${YELLOW}⚠️  $dir/ (will be created on startup)${NC}"
    fi
done

# Verify routes registration
echo -e "\n5️⃣  Verifying auto-edit routes in app.py..."
if grep -q "auto_edit" /home/nick/ai-video-editor/backend/app.py; then
    echo -e "${GREEN}✅ auto_edit routes registered${NC}"
    grep "auto_edit" /home/nick/ai-video-editor/backend/app.py | sed 's/^/   /'
else
    echo -e "${RED}❌ auto_edit routes NOT found in app.py${NC}"
    exit 1
fi

# Test backend startup (dry run)
echo -e "\n6️⃣  Testing backend configuration..."
python3 << 'EOF'
from backend.config import get_settings

settings = get_settings()
print(f'✅ App name: {settings.app_name}')
print(f'✅ Media root: {settings.media_root}')
print(f'✅ Database URL: {settings.database_url}')
print(f'✅ Redis URL: {settings.redis_url}')
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Configuration test failed${NC}"
    exit 1
fi

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ AUTO-EDIT SETUP VERIFIED!${NC}"
echo ""
echo "📋 Available endpoints:"
echo "   POST /api/auto-edit/edit - Full editing with all features"
echo "   POST /api/auto-edit/quick-edit - Simple concatenation"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend: ./scripts/dev_all.sh"
echo "   2. Run test: python3 test_auto_edit.py"
echo "   3. Check API docs: http://localhost:8000/docs"
echo ""
