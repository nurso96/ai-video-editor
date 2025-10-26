"""
Social Media Upload API Routes
"""

from __future__ import annotations

from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.services.social_upload import get_social_uploader

router = APIRouter()


class UploadRequest(BaseModel):
    video_path: str = Field(..., description="Path to video file")
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description")
    platforms: Optional[List[str]] = Field(default=None, description="Platforms to upload to")


class UploadResponse(BaseModel):
    results: dict = Field(..., description="Upload results by platform")
    summary: dict = Field(..., description="Success/failure summary")


@router.post("/upload", response_model=UploadResponse)
async def upload_to_social(request: UploadRequest) -> UploadResponse:
    """
    Upload video to social media platforms (YouTube Shorts, TikTok).

    Example:
    POST /api/social/upload
    {
      "video_path": "/home/nick/ai-video-editor/media/final/my_video.mp4",
      "title": "Cats Learn Python #shorts",
      "description": "Watch Whiskers code! #python #coding #cats #Shorts",
      "platforms": ["youtube", "tiktok"]
    }
    """
    video_path = Path(request.video_path)

    if not video_path.exists():
        raise HTTPException(status_code=404, detail=f"Video not found: {video_path}")

    uploader = get_social_uploader()

    results = uploader.upload_everywhere(
        video_path=video_path,
        title=request.title,
        description=request.description,
        platforms=request.platforms,
    )

    # Create summary
    summary = {
        "total": len(results),
        "successful": sum(1 for r in results.values() if r.success),
        "failed": sum(1 for r in results.values() if not r.success),
        "urls": [r.url for r in results.values() if r.url],
    }

    # Convert results to dict
    results_dict = {platform: {"success": r.success, "url": r.url, "error": r.error} for platform, r in results.items()}

    return UploadResponse(results=results_dict, summary=summary)


@router.get("/status")
async def check_platform_status():
    """
    Check which platforms are configured and ready.
    """
    import os

    status = {
        "youtube": {
            "configured": os.path.exists("client_secret.json"),
            "authenticated": os.path.exists("youtube_token.json"),
            "setup_url": "https://console.cloud.google.com/",
        },
        "tiktok": {
            "configured": bool(os.getenv("TIKTOK_ACCESS_TOKEN")),
            "setup_url": "https://developers.tiktok.com/",
        },
    }

    return status
