#!/usr/bin/env bash

set -euo pipefail

ENV_NAME="ai-editing"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/environment.yml"
REQ_FILE="${PROJECT_ROOT}/conda-requirements.txt"

if ! command -v conda >/dev/null 2>&1; then
  echo "Conda is not available on PATH. Please install Miniconda or Anaconda first." >&2
  exit 1
fi

# Enable the conda shell functions within this script
eval "$(conda shell.bash hook)"

# Fully deactivate any stacked environments (disabling nounset to appease deactivate scripts)
set +u
while [[ -n "${CONDA_PREFIX:-}" ]]; do
  conda deactivate || break
done
set -u

if conda env list | awk '{print $1}' | grep -Fxq "${ENV_NAME}"; then
  echo "Updating existing environment '${ENV_NAME}' from ${ENV_FILE}"
  conda env update --name "${ENV_NAME}" --file "${ENV_FILE}" --prune
else
  echo "Creating environment '${ENV_NAME}' from ${ENV_FILE}"
  conda env create --file "${ENV_FILE}"
fi

echo "Activating environment '${ENV_NAME}'"
conda activate "${ENV_NAME}"

echo "Installing project requirements via conda"
conda install -y --file "${REQ_FILE}"

echo "Ensuring openai-whisper is available via pip"
pip install --upgrade --no-cache-dir openai-whisper >/dev/null

echo
echo "Environment '${ENV_NAME}' is active and ready."
echo "To deactivate later, run: conda deactivate"
