#!/bin/bash
# Startup script for AI Video Editor Backend

set -e

echo "=================================="
echo "AI Video Editor Backend Startup"
echo "=================================="
echo

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version"
echo

# Check Redis
echo "Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not running"
    echo "  Please start Redis: redis-server"
    echo "  Or install Redis:"
    echo "    Ubuntu: sudo apt-get install redis-server"
    echo "    macOS: brew install redis"
    exit 1
fi
echo

# Check FFmpeg
echo "Checking FFmpeg..."
if command -v ffmpeg > /dev/null 2>&1; then
    ffmpeg_version=$(ffmpeg -version 2>&1 | head -n 1)
    echo "✓ $ffmpeg_version"
else
    echo "✗ FFmpeg not found"
    echo "  Please install FFmpeg:"
    echo "    Ubuntu: sudo apt-get install ffmpeg"
    echo "    macOS: brew install ffmpeg"
    exit 1
fi
echo

# Check if virtual environment exists
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    echo "No virtual environment found. Creating one..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
    echo "✓ Virtual environment activated"
elif [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
    echo "✓ Virtual environment activated"
fi
echo

# Install dependencies
echo "Checking dependencies..."
if ! python3 -c "import fastapi" > /dev/null 2>&1; then
    echo "Installing dependencies..."
    pip install -q -r requirements.txt
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi
echo

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating default .env file..."
    cat > .env << EOF
# AI Video Editor Configuration
AIVE_DEBUG=false
AIVE_LOG_LEVEL=INFO

# Database
AIVE_DATABASE_URL=sqlite:///ai_video_editor.db

# Redis
AIVE_REDIS_URL=redis://localhost:6379/0

# AI Models
AIVE_WHISPER_MODEL=small.en
AIVE_CHAT_BACKEND=stub
AIVE_HF_TEXT_MODEL=distilgpt2

# Watermark
AIVE_WATERMARK_ENABLED=true
AIVE_WATERMARK_TEXT=ai-video-editor

# CORS (use specific origins in production)
AIVE_CORS_ORIGINS=*
EOF
    echo "✓ Default .env file created"
    echo "  Edit .env to customize settings"
else
    echo "✓ .env file exists"
fi
echo

# Initialize database
echo "Initializing database..."
python3 -c "from backend.database import init_db; init_db()" > /dev/null 2>&1
echo "✓ Database initialized"
echo

# Show configuration
echo "=================================="
echo "Configuration:"
echo "=================================="
echo "Database: SQLite (ai_video_editor.db)"
echo "Redis: localhost:6379"
echo "API Port: 8000"
echo "API URL: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Media Root: $(pwd)/media"
echo

# Ask if user wants to run demo
read -p "Run workflow demo to verify installation? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo
    echo "Running workflow demo..."
    echo "=================================="
    python3 demo_workflow.py 2>&1 | grep -v "^2025-" | grep -v "^W0000" | grep -v "^E0000" | grep -v "WARNING:" | grep -v "TensorFlow"
    echo
fi

# Start the server
echo "=================================="
echo "Starting FastAPI server..."
echo "=================================="
echo
echo "Server will be available at:"
echo "  • API: http://localhost:8000"
echo "  • Docs: http://localhost:8000/docs"
echo "  • Health: http://localhost:8000/api/healthz"
echo
echo "Press Ctrl+C to stop the server"
echo
echo "=================================="
echo

# Run the server
cd "$(dirname "$0")"
uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
