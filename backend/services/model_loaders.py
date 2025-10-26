from __future__ import annotations

"""
Model loader utilities for video/photo generation.

This module provides lightweight loader classes which either:
- Load a real model from `models/<model-name>` (downloading from Hugging Face if missing), or
- Fall back to a fast, CPU-only dummy generator for tests and low-resource environments.

VRAM, resolution, batch trade-offs (guidelines):
- Text-to-video models (e.g., LTX-Video, HunyuanVideo) typically demand 12–24GB+ VRAM
  for 512x512 @ 8–16 frames with reasonable speed. Higher resolution and longer clips
  scale memory roughly linearly with pixel count and frames (and nonlinearly with batch size).
- If running on CPU or limited VRAM, use lower resolutions (e.g., 360x640 vertical) and
  fewer frames (e.g., 8–16 frames, 1–2s at ~8 fps) and batch size 1.
- For batch generation, memory usage increases with batch size; prefer sequential batches
  if you encounter OOM.

The dummy mode is triggered when:
- `use_dummy=True` is passed to the loader, OR
- The `AIVE_MODEL_DUMMY` environment variable is truthy, OR
- The required libraries cannot be imported.

Dummy generation creates small placeholder outputs:
- Video: solid color clip with requested size/length (via MoviePy ColorClip)
- Image: PIL-generated image with a simple gradient or solid color
These are sufficient for integration tests and API plumbing without heavyweight models.
"""

import os
import random
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

try:
    from huggingface_hub import snapshot_download  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    snapshot_download = None  # type: ignore

try:  # pragma: no cover - optional heavy deps
    import torch  # noqa: F401
except Exception:  # pragma: no cover - optional
    torch = None  # type: ignore

try:
    from moviepy.editor import ColorClip  # type: ignore
except Exception:  # pragma: no cover - fallback import path
    ColorClip = None  # type: ignore

try:
    from PIL import Image
except Exception:  # pragma: no cover - optional
    Image = None  # type: ignore

from backend.config import get_settings


@dataclass
class GenerationResult:
    path: Path


class BaseModelLoader:
    def __init__(self, model_name: str, use_dummy: Optional[bool] = None) -> None:
        self.settings = get_settings()
        self.model_name = model_name
        self.models_dir = Path(self.settings.media_root).parent / "models"
        self.model_dir = self.models_dir / model_name
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.use_dummy = bool(
            use_dummy
            or os.getenv("AIVE_MODEL_DUMMY")
            or (snapshot_download is None)
        )

    def ensure_model(self, repo_id: Optional[str] = None, revision: Optional[str] = None) -> Path:
        if self.use_dummy:
            self.model_dir.mkdir(parents=True, exist_ok=True)
            return self.model_dir
        if self.model_dir.exists():
            return self.model_dir
        if not repo_id or snapshot_download is None:
            # Nothing we can do without hub access – fallback to dummy
            self.use_dummy = True
            self.model_dir.mkdir(parents=True, exist_ok=True)
            return self.model_dir
        # Attempt to download from Hugging Face Hub
        local_path = snapshot_download(repo_id=repo_id, revision=revision)
        # Place under models/<model_name>
        src = Path(local_path)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        # Avoid copying large trees if possible; just remember the path
        # For simplicity, store a pointer file
        (self.model_dir / "HF_SNAPSHOT_PATH.txt").write_text(str(src), encoding="utf-8")
        return self.model_dir

    def generate(self, prompt: str, **kwargs) -> Path:  # pragma: no cover - abstract
        raise NotImplementedError


class LTXVideoLoader(BaseModelLoader):
    """Loader for LTX-Video style text-to-video models.

    In real mode, this would initialize the diffusion pipeline and perform inference.
    In dummy mode, it generates a small solid-color video clip using MoviePy.
    """

    def __init__(self, model_name: str = "ltx-video", use_dummy: Optional[bool] = None) -> None:
        super().__init__(model_name=model_name, use_dummy=use_dummy)

    def generate(
        self,
        prompt: str,
        *,
        width: int = 360,
        height: int = 640,
        length_seconds: float = 2.0,
        fps: int = 8,
        seed: Optional[int] = None,
        **_: object,
    ) -> Path:
        self.ensure_model(repo_id=None)
        output_dir = self.settings.final_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        fname = f"gen_ltx_{timestamp}_{abs(hash(prompt)) % 9999}.mp4"
        out_path = output_dir / fname

        if self.use_dummy or ColorClip is None:
            # Dummy video: single-color clip with deterministic color by seed
            rng = random.Random(seed)
            color = (rng.randint(0, 255), rng.randint(0, 255), rng.randint(0, 255))
            if ColorClip is None:
                # Fallback: create an empty file if moviepy missing
                out_path.write_bytes(b"")
                return out_path
            clip = ColorClip(size=(width, height), color=color, duration=max(0.2, float(length_seconds)))
            try:
                clip.write_videofile(
                    str(out_path),
                    fps=fps,
                    codec="libx264",
                    audio=False,
                    preset="ultrafast",
                    threads=2,
                    logger=None,
                )
            finally:
                clip.close()
            return out_path

        # Real LTX-Video model inference using diffusers
        try:
            from diffusers import LTXPipeline
            import logging

            logger = logging.getLogger(__name__)
            logger.info(f"Loading LTX-Video pipeline from {self.model_dir}")

            # Load pipeline with GPU support
            pipe = LTXPipeline.from_pretrained(
                str(self.model_dir),
                torch_dtype=torch.float16 if torch and torch.cuda.is_available() else torch.float32,
            )

            if torch and torch.cuda.is_available():
                pipe = pipe.to("cuda")
                logger.info("LTX-Video pipeline loaded on CUDA")
            else:
                logger.warning("CUDA not available, using CPU (will be slow)")

            # Set seed for reproducibility
            if seed is not None:
                generator = torch.Generator(device=pipe.device).manual_seed(seed)
            else:
                generator = None

            # Calculate number of frames from length and fps
            num_frames = int(length_seconds * fps)

            # Generate video
            logger.info(f"Generating video: {width}x{height}, {num_frames} frames, prompt: {prompt[:50]}...")
            output = pipe(
                prompt=prompt,
                height=height,
                width=width,
                num_frames=num_frames,
                generator=generator,
            )

            # Save the video
            video_frames = output.frames[0]  # Get first video in batch

            # Use imageio to save frames as video
            import imageio
            imageio.mimsave(str(out_path), video_frames, fps=fps, codec='libx264')

            logger.info(f"Video saved to {out_path}")
            return out_path

        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to load LTX-Video model: {e}")
            logger.warning("Falling back to dummy video generation")
            # Fallback to dummy output if model loading fails
            return LTXVideoLoader(model_name=self.model_name, use_dummy=True).generate(
                prompt, width=width, height=height, length_seconds=length_seconds, fps=fps, seed=seed
            )


