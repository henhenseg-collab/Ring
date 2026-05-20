from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, generate, topics, cards, progress, sessions

app = FastAPI(title="Recall API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(generate.router)
app.include_router(topics.router)
app.include_router(cards.router)
app.include_router(progress.router)
app.include_router(sessions.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
