from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from app.agent.service import agent_service
from app.agent.tools.ask_user_tool import submit_answer

router = APIRouter()


class StreamRequest(BaseModel):
    messages: list[dict]
    model: Optional[str] = None
    session_id: Optional[str] = None


class AnswerRequest(BaseModel):
    answer: str


@router.post("/stream")
async def chat_stream(body: StreamRequest):
    if not agent_service.is_ready:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")

    async def event_generator():
        async for event_json in agent_service.stream(body.messages, body.model, body.session_id):
            yield {"event": "message", "data": event_json}

    return EventSourceResponse(content=event_generator())


@router.post("/answer/{session_id}")
async def answer_question(session_id: str, body: AnswerRequest):
    if not submit_answer(session_id, body.answer):
        raise HTTPException(status_code=404, detail="No pending question for this session")
    return {"ok": True}


@router.get("/models")
async def list_models():
    if not agent_service.is_ready:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")
    models = await agent_service.list_models()
    return {"models": models}
