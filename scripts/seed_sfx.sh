#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="${ROOT_DIR}/runtime/sfx"
DEST_DIR="${ROOT_DIR}/media/sfx"
CATALOG_PATH="${DEST_DIR}/catalog.json"

if [[ ! -d "${RUNTIME_DIR}" ]]; then
  echo "Runtime SFX directory not found at ${RUNTIME_DIR}." >&2
  exit 1
fi

mkdir -p "${DEST_DIR}"

shopt -s nullglob
for file in "${RUNTIME_DIR}"/*.{wav,mp3,ogg,flac}; do
  base="$(basename "${file}")"
  if [[ ! -f "${DEST_DIR}/${base}" ]]; then
    cp "${file}" "${DEST_DIR}/${base}"
    echo "Copied ${base}"
  fi
done
shopt -u nullglob

cd "${ROOT_DIR}"

python3 - <<'PY'
from backend.services.sfx import SFXLibrary
from pathlib import Path

library = SFXLibrary()
library.reload()
library.export_catalog(Path("${CATALOG_PATH}"))
PY

echo "SFX catalog refreshed at ${CATALOG_PATH}."
