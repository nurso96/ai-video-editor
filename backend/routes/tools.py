from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import ffmpeg
from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.schemas import (
    EditImageRequest,
    GenerateOutputResponse,
    GenerateVideoRequest,
    ToolRequest,
    ToolResponse,
)
from backend.services.beat_detection import BeatDetectionService
from backend.services.captions import CaptionSegment, CaptionService
from backend.services.chat_service import get_chat_service
from backend.services.model_loaders import get_image_edit_loader, get_video_loader

router = APIRouter()
settings = get_settings()


@router.post("/tools", response_model=ToolResponse)
async def run_tool(payload: ToolRequest, session: Session = Depends(get_session)) -> ToolResponse:
    tool = payload.tool.lower()
    args = payload.args or {}

    if tool == "transcribe":
        result = await _run_transcribe(args)
    elif tool == "beats":
        result = await _run_beats(args)
    elif tool == "thumbnail":
        result = await _run_thumbnail(args)
    elif tool == "caption_srt":
        result = _run_caption_srt(args)
    elif tool == "suggest_effects":
        result = await _run_suggest_effects(args)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown tool '{payload.tool}'")

    return ToolResponse(tool=tool, result=result)


@router.post("/tools/generate_video", response_model=GenerateOutputResponse)
async def generate_video(payload: GenerateVideoRequest) -> GenerateOutputResponse:
    model = payload.model or "ltx-video"
    loader = get_video_loader(model)
    # Run generation in threadpool to avoid blocking the event loop
    path = await run_in_threadpool(
        loader.generate,
        payload.prompt,
        width=payload.width,
        height=payload.height,
        length_seconds=payload.length_seconds,
        fps=payload.fps,
        seed=payload.seed,
    )
    url = f"/media/final/{Path(path).name}"
    return GenerateOutputResponse(path=str(path), url=url)


@router.post("/tools/edit_image", response_model=GenerateOutputResponse)
async def edit_image(payload: EditImageRequest) -> GenerateOutputResponse:
    model = payload.model or "image-edit"
    loader = get_image_edit_loader(model)
    base_image: Optional[Path] = Path(payload.image_path) if payload.image_path else None
    path = await run_in_threadpool(
        loader.generate,
        payload.prompt,
        base_image=base_image,
        width=payload.width,
        height=payload.height,
        seed=payload.seed,
    )
    url = f"/media/final/{Path(path).name}"
    return GenerateOutputResponse(path=str(path), url=url)


async def _run_transcribe(args: Dict[str, Any]) -> Dict[str, Any]:
    path = args.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="'path' is required for transcribe tool")
    video_path = Path(path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    model_name = args.get("model")
    caption_service = CaptionService(model_name=model_name)
    save_files = bool(args.get("save_files", True))
    result = await run_in_threadpool(caption_service.transcribe, video_path, save_files)
    return result.to_dict()


async def _run_beats(args: Dict[str, Any]) -> Dict[str, Any]:
    path = args.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="'path' is required for beats tool")
    audio_path = Path(path)
    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    beat_service = BeatDetectionService()
    analysis = await run_in_threadpool(beat_service.detect_beats, audio_path)
    return {
        "beats": analysis.beats,
        "tempo": analysis.tempo,
        "energy_peaks": analysis.energy_peaks,
    }


async def _run_thumbnail(args: Dict[str, Any]) -> Dict[str, Any]:
    path = args.get("path")
    if not path:
        raise HTTPException(status_code=400, detail="'path' is required for thumbnail tool")
    video_path = Path(path)
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    timestamp = float(args.get("time", 0))

    thumbnails_dir = settings.thumbnails_dir
    thumbnails_dir.mkdir(parents=True, exist_ok=True)
    filename = thumbnails_dir / f"thumb_{video_path.stem}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
    (
        ffmpeg
        .input(str(video_path), ss=timestamp)
        .filter("scale", 480, -1)
        .output(str(filename), vframes=1)
        .run(quiet=True, overwrite_output=True)
    )
    return {
        "path": str(filename),
        "url": f"/media/thumbnails/{filename.name}",
    }


def _run_caption_srt(args: Dict[str, Any]) -> Dict[str, Any]:
    segments_data = args.get("segments")
    if not isinstance(segments_data, list):
        raise HTTPException(status_code=400, detail="'segments' list is required for caption_srt tool")
    segments = [
        CaptionSegment(start=float(seg["start"]), end=float(seg["end"]), text=str(seg["text"]))
        for seg in segments_data
    ]
    srt_content = CaptionService.to_srt(segments)
    return {"srt": srt_content}


async def _run_suggest_effects(args: Dict[str, Any]) -> Dict[str, Any]:
    transcript = args.get("transcript")
    beats = args.get("beats", [])
    if not transcript:
        raise HTTPException(status_code=400, detail="'transcript' is required for suggest_effects tool")
    prompt = (
        "Given this transcript and beat timestamps for a humorous short-form video, "
        "suggest timing for zooms, captions, punchlines, and recommended SFX in JSON format.\n"
        f"Transcript: {transcript}\nBeats: {json.dumps(beats)}\n"
        "Respond with keys: zooms (list of seconds), captions (list of {time, text}), sfx (list)."
    )
    backend = args.get("backend", settings.chat_backend)
    hf_model = args.get("hf_model")
    chat_service = get_chat_service(backend, hf_model)
    response = await run_in_threadpool(chat_service.generate_reply, prompt)
    return {"suggestions": response}
