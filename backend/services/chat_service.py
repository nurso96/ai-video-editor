from __future__ import annotations

import logging
from typing import Dict, Optional, Tuple

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)

try:  # Optional dependency
    from transformers import pipeline
except Exception:  # pragma: no cover - transformers optional
    pipeline = None


class ChatService:
    def __init__(self, backend: Optional[str] = None, hf_model: Optional[str] = None) -> None:
        settings = get_settings()
        self.backend = (backend or settings.chat_backend or "stub").lower()
        self.hf_model = hf_model or settings.hf_text_model
        self._hf_pipeline = None

    def _load_pipeline(self):
        if self._hf_pipeline is not None:
            return self._hf_pipeline
        if pipeline is None:
            raise RuntimeError("transformers is not installed")
        LOGGER.info("Loading Hugging Face pipeline for model %s", self.hf_model)
        self._hf_pipeline = pipeline("text-generation", model=self.hf_model)
        return self._hf_pipeline

    def generate_reply(self, prompt: str) -> str:
        if self.backend == "hf":
            try:
                generator = self._load_pipeline()
                output = generator(prompt, max_new_tokens=120, do_sample=True, temperature=0.8)
                if output:
                    return output[0]["generated_text"].strip()
            except Exception as exc:  # pragma: no cover - fallback path
                LOGGER.warning("HF backend failed: %s", exc)
        return self._stub_response(prompt)

    @staticmethod
    def _stub_response(prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "punch" in prompt_lower:
            suggestion = "Add a quick zoom punch-in on the beat drop, then drop a vine boom SFX with on-screen text for the punchline."
        elif "hook" in prompt_lower:
            suggestion = "Open with a bold caption over the first beat, use a fast zoom and call-to-action like 'wait for it...' to hook viewers."
        else:
            suggestion = "Layer captions that highlight the funniest words, sync them to detected beats, and add a subtle camera shake for extra energy."
        return f"Here's an edit idea: {suggestion}"


_SERVICE_CACHE: Dict[Tuple[str, str], ChatService] = {}


def get_chat_service(backend: Optional[str] = None, hf_model: Optional[str] = None) -> ChatService:
    key = ((backend or "stub").lower(), (hf_model or "").lower())
    if key not in _SERVICE_CACHE:
        _SERVICE_CACHE[key] = ChatService(backend=backend, hf_model=hf_model)
    return _SERVICE_CACHE[key]
