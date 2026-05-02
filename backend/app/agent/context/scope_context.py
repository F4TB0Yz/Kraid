from typing import Optional
from cachetools import TTLCache


class ScopeContext:
    def __init__(self):
        # session_id -> {"type": "project" | None, "slug": str | None}
        self._scopes: TTLCache = TTLCache(maxsize=256, ttl=3600)

    def set_scope(self, session_id: str, scope_type: Optional[str], slug: Optional[str] = None) -> None:
        self._scopes[session_id] = {"type": scope_type, "slug": slug}

    def get_scope(self, session_id: str) -> dict:
        return self._scopes.get(session_id, {"type": None, "slug": None})

    def get_scope_block(self, session_id: str) -> str:
        scope = self.get_scope(session_id)
        if scope["type"] == "project" and scope["slug"]:
            return f"<current_scope>\nÁmbito: Proyecto activo — [[{scope['slug']}]]\n</current_scope>"
        return "<current_scope>\nÁmbito: Modo personal (sin proyecto activo)\n</current_scope>"

    def clear_scope(self, session_id: str) -> None:
        self._scopes.pop(session_id, None)


scope_context = ScopeContext()
