#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"
MEDIA_BASE="http://localhost:8000"
API_BASE="http://localhost:8000/api"

REDIS_PID=""
UVICORN_PID=""
FRONTEND_PID=""

cleanup() {
  echo "\nShutting down services..."
  if [[ -n "${FRONTEND_PID}" ]] && ps -p "${FRONTEND_PID}" > /dev/null 2>&1; then
    kill "${FRONTEND_PID}" || true
  fi
  if [[ -n "${UVICORN_PID}" ]] && ps -p "${UVICORN_PID}" > /dev/null 2>&1; then
    kill "${UVICORN_PID}" || true
  fi
  if [[ -n "${REDIS_PID}" ]] && ps -p "${REDIS_PID}" > /dev/null 2>&1; then
    kill "${REDIS_PID}" || true
  fi
}

trap cleanup EXIT

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis-cli not found. Please install Redis before running this script." >&2
  exit 1
fi

if redis-cli ping >/dev/null 2>&1; then
  echo "Redis already running; using existing instance."
else
  echo "Starting Redis server..."
  redis-server --save "" --appendonly no &
  REDIS_PID=$!
  sleep 1
fi

export NEXT_PUBLIC_API_BASE="${API_BASE}"
export NEXT_PUBLIC_MEDIA_BASE="/"
export UVICORN_RELOAD_DIRS="${BACKEND_DIR}"

cd "${ROOT_DIR}" || exit 1

echo "Launching FastAPI on ${API_BASE}" 
uvicorn backend.app:app --reload --port 8000 --log-level info &
UVICORN_PID=$!

if [[ -f "${FRONTEND_DIR}/package.json" ]]; then
  echo "Launching frontend dev server on http://localhost:3000"
  cd "${FRONTEND_DIR}" || exit 1
  set +e
  npm run dev -- --port 3000 &
  FRONTEND_PID=$!
  sleep 3
  if ! ps -p "${FRONTEND_PID}" >/dev/null 2>&1; then
    echo "Retrying frontend dev server without explicit port override."
    npm run dev &
    FRONTEND_PID=$!
  fi
  set -e
else
  echo "No frontend package.json found. Skipping frontend launch." >&2
fi

cd "${ROOT_DIR}" || exit 1

echo
echo "Backend: ${API_BASE}"
echo "Media:   ${MEDIA_BASE}/media"
if [[ -n "${FRONTEND_PID}" ]]; then
  echo "Frontend: http://localhost:3000"
fi

echo "Press Ctrl+C to stop."

while true; do
  if [[ -n "${UVICORN_PID}" ]] && ! ps -p "${UVICORN_PID}" >/dev/null 2>&1; then
    echo "Uvicorn process exited."
    break
  fi
  if [[ -n "${FRONTEND_PID}" ]] && ! ps -p "${FRONTEND_PID}" >/dev/null 2>&1; then
    echo "Frontend process exited."
    break
  fi
  sleep 2
done
