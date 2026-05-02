import re
import unicodedata
from typing import Tuple

def extract_wiki_links(content: str) -> list[str]:
    """Extrae todos los [[wiki-links]] del contenido."""
    matches = re.findall(r"\[\[([a-zA-Z0-9_-]+)\]\]", content)
    # Deduplicate while preserving order
    return list(dict.fromkeys(matches))

def to_kebab(text: str) -> str:
    """Convierte texto a kebab-case."""
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_text.lower()
    return re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")

def parse_frontmatter(content: str) -> Tuple[dict, str]:
    """Parse existing content string into (frontmatter_dict, body)."""
    try:
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
        return {}, content

def build_frontmatter(fields: dict) -> str:
    """Construye un string de frontmatter a partir de un dict."""
    lines = ["---"]
    for k, v in fields.items():
        if isinstance(v, list):
            lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines)
