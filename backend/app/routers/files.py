from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from sse_starlette.sse import EventSourceResponse
from app.agent.context.user_context import get_kraid_dir
from app.services.memory_watcher import watcher
from app.services.file_graph import file_graph_instance, FILE_TYPES
from app.services.wiki_links import extract_wiki_links, build_frontmatter
import os

router = APIRouter()

class FileCreate(BaseModel):
    slug: str
    name: str
    type: str
    content: str

class FileUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    content: Optional[str] = None

def _create_stub_for_link(link_slug: str):
    kraid_dir = get_kraid_dir()
    note_dir = kraid_dir / "note"
    note_dir.mkdir(parents=True, exist_ok=True)
    filepath = note_dir / f"{link_slug}.md"
    if not filepath.exists():
        fm = build_frontmatter({"name": link_slug, "type": "note"})
        filepath.write_text(f"{fm}\n\n", encoding="utf-8")

@router.get("/")
async def list_files():
    graph = file_graph_instance.get_graph()
    files = []
    for slug, node in graph.items():
        try:
            stat = node.filepath.stat()
            # We don't read full content here to save time, we just return metadata
            files.append({
                "slug": node.slug,
                "name": node.name,
                "type": node.type,
                "lastModified": stat.st_mtime * 1000,
                "links": node.links,
                "backlinks": node.backlinks
            })
        except Exception:
            pass
    return files

@router.get("/tree")
async def get_tree():
    return file_graph_instance.get_tree()

@router.get("/stream")
async def stream_file_events():
    async def event_generator():
        async for event in watcher.event_generator():
            yield {"event": event["event"], "data": event["data"]}
    
    return EventSourceResponse(content=event_generator())

@router.get("/{slug}")
async def read_file(slug: str):
    graph = file_graph_instance.get_graph()
    if slug not in graph:
        raise HTTPException(status_code=404, detail="File not found")
        
    node = graph[slug]
    if not node.filepath.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    content = node.filepath.read_text(encoding="utf-8")
    
    return {
        "slug": node.slug,
        "name": node.name,
        "type": node.type,
        "content": content,
        "tags": [],
        "lastModified": node.filepath.stat().st_mtime * 1000,
        "wordCount": len([w for w in content.split() if w]),
        "links": node.links,
        "backlinks": node.backlinks
    }

@router.post("/")
async def create_file(data: FileCreate):
    if data.type not in FILE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")
        
    kraid_dir = get_kraid_dir()
    type_dir = kraid_dir / data.type
    type_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = (type_dir / f"{data.slug}.md").resolve()
    if not str(filepath).startswith(str(kraid_dir)):
        raise HTTPException(status_code=400, detail="Path traversal")
        
    filepath.write_text(data.content, encoding="utf-8")
    
    # Auto-create links
    links = extract_wiki_links(data.content)
    graph = file_graph_instance.get_graph()
    for link in links:
        if link not in graph:
            _create_stub_for_link(link)
            
    # Quick return based on what we just wrote
    return {
        "slug": data.slug,
        "name": data.name,
        "type": data.type,
        "content": data.content,
        "tags": [],
        "lastModified": filepath.stat().st_mtime * 1000,
        "wordCount": len([w for w in data.content.split() if w]),
        "links": links,
        "backlinks": []
    }

@router.put("/{slug}")
async def update_file(slug: str, data: FileUpdate):
    graph = file_graph_instance.get_graph()
    if slug not in graph:
        raise HTTPException(status_code=404, detail="File not found")
        
    node = graph[slug]
    filepath = node.filepath
    
    if data.content is not None:
        filepath.write_text(data.content, encoding="utf-8")
        # Auto-create links
        links = extract_wiki_links(data.content)
        # re-fetch graph or use existing to check
        for link in links:
            if link not in graph and link != slug:
                _create_stub_for_link(link)
                
    # Re-read
    content = filepath.read_text(encoding="utf-8")
    links = extract_wiki_links(content)
    
    return {
        "slug": node.slug,
        "name": data.name or node.name,
        "type": node.type,
        "content": content,
        "tags": [],
        "lastModified": filepath.stat().st_mtime * 1000,
        "wordCount": len([w for w in content.split() if w]),
        "links": links,
        "backlinks": node.backlinks
    }

@router.delete("/{slug}")
async def delete_file(slug: str):
    graph = file_graph_instance.get_graph()
    if slug not in graph:
        raise HTTPException(status_code=404, detail="File not found")
        
    node = graph[slug]
    if node.filepath.exists():
        node.filepath.unlink()
        
    return {"status": "ok"}
