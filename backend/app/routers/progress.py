from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User, Topic, Card, CardProgress, Session
from app.auth import get_current_user

router = APIRouter(prefix="/api/progress", tags=["progress"])


class WeakCard(BaseModel):
    card_id: int
    question: str
    ease_factor: float
    topic_name: str


class ProgressResponse(BaseModel):
    total_cards: int
    mastered_cards: int
    mastery_pct: float
    streak_days: list[str]  # ISO dates with activity
    weak_spots: list[WeakCard]
    sessions_last_30: int


@router.get("", response_model=ProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topics_result = await db.execute(
        select(Topic).where(Topic.user_id == current_user.id)
    )
    topics = topics_result.scalars().all()
    topic_map = {t.id: t.name for t in topics}

    all_cards = []
    for t in topics:
        cards_result = await db.execute(select(Card).where(Card.topic_id == t.id))
        cards = cards_result.scalars().all()
        for c in cards:
            all_cards.append((c, t.name))

    card_ids = [c.id for c, _ in all_cards]
    prog_map: dict[int, CardProgress] = {}
    if card_ids:
        prog_result = await db.execute(
            select(CardProgress).where(
                CardProgress.card_id.in_(card_ids),
                CardProgress.user_id == current_user.id,
            )
        )
        for p in prog_result.scalars().all():
            prog_map[p.card_id] = p

    total = len(all_cards)
    mastered = sum(1 for c, _ in all_cards if prog_map.get(c.id) and prog_map[c.id].ease_factor > 2.5)
    mastery_pct = round(mastered / total * 100, 1) if total else 0.0

    # Weak spots: top 5 lowest ease_factor among reviewed cards
    reviewed = [(c, name, prog_map[c.id]) for c, name in all_cards if c.id in prog_map]
    reviewed.sort(key=lambda x: x[2].ease_factor)
    weak_spots = [
        WeakCard(
            card_id=c.id,
            question=c.question,
            ease_factor=round(p.ease_factor, 2),
            topic_name=name,
        )
        for c, name, p in reviewed[:5]
    ]

    # Streak: days in last 30 with completed sessions
    thirty_ago = date.today() - timedelta(days=30)
    sessions_result = await db.execute(
        select(Session).where(
            Session.user_id == current_user.id,
            Session.started_at >= thirty_ago.isoformat(),
        )
    )
    sessions = sessions_result.scalars().all()
    streak_days = list(
        {s.started_at.date().isoformat() for s in sessions}
    )

    return ProgressResponse(
        total_cards=total,
        mastered_cards=mastered,
        mastery_pct=mastery_pct,
        streak_days=sorted(streak_days),
        weak_spots=weak_spots,
        sessions_last_30=len(sessions),
    )
