from datetime import datetime
from typing import Optional


class CanvasDocument:
    def __init__(self, doc_id: str, title: str, content: str = ""):
        self.id = doc_id
        self.title = title
        self.content = content
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class CanvasStore:
    def __init__(self):
        self._docs: dict[str, CanvasDocument] = {}
        self._seed()

    def _seed(self) -> None:
        doc = CanvasDocument(
            "doc-1",
            "Welcome Document",
            "# Welcome to Kraid\n\nThis is a **markdown canvas** where you can view and edit documents.\n\n## Features\n\n- Split screen layout\n- Real-time markdown rendering\n- Clean architecture\n\nStart writing your content here...",
        )
        self._docs[doc.id] = doc

    def list(self) -> list[dict]:
        return [d.to_dict() for d in self._docs.values()]

    def get(self, doc_id: str) -> Optional[dict]:
        doc = self._docs.get(doc_id)
        return doc.to_dict() if doc else None

    def create(self, title: str, content: str = "") -> dict:
        doc_id = f"doc-{int(datetime.now().timestamp() * 1000)}"
        doc = CanvasDocument(doc_id, title, content)
        self._docs[doc_id] = doc
        return doc.to_dict()

    def update(self, doc_id: str, content: str) -> Optional[dict]:
        doc = self._docs.get(doc_id)
        if not doc:
            return None
        doc.content = content
        doc.updated_at = datetime.now()
        return doc.to_dict()


canvas_store = CanvasStore()
