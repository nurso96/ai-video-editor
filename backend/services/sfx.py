from __future__ import annotations

import json
import logging
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import librosa

from backend.config import get_settings

LOGGER = logging.getLogger(__name__)
SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".ogg", ".flac"}


@dataclass
class SFXItem:
    name: str
    path: Path
    duration: float
    tags: List[str]


class SFXLibrary:
    def __init__(self, root: Optional[Path] = None) -> None:
        settings = get_settings()
        self.root = root or settings.sfx_dir
        self.root.mkdir(parents=True, exist_ok=True)
        self._catalog: Dict[str, SFXItem] = {}
        self.reload()

    def reload(self) -> None:
        self._catalog.clear()
        for path in self._iter_audio_files(self.root):
            name = path.stem
            tags = sorted(set(name.replace("_", " ").split()))
            try:
                duration = librosa.get_duration(filename=str(path))
            except Exception as exc:  # pragma: no cover - if metadata fails we still include item
                LOGGER.debug("Failed to read duration for %s: %s", path, exc)
                duration = 0.0
            self._catalog[name] = SFXItem(name=name, path=path, duration=duration, tags=tags)

    def _iter_audio_files(self, directory: Path) -> Iterable[Path]:
        for candidate in directory.rglob("*"):
            if candidate.is_file() and candidate.suffix.lower() in SUPPORTED_EXTENSIONS:
                yield candidate

    def list(self) -> List[SFXItem]:
        return sorted(self._catalog.values(), key=lambda item: item.name)

    def get(self, name: str) -> Optional[SFXItem]:
        return self._catalog.get(name)

    def get_random_sfx(self, tag: Optional[str] = None) -> Optional[SFXItem]:
        if not self._catalog:
            return None
        if tag:
            filtered = [item for item in self._catalog.values() if tag.lower() in {t.lower() for t in item.tags}]
            if filtered:
                return random.choice(filtered)
        return random.choice(list(self._catalog.values()))

    def ensure_for_effect(self, effect: str) -> Optional[SFXItem]:
        if effect.startswith("sfx:"):
            _, _, name = effect.partition(":")
            return self.get(name) or self.get_random_sfx(name)
        return None

    def export_catalog(self, output_path: Path) -> None:
        payload = {
            "items": [
                {
                    "name": item.name,
                    "path": str(item.path),
                    "duration": item.duration,
                    "tags": item.tags,
                }
                for item in self.list()
            ]
        }
        output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        LOGGER.info("Exported SFX catalog with %d items to %s", len(payload["items"]), output_path)