class HunyuanVideoLoader(BaseModelLoader):
    """Loader for HunyuanVideo text-to-video models with similar semantics.

    Dummy mode mirrors LTX behavior; real mode would initialize the proper pipeline.
    """

    def __init__(self, model_name: str = "hunyuan-video", use_dummy: Optional[bool] = None) -> None:
        super().__init__(model_name=model_name, use_dummy=use_dummy)

    def generate(
        self,
        prompt: str,
        *,
        width: int = 360,
        height: int = 640,
        length_seconds: float = 2.0,
        fps: int = 8,
        seed: Optional[int] = None,
        **kwargs: object,
    ) -> Path:
        # Reuse LTX implementation for dummy behavior
        return LTXVideoLoader(model_name=self.model_name, use_dummy=self.use_dummy).generate(
            prompt, width=width, height=height, length_seconds=length_seconds, fps=fps, seed=seed, **kwargs
        )


class ImageEditLoader(BaseModelLoader):
    """Simple image edit loader (dummy-friendly).

    In dummy mode, creates or lightly modifies an image using PIL. In a real
    integration, this would initialize an inpainting or diffusion pipeline.
    """

    def __init__(self, model_name: str = "image-edit", use_dummy: Optional[bool] = None) -> None:
        super().__init__(model_name=model_name, use_dummy=use_dummy)

    def generate(
        self,
        prompt: str,
        *,
        base_image: Optional[Path] = None,
        width: int = 512,
        height: int = 512,
        seed: Optional[int] = None,
        **_: object,
    ) -> Path:
        self.ensure_model(repo_id=None)
        output_dir = self.settings.final_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        fname = f"edit_{timestamp}_{abs(hash(prompt)) % 9999}.png"
        out_path = output_dir / fname

        if Image is None:
            # Minimal fallback: create an empty file
            out_path.write_bytes(b"")
            return out_path

        rng = random.Random(seed)
        if self.use_dummy or base_image is None or not Path(base_image).exists():
            # Create a new image with a basic gradient-like fill
            img = Image.new("RGB", (max(8, width), max(8, height)))
            base_color = (rng.randint(0, 255), rng.randint(0, 255), rng.randint(0, 255))
            for y in range(img.height):
                factor = y / max(1, img.height - 1)
                color = tuple(int(c * (0.6 + 0.4 * factor)) for c in base_color)
                for x in range(img.width):
                    img.putpixel((x, y), color)
            img.save(out_path)
            return out_path

        # In real mode, apply an edit to base_image; for now, open and slightly darken
        src = Image.open(base_image).convert("RGB")
        pixels = src.load()
        for y in range(src.height):
            for x in range(src.width):
                r, g, b = pixels[x, y]
                pixels[x, y] = (int(r * 0.9), int(g * 0.9), int(b * 0.9))
        src = src.resize((max(8, width), max(8, height)))
        src.save(out_path)
        return out_path


def get_video_loader(model: str, use_dummy: Optional[bool] = None) -> BaseModelLoader:
    key = model.lower().replace("_", "-")
    if "ltx" in key:
        return LTXVideoLoader(model_name=model, use_dummy=use_dummy)
    if "hunyuan" in key:
        return HunyuanVideoLoader(model_name=model, use_dummy=use_dummy)
    # Default to LTX-like behavior
    return LTXVideoLoader(model_name=model, use_dummy=use_dummy)


def get_image_edit_loader(model: str, use_dummy: Optional[bool] = None) -> BaseModelLoader:
    return ImageEditLoader(model_name=model, use_dummy=use_dummy)

