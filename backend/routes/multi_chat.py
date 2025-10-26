"""
Multi-LLM Chat API Routes
Endpoints for conversational AI across different video production tasks
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.database import get_session
from backend.services.multi_llm_service import get_multi_llm_service

router = APIRouter()


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message")
    mode: str = Field(default="general", description="Chat mode: general, planner, editor, scripter")
    history: Optional[List[ChatMessage]] = Field(default=None, description="Chat history for context")
    session_id: Optional[str] = Field(default=None, description="Chat session ID")


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response")
    model_used: str = Field(..., description="Which model generated the response")
    mode: str = Field(..., description="Chat mode used")
    session_id: Optional[str] = Field(default=None)


class VideoPlanRequest(BaseModel):
    prompt: str = Field(..., description="User's video idea")


class VideoPlanResponse(BaseModel):
    plan: dict = Field(..., description="Structured video production plan")
    raw_response: str = Field(..., description="Raw AI response")


class EditSuggestionRequest(BaseModel):
    video_description: str = Field(..., description="What the video is about")
    current_edits: str = Field(..., description="Current editing plan/timeline")


class EditSuggestionResponse(BaseModel):
    suggestions: str = Field(..., description="AI editing suggestions")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    session: Session = Depends(get_session),
) -> ChatResponse:
    """
    General chat endpoint - routes to appropriate LLM based on mode.

    Modes:
    - general: General conversation
    - planner: Video planning and production
    - editor: Editing suggestions and improvements
    - scripter: Script writing and dialogue
    """
    service = get_multi_llm_service()

    # Convert history to dict format
    history_dicts = None
    if request.history:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]

    # Get response from appropriate model
    response = service.chat(user_message=request.message, mode=request.mode, history=history_dicts)

    # Determine which model was used
    model_map = {
        "planner": service.planner_model,
        "editor": service.editor_model,
        "scripter": service.chat_model,
        "general": service.chat_model,
    }
    model_used = model_map.get(request.mode, "unknown")

    return ChatResponse(
        response=response,
        model_used=model_used,
        mode=request.mode,
        session_id=request.session_id,
    )


@router.post("/plan-video", response_model=VideoPlanResponse)
async def create_video_plan(request: VideoPlanRequest) -> VideoPlanResponse:
    """
    Create a structured video production plan from a user prompt.

    Example:
    POST /api/multi-chat/plan-video
    {
      "prompt": "Make a funny video about cats learning Python"
    }

    Returns:
    {
      "plan": {
        "title": "Cats Learn Python",
        "duration": 45,
        "scenes": [...]
      },
      "raw_response": "..."
    }
    """
    service = get_multi_llm_service()

    plan = service.create_video_plan(request.prompt)

    return VideoPlanResponse(plan=plan, raw_response=str(plan))


@router.post("/suggest-edits", response_model=EditSuggestionResponse)
async def suggest_video_edits(request: EditSuggestionRequest) -> EditSuggestionResponse:
    """
    Get AI suggestions for improving video edits.

    Example:
    POST /api/multi-chat/suggest-edits
    {
      "video_description": "Funny cat coding tutorial",
      "current_edits": "3 scenes, 45s total, intro->main->outro"
    }
    """
    service = get_multi_llm_service()

    suggestions = service.suggest_edits(
        video_description=request.video_description, current_edits=request.current_edits
    )

    return EditSuggestionResponse(suggestions=suggestions)


@router.get("/models")
async def list_available_models():
    """
    List all available AI models and their purposes.
    """
    service = get_multi_llm_service()

    return {
        "models": {
            "planner": {
                "model": service.planner_model,
                "purpose": "Video production planning",
                "capabilities": ["script generation", "scene planning", "shot lists"],
            },
            "chat": {
                "model": service.chat_model,
                "purpose": "General conversation and assistance",
                "capabilities": ["Q&A", "brainstorming", "creative writing"],
            },
            "editor": {
                "model": service.editor_model,
                "purpose": "Video editing suggestions",
                "capabilities": ["timing optimization", "effect suggestions", "caption placement"],
            },
        },
        "device": service.device,
        "gpu_available": service.device == "cuda",
    }
