#!/usr/bin/env bash
set -euo pipefail

# Install a user-level CLI launcher named `ai-video-editor` that runs the full-stack script.
# By default, installs to ~/.local/bin (create if missing) and does not require sudo.
# Usage:
#   scripts/install_cli.sh [--bin ~/.local/bin] [--add-alias]

BIN_DIR="$HOME/.local/bin"
ADD_ALIAS=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --bin) BIN_DIR="$2"; shift 2 ;;
    --add-alias) ADD_ALIAS=1; shift ;;
    -h|--help) echo "Usage: $0 [--bin ~/.local/bin]"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${ROOT_DIR}/scripts/ai_video_editor.sh"
DEST_DIR="${BIN_DIR}"
DEST="${DEST_DIR}/ai-video-editor"

mkdir -p "${DEST_DIR}"
cp "${SRC}" "${DEST}"
chmod +x "${DEST}"

echo
echo "Installed CLI: ${DEST}"
echo "Run: ai-video-editor --help"
echo
echo "If not already in PATH, add the following line to your shell rc (e.g., ~/.bashrc):"
echo "  export PATH=\"${DEST_DIR}:\$PATH\""

if [[ ${ADD_ALIAS} -eq 1 ]]; then
  RC_FILE="$HOME/.bashrc"
  if [[ -n "${ZSH_VERSION:-}" ]]; then RC_FILE="$HOME/.zshrc"; fi
  echo "alias AI-Video-Editor='ai-video-editor'" >> "${RC_FILE}"
  echo "Added alias 'AI-Video-Editor' to ${RC_FILE}. You can run 'AI-Video-Editor' or 'ai-video-editor'."
fi
