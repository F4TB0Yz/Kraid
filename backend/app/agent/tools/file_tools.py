import json
from typing import Optional
from pathlib import Path
from app.agent.tools.base import Tool
from app.services.file_graph import file_graph_instance, FILE_TYPES
from app.services.wiki_links import build_frontmatter, parse_frontmatter, extract_wiki_links
from app.agent.context.user_context import get_kraid_dir, invalidate

async def file_write_action(
    slug: str,
    name: str,
    type: str,
    content: str,
    mode: str = "create",
    session_id: Optional[str] = None
) -> str:
    if type not in FILE_TYPES:
        return f"Error: tipo '{type}' inválido. Debe ser uno de {FILE_TYPES}."

    kraid_dir = get_kraid_dir()
    type_dir = kraid_dir / type
    type_dir.mkdir(parents=True, exist_ok=True)
    
    filepath = (type_dir / f"{slug}.md").resolve()
    if not str(filepath).startswith(str(kraid_dir)):
        return "Error: path traversal detectado."

    if mode == "update" and filepath.exists():
        existing_content = filepath.read_text(encoding="utf-8")
        existing_fm, existing_body = parse_frontmatter(existing_content)
        
        merged_fm = {**existing_fm, "name": name, "type": type}
        final_body = content if content.strip() else existing_body
    else:
        merged_fm = {"name": name, "type": type}
        final_body = content

    fm_str = build_frontmatter(merged_fm)
    full_content = f"{fm_str}\n\n{final_body.strip()}\n"
    filepath.write_text(full_content, encoding="utf-8")

    # Stubs
    links = extract_wiki_links(full_content)
    graph = file_graph_instance.get_graph()
    note_dir = kraid_dir / "note"
    note_dir.mkdir(parents=True, exist_ok=True)
    for link in links:
        if link not in graph and link != slug:
            l_path = note_dir / f"{link}.md"
            if not l_path.exists():
                l_fm = build_frontmatter({"name": link, "type": "note"})
                l_path.write_text(f"{l_fm}\n\n", encoding="utf-8")

    if session_id:
        invalidate(session_id)

    action_label = "actualizado" if mode == "update" else "creado"
    return f"Archivo {action_label}: {type}/{slug}.md"

file_write = Tool(
    name="file_write",
    description="Crea o actualiza un archivo de conocimiento en el sistema. Utiliza wiki-links [[slug]] en el contenido para enlazar con otros archivos.",
    parameters={
        "type": "object",
        "properties": {
            "slug": {"type": "string", "description": "Identificador único kebab-case (ej: 'proyecto-tesis')."},
            "name": {"type": "string", "description": "Título o nombre legible del archivo."},
            "type": {
                "type": "string", 
                "enum": list(FILE_TYPES), 
                "description": "Tipo de entidad."
            },
            "content": {"type": "string", "description": "Cuerpo Markdown. Usa [[slug]] para referenciar otros archivos."},
            "mode": {"type": "string", "enum": ["create", "update"], "description": "create (sobrescribe) o update (combina metadatos)."}
        },
        "required": ["slug", "name", "type", "content"]
    },
    execute=file_write_action
)

async def file_list_action(type: Optional[str] = None) -> str:
    graph = file_graph_instance.get_graph()
    if not graph:
        return "No hay archivos en el sistema."
        
    lines = []
    for slug, node in graph.items():
        if type and node.type != type:
            continue
        
        link_str = f", links={len(node.links)}" if node.links else ""
        backlink_str = f", backlinks={len(node.backlinks)}" if node.backlinks else ""
        lines.append(f"- [{node.type}] {slug} (name='{node.name}'{link_str}{backlink_str})")
        
    if not lines:
        return f"No hay archivos del tipo {type}."
        
    return "\n".join(sorted(lines))

file_list = Tool(
    name="file_list",
    description="Lista los archivos del sistema, opcionalmente filtrados por tipo.",
    parameters={
        "type": "object",
        "properties": {
            "type": {"type": "string", "enum": list(FILE_TYPES), "description": "Filtrar por tipo."}
        }
    },
    execute=file_list_action
)

async def file_read_action(slug: str) -> str:
    graph = file_graph_instance.get_graph()
    if slug not in graph:
        return f"Error: No se encontró el archivo con slug '{slug}'."
        
    node = graph[slug]
    if not node.filepath.exists():
        return f"Error: Archivo {slug} no existe en disco."
        
    content = node.filepath.read_text(encoding="utf-8")
    
    metadata = f"--- METADATA ---\nSlug: {node.slug}\nName: {node.name}\nType: {node.type}\nLinks: {', '.join(node.links)}\nBacklinks: {', '.join(node.backlinks)}\n----------------\n\n"
    return metadata + content

file_read = Tool(
    name="file_read",
    description="Lee el contenido y metadata de un archivo por su slug.",
    parameters={
        "type": "object",
        "properties": {
            "slug": {"type": "string", "description": "El slug del archivo a leer."}
        },
        "required": ["slug"]
    },
    execute=file_read_action
)

async def file_delete_action(slug: str, session_id: Optional[str] = None) -> str:
    graph = file_graph_instance.get_graph()
    if slug not in graph:
        return f"Error: No se encontró el archivo con slug '{slug}'."
        
    node = graph[slug]
    if node.filepath.exists():
        node.filepath.unlink()
        if session_id:
            invalidate(session_id)
        return f"Archivo {slug} eliminado."
    return f"Error: Archivo {slug} no existía en disco."

file_delete = Tool(
    name="file_delete",
    description="Elimina un archivo del sistema por su slug.",
    parameters={
        "type": "object",
        "properties": {
            "slug": {"type": "string", "description": "El slug del archivo a eliminar."}
        },
        "required": ["slug"]
    },
    execute=file_delete_action
)
