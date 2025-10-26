from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from backend.config import get_settings
from backend.database import get_session
from backend.models import ChatMessage, ChatSession
from backend.schemas import (
    ChatListResponse,
    ChatMessageSchema,
    ChatSendRequest,
    ChatSendResponse,
    ChatSessionCreate,
    ChatSessionSchema,
)
from backend.services.chat_service import get_chat_service

router = APIRouter()
settings = get_settings()


def _session_to_schema(session_obj: ChatSession) -> ChatSessionSchema:
    return ChatSessionSchema(
        id=session_obj.id,
        title=session_obj.title,
        backend=session_obj.backend,
        hf_model=session_obj.hf_model,
        created_at=session_obj.created_at,
        updated_at=session_obj.updated_at,
        messages=[
            ChatMessageSchema(id=message.id, role=message.role, content=message.content, created_at=message.created_at)
            for message in session_obj.messages
        ],
    )


@router.post("/chat/sessions", response_model=ChatSessionSchema)
async def create_session(payload: ChatSessionCreate = ChatSessionCreate(), session: Session = Depends(get_session)) -> ChatSessionSchema:
    backend = (payload.backend or settings.chat_backend or "stub").lower()
    title = payload.title or "New Chat"
    hf_model = payload.hf_model or settings.hf_text_model
    chat_session = ChatSession(title=title, backend=backend, hf_model=hf_model)
    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    return _session_to_schema(chat_session)


@router.get("/chat/sessions", response_model=ChatListResponse)
async def list_sessions(session: Session = Depends(get_session)) -> ChatListResponse:
    sessions = session.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()
    return ChatListResponse(sessions=[_session_to_schema(item) for item in sessions])


@router.get("/chat/sessions/{session_id}", response_model=ChatSessionSchema)
async def get_session_detail(session_id: int, session: Session = Depends(get_session)) -> ChatSessionSchema:
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return _session_to_schema(chat_session)


@router.post("/chat/sessions/{session_id}/messages", response_model=ChatSendResponse)
async def send_message(session_id: int, payload: ChatSendRequest, session: Session = Depends(get_session)) -> ChatSendResponse:
    chat_session = session.get(ChatSession, session_id)
    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    user_message = ChatMessage(session=chat_session, role="user", content=payload.message)
    session.add(user_message)
    session.flush()

    chat_service = get_chat_service(chat_session.backend, chat_session.hf_model)
    reply_text = await run_in_threadpool(chat_service.generate_reply, payload.message)

    assistant_message = ChatMessage(session=chat_session, role="assistant", content=reply_text)
    session.add(assistant_message)
    session.flush()

    from datetime import datetime
    chat_session.updated_at = datetime.utcnow()
    session.commit()
    session.refresh(chat_session)

    return ChatSendResponse(session=_session_to_schema(chat_session))
