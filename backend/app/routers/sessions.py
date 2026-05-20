from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User, Topic, Session
from app.auth import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class SessionCreateRequest(BaseModel):
    topic_id: int


class SessionCompleteRequest(BaseModel):
    cards_reviewed: int
    score: float


class SessionOut(BaseModel):
    id: int
    topic_id: int
    started_at: str
    completed_at: Optional[str]
    cards_reviewed: int
    score: float


@router.post("", response_model=SessionOut)
async def create_session(
    body: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic_result = await db.execute(
        select(Topic).where(Topic.id == body.topic_id, Topic.user_id == current_user.id)
    )
    if not topic_result.scalar_one_or_none():
        raise HTTPException(404, "Topic not found")

    session = Session(user_id=current_user.id, topic_id=body.topic_id)
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return SessionOut(
        id=session.id,
        topic_id=session.topic_id,
        started_at=session.started_at.isoformat(),
        completed_at=None,
        cards_reviewed=0,
        score=0.0,
    )


@router.patch("/{session_id}/complete", response_model=SessionOut)
async def complete_session(
    session_id: int,
    body: SessionCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Session not found")

    session.completed_at = datetime.now(timezone.utc)
    session.cards_reviewed = body.cards_reviewed
    session.score = body.score
    await db.commit()
    await db.refresh(session)

    return SessionOut(
        id=session.id,
        topic_id=session.topic_id,
        started_at=session.started_at.isoformat(),
        completed_at=session.completed_at.isoformat(),
        cards_reviewed=session.cards_reviewed,
        score=session.score,
    )
