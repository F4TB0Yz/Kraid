from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from app.agent.service import agent_service

router = APIRouter()


class StreamRequest(BaseModel):
    messages: list[dict]
    model: Optional[str] = None


@router.post("/stream")
async def chat_stream(body: StreamRequest):
    if not agent_service.is_ready:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")

    async def event_generator():
        async for event_json in agent_service.stream(body.messages, body.model):
            yield {"event": "message", "data": event_json}

    return EventSourceResponse(content=event_generator())
