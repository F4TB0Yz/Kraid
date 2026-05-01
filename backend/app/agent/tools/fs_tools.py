import json
import os
from pathlib import Path
from app.config import settings
from app.agent.tools.base import Tool

SKIP_DIRS = {".venv", "venv", "node_modules", ".git", "dist", "dist-ssr", "__pycache__", ".vite", ".idea", ".vscode"}
MAX_FILE_SIZE = 500 * 1024


def _resolve_path(path: str) -> Path:
    p = Path(path)
    if p.is_absolute():
        return p
    return settings.resolved_repo_root / path


def _check_sandbox(path: Path) -> Path:
    resolved = path.resolve()
    root = settings.resolved_repo_root
    if not resolved.is_relative_to(root):
        raise PermissionError(f"Access denied: {resolved} is outside repo root {root}")
    return resolved


async def fs_read_action(path: str) -> str:
    full_path = _check_sandbox(_resolve_path(path))
    if not full_path.exists():
        return f"Error: path '{path}' not found"
    if full_path.is_dir():
        return "Error: path is a directory, use fs_list"
    content = full_path.read_text(encoding="utf-8")
    return content


fs_read = Tool(
    name="fs_read",
    description="Read a file from the repository (returning its text content)",
    parameters={
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Relative or absolute path within the repo"}
        },
        "required": ["path"],
    },
    execute=fs_read_action,
)


async def fs_write_action(path: str, content: str) -> str:
    full_path = _check_sandbox(_resolve_path(path))
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_text(content, encoding="utf-8")
    return f"Written {len(content)} bytes to {path}"


fs_write = Tool(
    name="fs_write",
    description="Write content to a file in the repository (creates or overwrites)",
    parameters={
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "File path within the repo"},
            "content": {"type": "string", "description": "File content"},
        },
        "required": ["path", "content"],
    },
    execute=fs_write_action,
)


async def fs_list_action(path: str = ".") -> str:
    full_path = _check_sandbox(_resolve_path(path))
    if not full_path.exists():
        return f"Error: path '{path}' not found"
    if not full_path.is_dir():
        return f"Error: path '{path}' is not a directory"
    entries = []
    for entry in sorted(full_path.iterdir()):
        entries.append({
            "name": entry.name,
            "type": "dir" if entry.is_dir() else "file",
            "size": entry.stat().st_size if entry.is_file() else 0,
        })
    return json.dumps(entries, indent=2)


fs_list = Tool(
    name="fs_list",
    description="List files and directories in a path within the repo",
    parameters={
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Directory path (default: repo root)"}
        },
        "required": [],
    },
    execute=fs_list_action,
)


async def fs_search_action(query: str, path: str = ".") -> str:
    full_path = _check_sandbox(_resolve_path(path))
    if not full_path.exists():
        return f"Error: path '{path}' not found"
    results = []
    for filepath in full_path.rglob("*"):
        if filepath.is_file():
            parts = filepath.parts
            if any(d in SKIP_DIRS for d in parts):
                continue
            try:
                if filepath.stat().st_size > MAX_FILE_SIZE:
                    continue
                text = filepath.read_text(encoding="utf-8", errors="ignore")
                if query.lower() in text.lower():
                    results.append({
                        "file": str(filepath.relative_to(settings.resolved_repo_root)),
                        "size": filepath.stat().st_size,
                    })
                    if len(results) >= 100:
                        break
            except Exception:
                pass
    return json.dumps(results, indent=2)


fs_search = Tool(
    name="fs_search",
    description="Search for text in files within the repo",
    parameters={
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Text to search for"},
            "path": {"type": "string", "description": "Directory to search in (default: repo root)"},
        },
        "required": ["query"],
    },
    execute=fs_search_action,
)