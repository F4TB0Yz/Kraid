import json
from app.agent.tools.base import Tool
from app.services.canvas_store import canvas_store


async def canvas_list_action() -> str:
    docs = canvas_store.list()
    summary = []
    for d in docs:
        summary.append({"id": d["id"], "title": d["title"], "updated_at": d["updated_at"]})
    return json.dumps(summary, indent=2)


canvas_list = Tool(
    name="canvas_list",
    description="List all canvas documents with id and title",
    parameters={
        "type": "object",
        "properties": {},
        "required": [],
    },
    execute=canvas_list_action,
)


async def canvas_read_action(doc_id: str) -> str:
    doc = canvas_store.get(doc_id)
    if not doc:
        return f"Error: document '{doc_id}' not found"
    return json.dumps(doc, indent=2)


canvas_read = Tool(
    name="canvas_read",
    description="Read a canvas document by id",
    parameters={
        "type": "object",
        "properties": {
            "doc_id": {"type": "string", "description": "Document id"}
        },
        "required": ["doc_id"],
    },
    execute=canvas_read_action,
)


async def canvas_create_action(title: str, content: str = "") -> str:
    doc = canvas_store.create(title, content)
    return json.dumps(doc, indent=2)


canvas_create = Tool(
    name="canvas_create",
    description="Create a new canvas document",
    parameters={
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Document title"},
            "content": {"type": "string", "description": "Document content (markdown)"},
        },
        "required": ["title"],
    },
    execute=canvas_create_action,
)


async def canvas_edit_action(doc_id: str, content: str) -> str:
    doc = canvas_store.update(doc_id, content)
    if not doc:
        return f"Error: document '{doc_id}' not found"
    return json.dumps(doc, indent=2)


canvas_edit = Tool(
    name="canvas_edit",
    description="Edit a canvas document's content",
    parameters={
        "type": "object",
        "properties": {
            "doc_id": {"type": "string", "description": "Document id"},
            "content": {"type": "string", "description": "New markdown content"},
        },
        "required": ["doc_id", "content"],
    },
    execute=canvas_edit_action,
)
