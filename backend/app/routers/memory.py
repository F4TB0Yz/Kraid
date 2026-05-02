from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from sse_starlette.sse import EventSourceResponse
from app.agent.context.user_context import get_kraid_dir
from app.services.memory_watcher import watcher
import os

router = APIRouter()

class MemoryFileCreate(BaseModel):
    title: str
    filename: str
    type: str
    content: str

class MemoryFileUpdate(BaseModel):
    title: Optional[str] = None
    filename: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None

VALID_TYPES = {"profile", "feedback", "projects", "references"}

def get_file_details(filepath: Path, type: str) -> dict:
    content = filepath.read_text(encoding="utf-8")
    title = filepath.stem
    # simple frontmatter parse
    clines = content.splitlines()
    if clines and clines[0].strip() == "---":
        for line in clines[1:]:
            if line.strip() == "---": break
            if line.startswith("name:"): title = line.split(":", 1)[1].strip()
    
    stat = filepath.stat()
    return {
        "id": f"{type}-{filepath.name}",
        "filename": filepath.name,
        "title": title,
        "type": type,
        "content": content,
        "lastModified": stat.st_mtime * 1000, # ms for JS Date
        "wordCount": len([w for w in content.split() if w])
    }

@router.get("/")
async def list_memory():
    kraid_dir = get_kraid_dir()
    files = []
    for type_dir in VALID_TYPES:
        tdir = kraid_dir / type_dir
        if tdir.exists():
            for f in tdir.iterdir():
                if f.suffix == ".md":
                    files.append(get_file_details(f, type_dir))
    return files

@router.get("/{type}/{filename}")
async def read_memory(type: str, filename: str):
    if type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")
    
    filepath = (get_kraid_dir() / type / filename).resolve()
    if not str(filepath).startswith(str(get_kraid_dir())):
        raise HTTPException(status_code=400, detail="Path traversal")
        
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return get_file_details(filepath, type)

@router.post("/")
async def create_memory(data: MemoryFileCreate):
    if data.type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")
        
    filepath = (get_kraid_dir() / data.type / data.filename).resolve()
    if not str(filepath).startswith(str(get_kraid_dir())):
        raise HTTPException(status_code=400, detail="Path traversal")
        
    if not filepath.suffix == ".md":
        filepath = filepath.with_suffix(".md")
        
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(data.content, encoding="utf-8")
    
    # Let tools auto-index handling PREFERENCES.md later or index here if needed
    return get_file_details(filepath, data.type)

@router.put("/{type}/{filename}")
async def update_memory(type: str, filename: str, data: MemoryFileUpdate):
    if type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")
        
    filepath = (get_kraid_dir() / type / filename).resolve()
    if not str(filepath).startswith(str(get_kraid_dir())):
        raise HTTPException(status_code=400, detail="Path traversal")
        
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    # Handling file move is complex, keeping it simple: update content for now
    if data.content is not None:
        filepath.write_text(data.content, encoding="utf-8")
        
    return get_file_details(filepath, type)

@router.delete("/{type}/{filename}")
async def delete_memory(type: str, filename: str):
    if type not in VALID_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")
        
    filepath = (get_kraid_dir() / type / filename).resolve()
    if not str(filepath).startswith(str(get_kraid_dir())):
        raise HTTPException(status_code=400, detail="Path traversal")
        
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    filepath.unlink()
    return {"status": "ok"}

@router.get("/stream")
async def stream_memory_events():
    async def event_generator():
        async for event in watcher.event_generator():
            yield {"event": event["event"], "data": event["data"]}
    
    return EventSourceResponse(content=event_generator())
