from typing import Optional


class ErrorBudget:
    def __init__(self, max_consecutive: int, max_total: int) -> None:
        self._max_consecutive = max_consecutive
        self._max_total = max_total
        self.consecutive_errors = 0
        self.total_errors = 0

    def record_success(self) -> None:
        self.consecutive_errors = 0

    def record_error(self) -> Optional[str]:
        self.consecutive_errors += 1
        self.total_errors += 1
        if self.total_errors >= self._max_total:
            return "hard_stop"
        if self.consecutive_errors >= self._max_consecutive:
            return "consecutive_limit"
        return None


def build_error_warning(kind: str) -> str:
    if kind == "consecutive_limit":
        return (
            "[System Warning: Has tenido varios errores consecutivos ejecutando tools. "
            "Deja de llamar tools que están fallando. Cambia de estrategia o pídele ayuda al usuario.]"
        )
    if kind == "hard_stop":
        return (
            "[System Error: Demasiados errores acumulados. "
            "No puedes hacer más tool calls. Resume lo que lograste.]"
        )
    return ""
