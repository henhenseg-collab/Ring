import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.models import User, Topic, Card
from app.auth import get_current_user
from app.services import claude

router = APIRouter(prefix="/api", tags=["generate"])


class GenerateResponse(BaseModel):
    topic_id: int
    topic_name: str
    card_count: int


@router.post("/generate", response_model=GenerateResponse)
async def generate(
    topic_name: str = Form(...),
    notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = notes or ""

    if file:
        try:
            import fitz  # PyMuPDF
            data = await file.read()
            doc = fitz.open(stream=data, filetype="pdf")
            content = "\n".join(page.get_text() for page in doc)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"PDF parse error: {e}")

    if not content.strip():
        content = f"Topic: {topic_name}"

    try:
        questions = await claude.generate_question_bank(content)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e}")

    topic = Topic(user_id=current_user.id, name=topic_name)
    db.add(topic)
    await db.flush()

    for q in questions:
        options_json = json.dumps(q.get("options", [])) if q.get("options") else None
        card = Card(
            topic_id=topic.id,
            type=q.get("type", "flashcard"),
            question=q["question"],
            answer=q["answer"],
            explanation=q.get("explanation", ""),
            options=options_json,
        )
        db.add(card)

    await db.commit()
    await db.refresh(topic)

    return GenerateResponse(
        topic_id=topic.id,
        topic_name=topic.name,
        card_count=len(questions),
    )
