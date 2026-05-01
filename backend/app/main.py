from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, canvas

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


@app.get("/health")
def health_check():
    return {"status": "healthy"}
