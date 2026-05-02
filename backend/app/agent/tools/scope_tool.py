from typing import Optional
from app.agent.tools.base import Tool
from app.agent.context.scope_context import scope_context
from app.services.file_graph import file_graph_instance


async def set_scope_action(
    scope: str,
    project_slug: Optional[str] = None,
    session_id: Optional[str] = None,
) -> str:
    if scope == "personal":
        if session_id:
            scope_context.set_scope(session_id, None)
        return "Ámbito cambiado a: modo personal. Las nuevas entidades no se asociarán a ningún proyecto por defecto."

    if scope == "project":
        if not project_slug:
            return "Error: Debes proporcionar project_slug cuando el ámbito es 'project'."

        graph = file_graph_instance.get_graph()
        if project_slug not in graph:
            return f"Error: No existe un proyecto con slug '{project_slug}'. Verifica con file_list o crea el proyecto primero."

        if session_id:
            scope_context.set_scope(session_id, "project", project_slug)
        return f"Ámbito cambiado a: proyecto [[{project_slug}]]. Las nuevas tareas y notas se asociarán a este proyecto."

    return f"Error: Ámbito '{scope}' inválido. Debe ser 'personal' o 'project'."


set_scope = Tool(
    name="set_scope",
    description="Define el ámbito de trabajo actual. En modo 'project', las nuevas entidades se asocian automáticamente a ese proyecto. En modo 'personal', no se asocian a ningún proyecto. Úsala cuando el contexto deje claro en qué proyecto se está trabajando, o cuando el usuario cambie explícitamente de tema.",
    parameters={
        "type": "object",
        "properties": {
            "scope": {
                "type": "string",
                "enum": ["personal", "project"],
                "description": "'personal' para modo independiente, 'project' para trabajar dentro de un proyecto específico.",
            },
            "project_slug": {
                "type": "string",
                "description": "Slug del proyecto si scope='project'. Ignorado si scope='personal'.",
            },
        },
        "required": ["scope"],
    },
    execute=set_scope_action,
)
