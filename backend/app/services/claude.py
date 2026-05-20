"""All Claude API calls for Recall."""
import json
from typing import AsyncIterator
import anthropic
from app.config import settings

MODEL = "claude-sonnet-4-20250514"

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


GENERATION_PROMPT = """You are a study assistant. Given the following notes or topic, generate a question bank as a JSON array.

Each item must have: {{ "type": "flashcard"|"multiple_choice"|"free_response", "question": string, "answer": string, "explanation": string }}

For multiple_choice, also include: "options": [string, string, string, string] where one matches "answer".

Generate 15 questions total: 6 flashcards, 6 multiple choice, 3 free response.

Return ONLY valid JSON. No preamble. No markdown fences.

Notes/Topic:
{content}"""

GRADING_PROMPT = """You are a study tutor grading a student answer.

Question: {question}
Correct answer: {answer}
Student answer: {student_answer}

Respond with JSON: {{ "pass": true|false, "feedback": string (1-2 sentences, encouraging) }}
Return ONLY valid JSON."""

EXPLANATION_SYSTEM = "You are a friendly tutor. Explain concepts clearly using analogies. Be concise (under 200 words per reply). Always check if the student understood."


async def generate_question_bank(content: str) -> list[dict]:
    client = get_client()
    message = await client.messages.create(
        model=MODEL,
        max_tokens=4096,
        messages=[{"role": "user", "content": GENERATION_PROMPT.format(content=content)}],
    )
    text = message.content[0].text.strip()
    # Strip markdown fences if Claude includes them despite instructions
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


async def grade_free_response(question: str, answer: str, student_answer: str) -> dict:
    client = get_client()
    message = await client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": GRADING_PROMPT.format(
                    question=question,
                    answer=answer,
                    student_answer=student_answer,
                ),
            }
        ],
    )
    text = message.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


async def stream_explanation(
    messages: list[dict],
) -> AsyncIterator[str]:
    client = get_client()
    async with client.messages.stream(
        model=MODEL,
        max_tokens=1024,
        system=EXPLANATION_SYSTEM,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text
