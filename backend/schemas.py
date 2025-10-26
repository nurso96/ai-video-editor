from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class APIMessage(BaseModel):
    detail: str


class CaptionSegmentSchema(BaseModel):
    start: float
    end: float
    text: str


class SFXSchema(BaseModel):
    name: str
    path: str
    duration: float


class TimelineSegmentSchema(BaseModel):
    name: str
    start: float
    end: float
    effects: List[str] = Field(default_factory=list)
    beats: List[float] = Field(default_factory=list)
    captions: List[CaptionSegmentSchema] = Field(default_factory=list)
    sfx: Optional[SFXSchema] = None


class TimelineSchema(BaseModel):
    asset: Dict[str, Any] = Field(default_factory=dict)
    beats: List[float] = Field(default_factory=list)
    tempo: float = 0.0
    captions: List[CaptionSegmentSchema] = Field(default_factory=list)
    segments: List[TimelineSegmentSchema] = Field(default_factory=list)
    template_name: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class AssetSchema(BaseModel):
    id: int
    path: str
    duration: float
    resolution: str
    fps: Optional[float]
    thumbnail_url: Optional[str] = None
    ingest_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectSchema(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    asset: AssetSchema
    timeline: TimelineSchema
    consent: Optional["ConsentSchema"] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectListItem(BaseModel):
    id: int
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    asset_id: int
    ingest_url: Optional[str] = None
    last_render_url: Optional[str] = None


class TimelineUpdateRequest(BaseModel):
    timeline: TimelineSchema


class IngestResponse(BaseModel):
    asset: AssetSchema
    project: ProjectSchema


class RenderResponse(BaseModel):
    job_id: str
    status_url: str


class RenderRequest(BaseModel):
    watermark: Optional[bool] = None


class RenderStatus(BaseModel):
    id: str
    status: str
    progress: float = 0.0
    logs: List[str] = Field(default_factory=list)
    result: Optional[str] = None
    output_url: Optional[str] = None
    error: Optional[str] = None


class ConsentSchema(BaseModel):
    asset_id: int
    has_checkbox: bool
    document_url: Optional[str]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsentUpdateRequest(BaseModel):
    accepted: bool


class ToolRequest(BaseModel):
    tool: str
    args: Dict[str, Any] = Field(default_factory=dict)


class ToolResponse(BaseModel):
    tool: str
    result: Dict[str, Any]


class GenerateVideoRequest(BaseModel):
    model: str = Field(default="ltx-video")
    prompt: str
    width: int = Field(default=360)
    height: int = Field(default=640)
    length_seconds: float = Field(default=2.0)
    fps: int = Field(default=8)
    seed: Optional[int] = None


class EditImageRequest(BaseModel):
    model: str = Field(default="image-edit")
    prompt: str
    image_path: Optional[str] = None
    width: int = Field(default=512)
    height: int = Field(default=512)
    seed: Optional[int] = None


class GenerateOutputResponse(BaseModel):
    path: str
    url: str
    detail: Optional[str] = None


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None
    backend: Optional[str] = None
    hf_model: Optional[str] = None


class ChatMessageSchema(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatSessionSchema(BaseModel):
    id: int
    title: str
    backend: str
    hf_model: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ChatSendRequest(BaseModel):
    message: str


class ChatSendResponse(BaseModel):
    session: ChatSessionSchema


class ChatListResponse(BaseModel):
    sessions: List[ChatSessionSchema]


class HealthResponse(BaseModel):
    status: str
    redis: bool
    timestamp: datetime
