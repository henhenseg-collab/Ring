# Recall — AI-Powered Study App

A full-stack spaced-repetition flashcard app powered by Claude AI.

## Stack

- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query
- **Backend**: FastAPI (Python 3.12), SQLAlchemy (async), Alembic
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Auth**: JWT (bcrypt passwords)
- **Containers**: Docker + docker-compose

## Setup

### 1. Clone and configure

```bash
git clone <repo>
cd recall
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Start everything

```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- FastAPI backend on port 8000 (runs Alembic migrations on startup)
- React dev server on port 5173

### 3. Open the app

Visit **http://localhost:5173**

Register an account, then create your first topic.

## Features

### Import Screen (`/import`)
- Paste raw notes → Claude generates 15 questions
- Upload a PDF → parsed server-side with PyMuPDF
- Or just type a topic name → Claude generates from scratch

### Quiz Mode (`/quiz/:topicId`)
- Due cards first (SM-2), then new cards
- **Flashcard**: tap to flip, then grade Easy / Hard / Missed
- **Multiple choice**: 4 options, highlights correct on selection
- **Free response**: type answer → Claude grades and gives feedback
- "Explain this" opens a streaming chat panel with Claude as tutor

### Spaced Repetition (SM-2)
- Server-side implementation in `backend/app/services/sm2.py`
- Tracks interval, ease factor, due date, repetitions per card per user
- Due cards are always shown first in sessions

### Progress Dashboard (`/`)
- Topic cards with mastery %, due count, last studied date
- 30-day streak calendar
- Weak spots (lowest ease-factor cards)

### Progress Page (`/progress`)
- Overall mastery bar
- Full streak calendar
- Ranked weak spots list

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/generate` | Generate question bank from notes/PDF/topic |
| GET | `/api/topics` | List user's topics |
| GET | `/api/topics/:id/cards` | All cards for topic |
| GET | `/api/topics/:id/session` | Due + new cards for today |
| POST | `/api/cards/:id/grade` | Submit SM-2 grade |
| POST | `/api/cards/:id/grade-free` | Claude grades free response |
| POST | `/api/cards/:id/explain` | SSE streaming explanation |
| POST | `/api/sessions` | Start session |
| PATCH | `/api/sessions/:id/complete` | Complete session |
| GET | `/api/progress` | Mastery stats + streak + weak spots |

## Development

### Backend only (without Docker)

```bash
cd backend
pip install -r requirements.txt
# Set env vars manually or use a local .env
uvicorn app.main:app --reload
```

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

### Database migrations

```bash
cd backend
alembic upgrade head          # apply migrations
alembic revision --autogenerate -m "description"  # create new migration
```

## Brand

- Primary: `#534AB7` (Recall Purple)
- Accent: `#7F77DD` (Soft Violet)
- Tint: `#EEEDFE` (Lavender)
- Background dark: `#2C2C2A`
- Background light: `#F1EFE8`
