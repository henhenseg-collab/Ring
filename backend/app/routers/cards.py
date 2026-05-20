import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User, Card, CardProgress
from app.auth import get_current_user
from app.services import claude, sm2

router = APIRouter(prefix="/api/cards", tags=["cards"])

GRADE_MAP = {"easy": 2, "hard": 1, "missed": 0}


class GradeRequest(BaseModel):
    grade: str  # easy | hard | missed


class GradeResponse(BaseModel):
    interval: int
    ease_factor: float
    due_date: str
    repetitions: int


class FreegradeRequest(BaseModel):
    student_answer: str


class FreegradeResponse(BaseModel):
    passed: bool
    feedback: str


class ExplainRequest(BaseModel):
    messages: list[dict]  # [{role: user|assistant, content: str}]


@router.post("/{card_id}/grade", response_model=GradeResponse)
async def grade_card(
    card_id: int,
    body: GradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card_result = await db.execute(select(Card).where(Card.id == card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise HTTPException(404, "Card not found")

    prog_result = await db.execute(
        select(CardProgress).where(
            CardProgress.card_id == card_id,
            CardProgress.user_id == current_user.id,
        )
    )
    prog = prog_result.scalar_one_or_none()

    grade_val = GRADE_MAP.get(body.grade, 0)
    result = sm2.calculate_sm2(
        grade=grade_val,
        repetitions=prog.repetitions if prog else 0,
        ease_factor=prog.ease_factor if prog else 2.5,
        interval=prog.interval if prog else 1,
    )

    if prog is None:
        prog = CardProgress(card_id=card_id, user_id=current_user.id)
        db.add(prog)

    prog.interval = result.interval
    prog.ease_factor = result.ease_factor
    prog.due_date = result.due_date
    prog.repetitions = result.repetitions
    prog.last_reviewed = datetime.now(timezone.utc)
    await db.commit()

    return GradeResponse(
        interval=result.interval,
        ease_factor=result.ease_factor,
        due_date=result.due_date.isoformat(),
        repetitions=result.repetitions,
    )


@router.post("/{card_id}/grade-free", response_model=FreegradeResponse)
async def grade_free_response(
    card_id: int,
    body: FreegradeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card_result = await db.execute(select(Card).where(Card.id == card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise HTTPException(404, "Card not found")

    try:
        result = await claude.grade_free_response(
            question=card.question,
            answer=card.answer,
            student_answer=body.student_answer,
        )
    except Exception as e:
        raise HTTPException(502, f"Claude error: {e}")

    return FreegradeResponse(passed=result.get("pass", False), feedback=result.get("feedback", ""))


@router.post("/{card_id}/explain")
async def explain_card(
    card_id: int,
    body: ExplainRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card_result = await db.execute(select(Card).where(Card.id == card_id))
    card = card_result.scalar_one_or_none()
    if not card:
        raise HTTPException(404, "Card not found")

    # Prepend card context to first user message if not already there
    messages = body.messages
    if messages and messages[0]["role"] == "user":
        first_content = messages[0]["content"]
        if card.question not in first_content:
            context = f"Question: {card.question}\nAnswer: {card.answer}\n\n"
            messages = [{"role": "user", "content": context + first_content}] + messages[1:]

    async def event_stream():
        try:
            async for token in claude.stream_explanation(messages):
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
