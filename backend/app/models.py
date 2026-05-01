from pydantic import BaseModel
from datetime import datetime
from typing import Literal


class Message(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    timestamp: datetime


class Document(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime
