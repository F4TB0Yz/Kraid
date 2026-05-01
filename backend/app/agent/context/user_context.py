import os
from pathlib import Path
from typing import Tuple, Optional
from cachetools import TTLCache
from app.config import settings

# Cache (session_id) -> (context_block, mtime)
# TTL is 30 mins
_cache = TTLCache(maxsize=64, ttl=1800)

def invalidate(session_id: Optional[str]) -> None:
    """Invalidate the cache for the given session ID."""
    if session_id and session_id in _cache:
        del _cache[session_id]

def get_kraid_dir() -> Path:
    return settings.resolved_repo_root / ".kraid"

def _get_dir_mtime(directory: Path) -> float:
    """Get the latest modification time of the directory and its contents."""
    if not directory.exists():
        return 0.0
    latest = directory.stat().st_mtime
    for root, _, files in os.walk(directory):
        for f in files:
            mtime = (Path(root) / f).stat().st_mtime
            if mtime > latest:
                latest = mtime
    return latest

def _extract_frontmatter(filepath: Path) -> str:
    """Extract frontmatter and return a concise summary."""
    try:
        content = filepath.read_text(encoding="utf-8")
        lines = content.splitlines()
        if not lines or lines[0].strip() != "---":
            return f"- [{filepath.stem}]({filepath.parent.name}/{filepath.name}) - (No frontmatter)"
        
        name = filepath.stem
        desc = ""
        type_str = filepath.parent.name
        
        for line in lines[1:]:
            if line.strip() == "---":
                break
            if line.startswith("name:"):
                name = line.split(":", 1)[1].strip()
            elif line.startswith("description:"):
                desc = line.split(":", 1)[1].strip()
            elif line.startswith("type:"):
                type_str = line.split(":", 1)[1].strip()
        
        return f"- [{name}]({type_str}/{filepath.name}) - {desc}"
    except Exception as e:
        return f"- [{filepath.stem}]({filepath.parent.name}/{filepath.name}) - Error reading"

def build_user_context_block(session_id: Optional[str] = None) -> str:
    kraid_dir = get_kraid_dir()
    if not kraid_dir.exists():
        return ""
    
    current_mtime = _get_dir_mtime(kraid_dir)
    
    if session_id and session_id in _cache:
        cached_block, cached_mtime = _cache[session_id]
        if cached_mtime == current_mtime:
            return cached_block
            
    # Rebuild context
    lines = ["\n<user_context>"]
    
    pref_file = kraid_dir / "PREFERENCES.md"
    if pref_file.exists():
        lines.append(pref_file.read_text(encoding="utf-8").strip())
    else:
        # Fallback to generating index
        lines.append("## Kraid Memories")
        for type_dir in ["profile", "feedback", "projects", "references"]:
            tdir = kraid_dir / type_dir
            if tdir.exists():
                lines.append(f"\n### {type_dir.capitalize()}")
                for f in sorted(tdir.iterdir()):
                    if f.suffix == ".md":
                        lines.append(_extract_frontmatter(f))
                        
    lines.append("</user_context>\n")
    block = "\n".join(lines)
    
    if session_id:
        _cache[session_id] = (block, current_mtime)
        
    return block
