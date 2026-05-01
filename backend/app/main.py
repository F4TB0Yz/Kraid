import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, canvas
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kraid")

app = FastAPI(title="Kraid API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(canvas.router, prefix="/api/canvas", tags=["canvas"])


@app.on_event("startup")
def startup():
    if not settings.openai_api_key:
        logger.warning("OPENAI_API_KEY not set — agent disabled. POST /api/chat/stream will return 503")
    else:
        logger.info("OpenAI agent ready (model=%s, repo=%s)", settings.openai_model, settings.repo_root)


@app.get("/health")
def health_check():
    return {"status": "healthy", "agent_ready": bool(settings.openai_api_key)}
