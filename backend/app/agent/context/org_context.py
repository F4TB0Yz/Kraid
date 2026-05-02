from pathlib import Path
from app.agent.context.user_context import get_kraid_dir

ORG_TYPES = ("project", "task", "note", "custom")


def _parse_frontmatter(filepath: Path) -> dict:
    try:
        content = filepath.read_text(encoding="utf-8")
        lines = content.splitlines()
        if not lines or lines[0].strip() != "---":
            return {"name": filepath.stem}
        result = {}
        for line in lines[1:]:
            if line.strip() == "---":
                break
            if ":" in line:
                key, _, val = line.partition(":")
                result[key.strip()] = val.strip()
        return result
    except Exception:
        return {"name": filepath.stem}


def build_org_context_snapshot() -> str:
    kraid_dir = get_kraid_dir()
    org_dir = kraid_dir / "org"
    if not org_dir.exists():
        return "<org_context>\nNo hay entidades organizacionales guardadas aún.\n</org_context>"

    entries: list[str] = []
    for type_name in ORG_TYPES:
        type_dir = org_dir / type_name
        if not type_dir.exists():
            continue
        for f in sorted(type_dir.glob("*.md")):
            fm = _parse_frontmatter(f)
            name = fm.get("name", f.stem)
            extra_parts = []
            if "methodology" in fm:
                extra_parts.append(f"methodology={fm['methodology']}")
            if "status" in fm:
                extra_parts.append(f"status={fm['status']}")
            if "subject" in fm:
                extra_parts.append(f"subject={fm['subject']}")
            extra = f" ({', '.join(extra_parts)})" if extra_parts else ""
            entries.append(f"- [{type_name}] slug={f.stem} | name={name}{extra}")

    if not entries:
        return "<org_context>\nNo hay entidades organizacionales guardadas aún.\n</org_context>"

    body = "\n".join(entries)
    return f"<org_context>\n{body}\n</org_context>"
