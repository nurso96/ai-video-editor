"""
Auto-Editing API Routes
Endpoints for automatic video editing
"""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.auto_editor import (
    AudioTrack,
    AutoEditor,
    Caption,
    EditingPlan,
    VideoClip,
    get_auto_editor,
)

router = APIRouter()


class VideoClipRequest(BaseModel):
    path: str = Field(..., description="Path to video clip")
    start_time: float = Field(default=0.0, description="Trim start time in seconds")
    end_time: Optional[float] = Field(default=None, description="Trim end time in seconds")
    effects: Optional[List[str]] = Field(default=None, description="Effects to apply: zoom, slowmo, shake, vignette")


class CaptionRequest(BaseModel):
    text: str = Field(..., description="Caption text")
    start: float = Field(..., description="Start time in seconds")
    end: float = Field(..., description="End time in seconds")
    position: str = Field(default="bottom", description="Position: bottom, top, center")
    style: str = Field(default="default", description="Style: default, bold")


class AudioTrackRequest(BaseModel):
    path: str = Field(..., description="Path to audio file")
    start: float = Field(default=0.0, description="Start time in video timeline")
    volume: float = Field(default=1.0, description="Volume 0.0-1.0", ge=0.0, le=1.0)
    fade_in: float = Field(default=0.0, description="Fade in duration in seconds")
    fade_out: float = Field(default=0.0, description="Fade out duration in seconds")


class EditVideoRequest(BaseModel):
    clips: List[VideoClipRequest] = Field(..., description="List of video clips to edit")
    captions: Optional[List[CaptionRequest]] = Field(default=None, description="Captions/subtitles")
    music: Optional[AudioTrackRequest] = Field(default=None, description="Background music")
    sfx: Optional[List[AudioTrackRequest]] = Field(default=None, description="Sound effects")
    transitions: str = Field(default="fade", description="Transition type: fade, cut, dissolve")
    output_resolution: str = Field(default="1080x1920", description="Output resolution (width x height)")
    output_fps: int = Field(default=30, description="Output frames per second")


class EditVideoResponse(BaseModel):
    output_path: str = Field(..., description="Path to edited video")
    output_url: str = Field(..., description="URL to access edited video")
    duration: float = Field(..., description="Total duration in seconds")


@router.post("/edit", response_model=EditVideoResponse)
async def edit_video(request: EditVideoRequest) -> EditVideoResponse:
    """
    Automatic video editing - combines clips, adds captions, music, effects.

    Example:
    POST /api/auto-edit/edit
    {
      "clips": [
        {"path": "/home/nick/ai-video-editor/media/final/clip1.mp4"},
        {"path": "/home/nick/ai-video-editor/media/final/clip2.mp4", "effects": ["zoom"]}
      ],
      "captions": [
        {"text": "Hello World!", "start": 0.5, "end": 2.0, "position": "bottom"}
      ],
      "music": {
        "path": "/home/nick/ai-video-editor/media/sfx/background.mp3",
        "volume": 0.3,
        "fade_in": 1.0,
        "fade_out": 2.0
      },
      "transitions": "fade"
    }
    """
    # Validate all clip paths exist
    for clip_req in request.clips:
        clip_path = Path(clip_req.path)
        if not clip_path.exists():
            raise HTTPException(status_code=404, detail=f"Clip not found: {clip_req.path}")

    # Convert request models to service models
    clips = [
        VideoClip(
            path=Path(clip_req.path),
            start_time=clip_req.start_time,
            end_time=clip_req.end_time,
            effects=clip_req.effects or [],
        )
        for clip_req in request.clips
    ]

    captions = None
    if request.captions:
        captions = [
            Caption(
                text=cap_req.text,
                start=cap_req.start,
                end=cap_req.end,
                position=cap_req.position,
                style=cap_req.style,
            )
            for cap_req in request.captions
        ]

    music = None
    if request.music:
        music_path = Path(request.music.path)
        if not music_path.exists():
            raise HTTPException(status_code=404, detail=f"Music file not found: {request.music.path}")

        music = AudioTrack(
            path=music_path,
            start=request.music.start,
            volume=request.music.volume,
            fade_in=request.music.fade_in,
            fade_out=request.music.fade_out,
        )

    sfx = None
    if request.sfx:
        sfx = []
        for sfx_req in request.sfx:
            sfx_path = Path(sfx_req.path)
            if not sfx_path.exists():
                raise HTTPException(status_code=404, detail=f"SFX file not found: {sfx_req.path}")

            sfx.append(
                AudioTrack(
                    path=sfx_path,
                    start=sfx_req.start,
                    volume=sfx_req.volume,
                    fade_in=sfx_req.fade_in,
                    fade_out=sfx_req.fade_out,
                )
            )

    # Create editing plan
    plan = EditingPlan(
        clips=clips,
        captions=captions,
        music=music,
        sfx=sfx,
        transitions=request.transitions,
        output_resolution=request.output_resolution,
        output_fps=request.output_fps,
    )

    # Execute editing
    editor = get_auto_editor()
    output_path = editor.edit_video(plan)

    # Get duration
    duration = editor.get_video_duration(output_path)

    # Generate URL
    output_url = f"/media/final/{output_path.name}"

    return EditVideoResponse(output_path=str(output_path), output_url=output_url, duration=duration)


@router.post("/quick-edit")
async def quick_edit(
    clip_paths: List[str],
    add_captions: bool = False,
    add_music: bool = False,
    platform: str = "tiktok",
):
    """
    Quick edit - simple concatenation with optional captions/music.

    Example:
    POST /api/auto-edit/quick-edit
    {
      "clip_paths": [
        "/path/to/clip1.mp4",
        "/path/to/clip2.mp4"
      ],
      "add_captions": true,
      "platform": "tiktok"
    }
    """
    # Validate paths
    clips = []
    for path_str in clip_paths:
        path = Path(path_str)
        if not path.exists():
            raise HTTPException(status_code=404, detail=f"Clip not found: {path_str}")
        clips.append(VideoClip(path=path))

    plan = EditingPlan(clips=clips, transitions="fade", output_resolution="1080x1920")

    # Auto-generate captions if requested
    if add_captions:
        # Simple auto-captions at start of each clip
        captions = []
        current_time = 0.0
        for i, clip in enumerate(clips):
            captions.append(
                Caption(text=f"Part {i+1}", start=current_time + 0.5, end=current_time + 2.0, position="bottom")
            )
            # Estimate clip duration (will be filled in by editor)
            current_time += 5.0  # Assume 5s per clip

        plan.captions = captions

    editor = get_auto_editor()
    output_path = editor.edit_video(plan)

    return {"output_path": str(output_path), "output_url": f"/media/final/{output_path.name}"}
