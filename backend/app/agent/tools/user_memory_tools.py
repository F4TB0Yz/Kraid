import os
from pathlib import Path
from typing import Optional
from app.agent.tools.base import Tool
from app.config import settings
from app.agent.context.user_context import invalidate, get_kraid_dir

def _update_preferences(kraid_dir: Path):
    """Rebuild the PREFERENCES.md index."""
    lines = ["## Kraid User Context Index", "This is an auto-generated index of user memory."]
    
    for type_dir in ["profile", "feedback", "projects", "references"]:
        tdir = kraid_dir / type_dir
        if tdir.exists():
            lines.append(f"\n### {type_dir.capitalize()}")
            for f in sorted(tdir.iterdir()):
                if f.suffix == ".md":
                    # Simple frontmatter parser
                    content = f.read_text(encoding="utf-8")
                    name = f.stem
                    desc = ""
                    clines = content.splitlines()
                    if clines and clines[0].strip() == "---":
                        for line in clines[1:]:
                            if line.strip() == "---": break
                            if line.startswith("name:"): name = line.split(":", 1)[1].strip()
                            if line.startswith("description:"): desc = line.split(":", 1)[1].strip()
                    lines.append(f"- [{name}]({type_dir}/{f.name}) — {desc}")
                    
    pref_file = kraid_dir / "PREFERENCES.md"
    pref_file.write_text("\n".join(lines), encoding="utf-8")

async def user_memory_save_action(type: str, name: str, description: str, content: str, session_id: Optional[str] = None) -> str:
    valid_types = {"profile", "feedback", "projects", "references"}
    if type not in valid_types:
        return f"Error: Invalid type '{type}'. Must be one of {valid_types}."
        
    kraid_dir = get_kraid_dir()
    type_dir = kraid_dir / type
    type_dir.mkdir(parents=True, exist_ok=True)
    
    filename = name
    if not filename.endswith(".md"):
        filename += ".md"
        
    filepath = type_dir / filename
    
    full_content = f"---\nname: {name}\ndescription: {description}\ntype: {type}\n---\n{content}\n"
    filepath.write_text(full_content, encoding="utf-8")
    
    _update_preferences(kraid_dir)
    invalidate(session_id)
    
    return f"Successfully saved memory to {type}/{filename}"

user_memory_save = Tool(
    name="user_memory_save",
    description="Save a new memory about the user, their projects, or preferences.",
    parameters={
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": ["profile", "feedback", "projects", "references"], "description": "The category of the memory."},
            "name": {"type": "string", "description": "A short, unique name for the memory (e.g. rol_usuario). Used as filename."},
            "description": {"type": "string", "description": "A concise, one-sentence description of the memory content for the index."},
            "content": {"type": "string", "description": "The full detailed markdown content of the memory."}
        },
        "required": ["type", "name", "description", "content"],
    },
    execute=user_memory_save_action,
)

async def user_memory_delete_action(type: str, name: str, session_id: Optional[str] = None) -> str:
    kraid_dir = get_kraid_dir()
    
    filename = name
    if not filename.endswith(".md"):
        filename += ".md"
        
    filepath = (kraid_dir / type / filename).resolve()
    
    # Path traversal guard
    if not str(filepath).startswith(str(kraid_dir)):
        return "Error: path traversal detected"
        
    if not filepath.exists():
        return f"Error: Memory {type}/{filename} not found."
        
    filepath.unlink()
    
    _update_preferences(kraid_dir)
    invalidate(session_id)
    
    return f"Successfully deleted memory {type}/{filename}"

user_memory_delete = Tool(
    name="user_memory_delete",
    description="Delete a user memory.",
    parameters={
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": ["profile", "feedback", "projects", "references"], "description": "The category of the memory."},
            "name": {"type": "string", "description": "The name of the memory file to delete (e.g. rol_usuario)."}
        },
        "required": ["type", "name"],
    },
    execute=user_memory_delete_action,
)
