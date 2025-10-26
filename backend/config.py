from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


class Settings(BaseSettings):
    app_name: str = Field(default="AI Meme Video Editor")
    debug: bool = Field(default=False, env="AIVE_DEBUG")

    database_url: str = Field(default=f"sqlite:///{ROOT_DIR / 'ai_video_editor.db'}")
    redis_url: str = Field(default="redis://localhost:6379/0")

    media_root: Path = Field(default=ROOT_DIR / "media")
    ingest_dir: Path = Field(default=ROOT_DIR / "media" / "ingest")
    final_dir: Path = Field(default=ROOT_DIR / "media" / "final")
    captions_dir: Path = Field(default=ROOT_DIR / "media" / "captions")
    sfx_dir: Path = Field(default=ROOT_DIR / "media" / "sfx")
    consent_dir: Path = Field(default=ROOT_DIR / "media" / "consent")
    thumbnails_dir: Path = Field(default=ROOT_DIR / "media" / "thumbnails")

    whisper_model: str = Field(default="small.en")
    chat_backend: str = Field(default="stub")
    hf_text_model: str = Field(default="distilgpt2")

    template_path: Path = Field(default=ROOT_DIR / "backend" / "templates" / "realistic_chaos.yaml")

    cors_origins: str = Field(default="*")

    watermark_enabled: bool = Field(default=True)
    watermark_text: str = Field(default="ai-video-editor")

    log_level: str = Field(default="INFO")

    # AI Model Configuration (AIVE_ prefix added automatically)
    model_dummy: bool = Field(default=False)
    video_model_path: Path = Field(default=ROOT_DIR / "models" / "LTX-Video")
    image_edit_model_path: Path = Field(default=ROOT_DIR / "models" / "image-edit")
    video_max_frames: int = Field(default=16)
    video_default_width: int = Field(default=512)
    video_default_height: int = Field(default=512)

    # Hugging Face token (no AIVE_ prefix)
    hf_token: str = Field(default="", env="HF_TOKEN")

    # CUDA device (no AIVE_ prefix, system variable)
    cuda_visible_devices: str = Field(default="", env="CUDA_VISIBLE_DEVICES")

    model_config = SettingsConfigDict(
        env_prefix="AIVE_",
        env_file=str(ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",  # Allow extra fields in .env without errors
    )

    @field_validator(
        "media_root",
        "ingest_dir",
        "final_dir",
        "captions_dir",
        "sfx_dir",
        "consent_dir",
        "thumbnails_dir",
        "template_path",
        "video_model_path",
        "image_edit_model_path",
        mode="before",
    )
    @classmethod
    def _as_path(cls, value: Any) -> Path:
        if isinstance(value, Path):
            return value
        return Path(str(value))

    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return [item.strip() for item in raw.split(",") if item.strip()]
        if isinstance(parsed, list):
            return [str(item) for item in parsed]
        return [str(parsed)]

    def configure_logging(self) -> None:
        level = logging.DEBUG if self.debug else getattr(logging, self.log_level.upper(), logging.INFO)
        logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    for directory in (
        settings.media_root,
        settings.ingest_dir,
        settings.final_dir,
        settings.captions_dir,
        settings.sfx_dir,
        settings.consent_dir,
        settings.thumbnails_dir,
    ):
        directory.mkdir(parents=True, exist_ok=True)
    settings.configure_logging()
    return settings
