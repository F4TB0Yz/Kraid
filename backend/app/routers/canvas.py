from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

DUMMY_DOCUMENT = {
    "id": "doc-1",
    "title": "Welcome Document",
    "content": "# Welcome to Kraid\n\nThis is a **markdown canvas** where you can view and edit documents.\n\n## Features\n\n- Split screen layout\n- Real-time markdown rendering\n- Clean architecture",
    "created_at": datetime(2024, 1, 1, 10, 0, 0),
    "updated_at": datetime(2024, 1, 1, 10, 0, 0),
}


@router.get("/document")
def get_document():
    return DUMMY_DOCUMENT


@router.put("/document")
def update_document(content: str):
    DUMMY_DOCUMENT["content"] = content
    DUMMY_DOCUMENT["updated_at"] = datetime.now()
    return DUMMY_DOCUMENT
