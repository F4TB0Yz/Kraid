import asyncio
from typing import Optional

from app.agent.tools.base import Tool

_pending: dict[str, dict] = {}

QUESTION_TIMEOUT_SECONDS = 300


async def _execute(
    question: str,
    type: str,
    options: Optional[list[str]] = None,
    placeholder: Optional[str] = None,
    session_id: Optional[str] = None,
) -> str:
    if not session_id:
        return "Error: session_id is required for ask_user"

    event = asyncio.Event()
    _pending[session_id] = {"event": event, "answer": None}

    try:
        await asyncio.wait_for(event.wait(), timeout=QUESTION_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        _pending.pop(session_id, None)
        return "Error: the user did not respond in time"

    answer = _pending.pop(session_id, {}).get("answer", "")
    return answer or "Error: no answer received"


def submit_answer(session_id: str, answer: str) -> bool:
    pending = _pending.get(session_id)
    if not pending:
        return False
    pending["answer"] = answer
    pending["event"].set()
    return True


ask_user = Tool(
    name="ask_user",
    description=(
        "Ask the user an interactive question and wait for their response. "
        "Use this instead of asking questions in plain text. "
        "The question will appear as an interactive popup in the UI."
    ),
    parameters={
        "type": "object",
        "properties": {
            "question": {
                "type": "string",
                "description": "The question to ask the user. Be concise and clear.",
            },
            "type": {
                "type": "string",
                "enum": ["single_choice", "multiple_choice", "free_text"],
                "description": (
                    "single_choice: mutually exclusive options (methodology, category). "
                    "multiple_choice: user can select several (tags, features). "
                    "free_text: open-ended input (name, description, date)."
                ),
            },
            "options": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Available choices. Required for single_choice and multiple_choice.",
            },
            "placeholder": {
                "type": "string",
                "description": "Placeholder text for free_text input. Example: 'ej: Mi Proyecto'",
            },
        },
        "required": ["question", "type"],
        "additionalProperties": False,
    },
    execute=_execute,
)
