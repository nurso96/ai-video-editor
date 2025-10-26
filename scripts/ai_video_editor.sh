#!/usr/bin/env bash
set -euo pipefail

# AI Video Editor launcher (full-stack)
# - Starts Redis (or reuses running instance)
# - Starts FastAPI backend (Uvicorn)
# - Starts frontend dev server when package.json exists
# - Logs to ./logs and restarts crashed processes with limited retries
#
# Usage:
#   scripts/ai_video_editor.sh [--no-frontend] [--port 8000] [--front-port 3000] [--log-dir logs] [--retries 3] [--env .env]
#
# Environment:
#   NEXT_PUBLIC_API_BASE (default http://localhost:<port>/api)
#   NEXT_PUBLIC_MEDIA_BASE (default /)
#   AIVE_DEBUG (optional; set to 1 for more logging)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
BACKEND_DIR="${ROOT_DIR}/backend"
LOG_DIR="${ROOT_DIR}/logs"
API_PORT=8000
FRONT_PORT=3000
START_FRONTEND=1
RETRIES=3
ENV_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-frontend) START_FRONTEND=0; shift ;;
    --port) API_PORT="${2}"; shift 2 ;;
    --front-port) FRONT_PORT="${2}"; shift 2 ;;
    --log-dir) LOG_DIR="${2}"; shift 2 ;;
    --retries) RETRIES="${2}"; shift 2 ;;
    --env) ENV_FILE="${2}"; shift 2 ;;
    -h|--help)
      echo "Usage: $0 [--no-frontend] [--port 8000] [--front-port 3000] [--log-dir logs] [--retries 3] [--env .env]"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "${LOG_DIR}"
timestamp() { date +"%Y-%m-%d_%H-%M-%S"; }

API_BASE="http://localhost:${API_PORT}/api"
export NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-${API_BASE}}"
export NEXT_PUBLIC_MEDIA_BASE="${NEXT_PUBLIC_MEDIA_BASE:-/}"
export UVICORN_RELOAD_DIRS="${BACKEND_DIR}"

if [[ -n "${ENV_FILE}" && -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

info() { echo "[INFO] $*"; }
warn() { echo "[WARN] $*" >&2; }
err()  { echo "[ERR ] $*" >&2; }

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Missing required command: $1"; return 1
  fi
}

need_cmd python3 || true
need_cmd uvicorn || { err "Install uvicorn (pip install uvicorn)"; exit 1; }
need_cmd redis-cli || { err "Install Redis (redis-cli not found)."; exit 1; }
if [[ ${START_FRONTEND} -eq 1 ]]; then
  command -v npm >/dev/null 2>&1 || warn "npm not found; frontend will be skipped."
fi

REDIS_PID=""; UVICORN_PID=""; FRONTEND_PID=""; START_TS="$(timestamp)"
REDIS_LOG="${LOG_DIR}/redis_${START_TS}.log"
BACKEND_LOG="${LOG_DIR}/backend_${START_TS}.log"
FRONTEND_LOG="${LOG_DIR}/frontend_${START_TS}.log"
MASTER_LOG="${LOG_DIR}/ai-video-editor_${START_TS}.log"

touch "${MASTER_LOG}"; exec > >(tee -a "${MASTER_LOG}") 2>&1

cleanup() {
  info "Shutting down services..."
  [[ -n "${FRONTEND_PID}" && -e /proc/${FRONTEND_PID} ]] && kill "${FRONTEND_PID}" 2>/dev/null || true
  [[ -n "${UVICORN_PID}" && -e /proc/${UVICORN_PID}  ]] && kill "${UVICORN_PID}" 2>/dev/null  || true
  [[ -n "${REDIS_PID}" && -e /proc/${REDIS_PID}     ]] && kill "${REDIS_PID}" 2>/dev/null     || true
}
trap cleanup EXIT INT TERM

start_redis() {
  if redis-cli ping >/dev/null 2>&1; then
    info "Redis already running; reusing existing instance."
    return 0
  fi
  info "Starting transient Redis (no persistence). Logs: ${REDIS_LOG}"
  set +e
  (redis-server --save "" --appendonly no >>"${REDIS_LOG}" 2>&1 & echo $! >"${LOG_DIR}/redis.pid")
  set -e
  REDIS_PID="$(cat "${LOG_DIR}/redis.pid" 2>/dev/null || true)"
  sleep 1
  if ! redis-cli ping >/dev/null 2>&1; then
    err "Failed to start Redis (see ${REDIS_LOG})."
    return 1
  fi
  return 0
}

run_with_restarts() {
  # $1 = label, $2..=cmd
  local label="$1"; shift
  local attempts=0
  local max_attempts=${RETRIES}
  local backoff=2
  while true; do
    attempts=$((attempts+1))
    info "Starting ${label} (attempt ${attempts}/${max_attempts})"
    ("$@") &
    local pid=$!
    case "${label}" in
      backend) UVICORN_PID=${pid} ;;
      frontend) FRONTEND_PID=${pid} ;;
    esac
    wait ${pid}
    local code=$?
    if [[ ${code} -eq 0 ]]; then
      info "${label} exited cleanly."
      return 0
    fi
    warn "${label} crashed with code ${code}."
    if [[ ${attempts} -ge ${max_attempts} ]]; then
      err "${label} reached max retries (${max_attempts}); giving up."
      return ${code}
    fi
    info "Restarting ${label} after ${backoff}s..."
    sleep ${backoff}
    backoff=$((backoff*2)); if [[ ${backoff} -gt 30 ]]; then backoff=30; fi
  done
}

start_backend() {
  info "Launching FastAPI on http://localhost:${API_PORT} (logs: ${BACKEND_LOG})"
  cd "${ROOT_DIR}" || exit 1
  run_with_restarts backend bash -c "uvicorn backend.app:app --host 0.0.0.0 --port ${API_PORT} --log-level info >>\"${BACKEND_LOG}\" 2>&1"
}

start_frontend() {
  if [[ ${START_FRONTEND} -ne 1 ]]; then
    info "Frontend disabled by flag."
    return 0
  fi
  if [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
    warn "No frontend package.json; skipping frontend launch."
    return 0
  fi
  if ! command -v npm >/dev/null 2>&1; then
    warn "npm not available; skipping frontend."
    return 0
  fi
  info "Launching frontend dev server on http://localhost:${FRONT_PORT} (logs: ${FRONTEND_LOG})"
  (cd "${FRONTEND_DIR}" && npm run dev -- --port "${FRONT_PORT}" >>"${FRONTEND_LOG}" 2>&1)
}

main() {
  info "AI-Video-Editor starting up..."
  start_redis || { err "Redis failed to start."; exit 1; }
  start_backend &
  BACK_PID=$!
  start_frontend &
  FRONT_PID=$!

  info "Backend: http://localhost:${API_PORT}/api"
  info "Media:   http://localhost:${API_PORT}/media"
  if [[ ${START_FRONTEND} -eq 1 && -f "${FRONTEND_DIR}/package.json" ]]; then
    info "Frontend: http://localhost:${FRONT_PORT}"
  fi
  info "Logs: ${LOG_DIR} (master: ${MASTER_LOG})"
  info "Press Ctrl+C to stop."

  # Wait on child starters; they manage their own restarts
  wait ${BACK_PID} || true
  wait ${FRONT_PID} || true
}

main "$@"

