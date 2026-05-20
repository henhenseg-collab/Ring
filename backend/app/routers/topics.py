import json
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User, Topic, Card, CardProgress, Session
from app.auth import get_current_user

router = APIRouter(prefix="/api/topics", tags=["topics"])


class TopicOut(BaseModel):
    id: int
    name: str
    created_at: str
    card_count: int = 0
    mastery_pct: float = 0.0
    due_count: int = 0
    last_studied: Optional[str] = None


class CardOut(BaseModel):
    id: int
    type: str
    question: str
    answer: str
    explanation: Optional[str]
    options: Optional[list[str]]
    interval: int = 1
    ease_factor: float = 2.5
    due_date: Optional[str] = None
    repetitions: int = 0


@router.get("", response_model=list[TopicOut])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Topic).where(Topic.user_id == current_user.id))
    topics = result.scalars().all()

    out = []
    for t in topics:
        cards_result = await db.execute(select(Card).where(Card.topic_id == t.id))
        cards = cards_result.scalars().all()
        card_ids = [c.id for c in cards]

        mastery = 0
        due_count = 0
        if card_ids:
            prog_result = await db.execute(
                select(CardProgress).where(
                    CardProgress.card_id.in_(card_ids),
                    CardProgress.user_id == current_user.id,
                )
            )
            progs = prog_result.scalars().all()
            prog_map = {p.card_id: p for p in progs}
            mastered = sum(1 for p in progs if p.ease_factor > 2.5)
            mastery = round(mastered / len(cards) * 100, 1)
            today = date.today()
            due_count = sum(
                1 for c in cards
                if c.id not in prog_map or (prog_map[c.id].due_date or today) <= today
            )

        last_session_result = await db.execute(
            select(Session)
            .where(Session.topic_id == t.id, Session.user_id == current_user.id)
            .order_by(Session.started_at.desc())
            .limit(1)
        )
        last_session = last_session_result.scalar_one_or_none()
        last_studied = last_session.started_at.date().isoformat() if last_session else None

        out.append(
            TopicOut(
                id=t.id,
                name=t.name,
                created_at=t.created_at.isoformat(),
                card_count=len(cards),
                mastery_pct=mastery,
                due_count=due_count,
                last_studied=last_studied,
            )
        )
    return out


@router.get("/{topic_id}/cards", response_model=list[CardOut])
async def get_cards(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic_result = await db.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == current_user.id)
    )
    if not topic_result.scalar_one_or_none():
        raise HTTPException(404, "Topic not found")

    cards_result = await db.execute(select(Card).where(Card.topic_id == topic_id))
    cards = cards_result.scalars().all()

    out = []
    for c in cards:
        prog_result = await db.execute(
            select(CardProgress).where(
                CardProgress.card_id == c.id,
                CardProgress.user_id == current_user.id,
            )
        )
        prog = prog_result.scalar_one_or_none()
        out.append(
            CardOut(
                id=c.id,
                type=c.type,
                question=c.question,
                answer=c.answer,
                explanation=c.explanation,
                options=json.loads(c.options) if c.options else None,
                interval=prog.interval if prog else 1,
                ease_factor=prog.ease_factor if prog else 2.5,
                due_date=prog.due_date.isoformat() if prog and prog.due_date else None,
                repetitions=prog.repetitions if prog else 0,
            )
        )
    return out


@router.get("/{topic_id}/session", response_model=list[CardOut])
async def get_session_cards(
    topic_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return due cards first, then new cards (up to 20 total)."""
    topic_result = await db.execute(
        select(Topic).where(Topic.id == topic_id, Topic.user_id == current_user.id)
    )
    if not topic_result.scalar_one_or_none():
        raise HTTPException(404, "Topic not found")

    cards_result = await db.execute(select(Card).where(Card.topic_id == topic_id))
    cards = cards_result.scalars().all()

    today = date.today()
    due_cards = []
    new_cards = []

    for c in cards:
        prog_result = await db.execute(
            select(CardProgress).where(
                CardProgress.card_id == c.id,
                CardProgress.user_id == current_user.id,
            )
        )
        prog = prog_result.scalar_one_or_none()

        card_out = CardOut(
            id=c.id,
            type=c.type,
            question=c.question,
            answer=c.answer,
            explanation=c.explanation,
            options=json.loads(c.options) if c.options else None,
            interval=prog.interval if prog else 1,
            ease_factor=prog.ease_factor if prog else 2.5,
            due_date=prog.due_date.isoformat() if prog and prog.due_date else None,
            repetitions=prog.repetitions if prog else 0,
        )

        if prog is None:
            new_cards.append(card_out)
        elif prog.due_date is None or prog.due_date <= today:
            due_cards.append(card_out)

    return (due_cards + new_cards)[:20]
