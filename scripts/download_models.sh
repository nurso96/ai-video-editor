#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODELS=("$@")
if [[ ${#MODELS[@]} -eq 0 ]]; then
  MODELS=("small.en")
fi

cd "${ROOT_DIR}" || exit 1

python3 - <<'PY' "$@"
import sys
from backend.services.captions import CaptionService

models = sys.argv[1:]
if not models:
    models = ["small.en"]

for name in models:
    print(f"Prefetching Whisper model: {name}")
    service = CaptionService(model_name=name)
    service._load_model()
print("Model prefetch complete.")
PY "${MODELS[@]}"
