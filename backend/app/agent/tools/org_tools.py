import re
import unicodedata
from pathlib import Path
from typing import Optional
from app.agent.tools.base import Tool
from app.agent.context.user_context import get_kraid_dir

ORG_TYPES = ("project", "task", "note", "custom")

_REQUIRED_FIELDS: dict[str, list[str]] = {
    "project": ["name", "methodology"],
    "task": ["name", "subject"],
    "note": ["name"],
    "custom": ["name"],
}

_METHODOLOGY_BODIES = {
    "scrum": "# Backlog\n\n# Sprint 1\n\n# Done\n",
    "kanban": "# To Do\n\n# In Progress\n\n# Done\n",
}


def _to_kebab(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.lower()
    return re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")


def _build_frontmatter(fields: dict) -> str:
    lines = ["---"]
    for k, v in fields.items():
        if isinstance(v, list):
            lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)


def _read_existing(filepath: Path) -> tuple[dict, str]:
    """Parse existing file into (frontmatter_dict, body)."""
    try:
        content = filepath.read_text(encoding="utf-8")
        lines = content.splitlines()
        if not lines or lines[0].strip() != "---":
            return {}, content
        fm: dict = {}
        end_idx = 1
        for i, line in enumerate(lines[1:], start=1):
            if line.strip() == "---":
                end_idx = i + 1
                break
            if ":" in line:
                k, _, v = line.partition(":")
                fm[k.strip()] = v.strip()
        body = "\n".join(lines[end_idx:])
        return fm, body
    except Exception:
        return {}, ""


async def org_entry_write_action(
    type: str,
    slug: str,
    frontmatter: dict,
    body: str,
    mode: str = "create",
) -> str:
    if type not in ORG_TYPES:
        return f"Error: tipo '{type}' inválido. Debe ser uno de {ORG_TYPES}."

    required = _REQUIRED_FIELDS.get(type, ["name"])
    missing = [f for f in required if f not in frontmatter]
    if missing:
        return f"Error: campos requeridos faltantes para tipo '{type}': {missing}"

    clean_slug = _to_kebab(slug)
    if not clean_slug:
        return "Error: slug inválido."

    # Path traversal guard
    kraid_dir = get_kraid_dir()
    org_dir = kraid_dir / "org" / type
    org_dir.mkdir(parents=True, exist_ok=True)
    filepath = (org_dir / f"{clean_slug}.md").resolve()
    if not str(filepath).startswith(str(org_dir.resolve())):
        return "Error: path traversal detectado."

    if mode == "update" and filepath.exists():
        existing_fm, existing_body = _read_existing(filepath)
        merged_fm = {**existing_fm, **frontmatter}
        final_body = body if body.strip() else existing_body
    else:
        merged_fm = {"name": frontmatter.get("name", clean_slug), "type": type, **frontmatter}
        # Auto-generate body for projects based on methodology
        if not body.strip() and type == "project":
            methodology = frontmatter.get("methodology", "kanban")
            final_body = _METHODOLOGY_BODIES.get(methodology, "")
        else:
            final_body = body

    fm_str = _build_frontmatter(merged_fm)
    full_content = f"{fm_str}\n\n{final_body.strip()}\n"
    filepath.write_text(full_content, encoding="utf-8")

    action_label = "actualizado" if mode == "update" and filepath.exists() else "creado"
    return f"Entrada {action_label}: org/{type}/{clean_slug}.md"


org_entry_write = Tool(
    name="org_entry_write",
    description=(
        "Crea o actualiza una entrada organizacional (proyecto, tarea, nota, custom) "
        "en el directorio .kraid/org/. Usar mode='update' para hacer merge con datos existentes."
    ),
    parameters={
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": list(ORG_TYPES),
                "description": "Tipo de entidad.",
            },
            "slug": {
                "type": "string",
                "description": "Identificador único kebab-case (ej: 'proyecto-tesis'). Se sanitiza automáticamente.",
            },
            "frontmatter": {
                "type": "object",
                "description": (
                    "Campos de la entidad. "
                    "project requiere: name, methodology (scrum|kanban). "
                    "task requiere: name, subject. "
                    "note requiere: name. "
                    "custom requiere: name."
                ),
            },
            "body": {
                "type": "string",
                "description": "Cuerpo Markdown de la entidad. Para proyectos se genera automáticamente si se omite.",
            },
            "mode": {
                "type": "string",
                "enum": ["create", "update"],
                "description": "create: sobrescribe (default). update: merge con datos existentes.",
            },
        },
        "required": ["type", "slug", "frontmatter"],
    },
    execute=org_entry_write_action,
)


async def org_entry_list_action(type: Optional[str] = None) -> str:
    kraid_dir = get_kraid_dir()
    org_dir = kraid_dir / "org"
    if not org_dir.exists():
        return "No hay entidades guardadas aún."

    types_to_scan = [type] if type and type in ORG_TYPES else list(ORG_TYPES)
    lines: list[str] = []

    for t in types_to_scan:
        type_dir = org_dir / t
        if not type_dir.exists():
            continue
        files = sorted(type_dir.glob("*.md"))
        if not files:
            continue
        lines.append(f"\n### {t}")
        for f in files:
            try:
                content = f.read_text(encoding="utf-8")
                file_lines = content.splitlines()
                name = f.stem
                extra: dict = {}
                if file_lines and file_lines[0].strip() == "---":
                    for line in file_lines[1:]:
                        if line.strip() == "---":
                            break
                        if ":" in line:
                            k, _, v = line.partition(":")
                            k, v = k.strip(), v.strip()
                            if k == "name":
                                name = v
                            elif k in ("status", "methodology", "subject", "due"):
                                extra[k] = v
                extra_str = " | ".join(f"{k}={v}" for k, v in extra.items())
                lines.append(f"- slug={f.stem} | name={name}" + (f" | {extra_str}" if extra_str else ""))
            except Exception:
                lines.append(f"- slug={f.stem}")

    return "\n".join(lines) if lines else "No hay entidades del tipo solicitado."


org_entry_list = Tool(
    name="org_entry_list",
    description="Lista las entradas organizacionales guardadas. Pasar type para filtrar por tipo.",
    parameters={
        "type": "object",
        "properties": {
            "type": {
                "type": "string",
                "enum": list(ORG_TYPES),
                "description": "Filtrar por tipo. Omitir para listar todos.",
            },
        },
        "required": [],
    },
    execute=org_entry_list_action,
)
