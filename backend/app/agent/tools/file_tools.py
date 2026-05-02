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
    project: Optional[str] = None,
    session_id: Optional[str] = None
) -> str:
    if type not in FILE_TYPES:
        return f"Error: tipo '{type}' inválido. Debe ser uno de {FILE_TYPES}."

    # Validate project references
    warnings: list[str] = []
    if project is not None:
        graph = file_graph_instance.get_graph()
        if project and project not in graph:
            warnings.append(
                f"ADVERTENCIA: El proyecto '{project}' no existe en el sistema. "
                "El campo 'project' se guardará en frontmatter, pero el proyecto destino no se ha creado aún."
            )

    # Validate content wiki-links to projects
    content_links = extract_wiki_links(content)
    graph = file_graph_instance.get_graph()
    for link in content_links:
        if link in graph and graph[link].type == "project" and link != project:
            warnings.append(
                f"AVISO: El contenido referencia [[{link}]] (un proyecto existente), "
                f"pero el campo 'project' no está configurado para este archivo. "
                f"Si este archivo pertenece a ese proyecto, usa project=\"{link}\"."
            )
            break

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
        if project is not None:
            merged_fm["project"] = project
        elif "project" in merged_fm and project is None:
            merged_fm["project"] = ""
        final_body = content if content.strip() else existing_body
    else:
        merged_fm = {"name": name, "type": type}
        if project is not None:
            merged_fm["project"] = project
        final_body = content

    fm_str = build_frontmatter(merged_fm)
    full_content = f"{fm_str}\n\n{final_body.strip()}\n"
    filepath.write_text(full_content, encoding="utf-8")

    # Stubs — skip links that are existing projects to prevent noise
    for link in content_links:
        if link not in graph and link != slug:
            l_path = get_kraid_dir() / "note" / f"{link}.md"
            if not l_path.exists():
                l_path.parent.mkdir(parents=True, exist_ok=True)
                l_fm = build_frontmatter({"name": link, "type": "note"})
                l_path.write_text(f"{l_fm}\n\n", encoding="utf-8")

    if session_id:
        invalidate(session_id)

    action_label = "actualizado" if mode == "update" else "creado"
    result = f"Archivo {action_label}: {type}/{slug}.md"
    if warnings:
        result += "\n" + "\n".join(warnings)
    return result

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
            "mode": {"type": "string", "enum": ["create", "update"], "description": "create (sobrescribe) o update (combina metadatos)."},
            "project": {"type": "string", "description": "Slug del proyecto al que pertenece (opcional). Si se omite, la entidad es independiente."}
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
        project_str = f", project={node.project}" if node.project else ""
        lines.append(f"- [{node.type}] {slug} (name='{node.name}'{project_str}{link_str}{backlink_str})")
        
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
    
    project_str = f"\nProject: {node.project}" if node.project else ""
    metadata = f"--- METADATA ---\nSlug: {node.slug}\nName: {node.name}\nType: {node.type}{project_str}\nLinks: {', '.join(node.links)}\nBacklinks: {', '.join(node.backlinks)}\n----------------\n\n"
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
