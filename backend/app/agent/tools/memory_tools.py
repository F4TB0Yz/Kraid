import json
import os
from pathlib import Path
from app.config import settings
from app.agent.tools.base import Tool


def _memory_dir() -> Path:
    base = settings.resolved_repo_root
    mem_dir = base / ".kraid"
    mem_dir.mkdir(parents=True, exist_ok=True)
    return mem_dir


async def memory_list_action() -> str:
    mem_dir = _memory_dir()
    files = []
    # Search recursively for markdown files in .kraid/
    for root, dirs, filenames in os.walk(mem_dir):
        for name in filenames:
            if name.endswith(".md"):
                fpath = Path(root) / name
                rel_path = fpath.relative_to(mem_dir)
                files.append({"filename": str(rel_path), "size": fpath.stat().st_size})
    files = sorted(files, key=lambda x: x["filename"])
    return json.dumps(files, indent=2)


memory_list = Tool(
    name="memory_list",
    description="List memory markdown files",
    parameters={
        "type": "object",
        "properties": {},
        "required": [],
    },
    execute=memory_list_action,
)


async def memory_read_action(filename: str) -> str:
    mem_dir = _memory_dir()
    filepath = (mem_dir / filename).resolve()
    if not str(filepath).startswith(str(mem_dir)):
        return "Error: path traversal detected"
    if not filepath.exists() or not filepath.is_file():
        return f"Error: file '{filename}' not found"
    return filepath.read_text(encoding="utf-8")


memory_read = Tool(
    name="memory_read",
    description="Read a memory markdown file",
    parameters={
        "type": "object",
        "properties": {
            "filename": {"type": "string", "description": "Memory filename, e.g. PREFERENCES.md, profile/rol.md"}
        },
        "required": ["filename"],
    },
    execute=memory_read_action,
)


async def memory_write_action(filename: str, content: str) -> str:
    mem_dir = _memory_dir()
    filepath = (mem_dir / filename).resolve()
    if not str(filepath).startswith(str(mem_dir)):
        return "Error: path traversal detected"
    if not filename.endswith(".md"):
        filename += ".md"
        filepath = (mem_dir / filename).resolve()
        if not str(filepath).startswith(str(mem_dir)):
            return "Error: path traversal detected"
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(content, encoding="utf-8")
    return f"Written {len(content)} bytes to {filename}"


memory_write = Tool(
    name="memory_write",
    description="Write content to a memory markdown file (creates or overwrites)",
    parameters={
        "type": "object",
        "properties": {
            "filename": {"type": "string", "description": "Memory filename, e.g. profile/rol.md"},
            "content": {"type": "string", "description": "Markdown content"},
        },
        "required": ["filename", "content"],
    },
    execute=memory_write_action,
)
