from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

DUMMY_MESSAGES = [
    {
        "id": "1",
        "role": "user",
        "content": "Hello, how are you?",
        "timestamp": datetime(2024, 1, 1, 10, 0, 0),
    },
    {
        "id": "2",
        "role": "assistant",
        "content": "I am doing great! How can I help you today?",
        "timestamp": datetime(2024, 1, 1, 10, 1, 0),
    },
    {
        "id": "3",
        "role": "user",
        "content": "Can you explain what a monorepo is?",
        "timestamp": datetime(2024, 1, 1, 10, 2, 0),
    },
    {
        "id": "4",
        "role": "assistant",
        "content": "A monorepo is a single repository that contains multiple projects or packages.",
        "timestamp": datetime(2024, 1, 1, 10, 3, 0),
    },
]


@router.get("/messages")
def get_messages():
    return DUMMY_MESSAGES


@router.post("/messages")
def add_message(role: str, content: str):
    new_message = {
        "id": str(len(DUMMY_MESSAGES) + 1),
        "role": role,
        "content": content,
        "timestamp": datetime.now(),
    }
    DUMMY_MESSAGES.append(new_message)
    return new_message
