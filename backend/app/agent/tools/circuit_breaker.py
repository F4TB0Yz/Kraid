import time
import threading
from typing import Any, Callable, Coroutine

from app.config import settings
from app.agent.tools.base import Middleware, ToolResult


class CircuitState:
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerMiddleware(Middleware):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._failures: dict[str, int] = {}
        self._state: dict[str, str] = {}
        self._open_until: dict[str, float] = {}
        self._threshold = settings.circuit_breaker_threshold
        self._reset_seconds = settings.circuit_breaker_reset_seconds

    def _state_for(self, tool: str) -> str:
        return self._state.get(tool, CircuitState.CLOSED)

    def _is_open(self, tool: str) -> bool:
        state = self._state_for(tool)
        if state == CircuitState.CLOSED:
            return False
        if state == CircuitState.OPEN:
            open_until = self._open_until.get(tool, 0.0)
            if time.monotonic() >= open_until:
                with self._lock:
                    self._state[tool] = CircuitState.HALF_OPEN
                return False
            return True
        return False

    async def execute(
        self, name: str, args: dict[str, Any], next_fn: Callable[[], Coroutine[Any, Any, ToolResult]]
    ) -> ToolResult:
        if self._is_open(name):
            remaining = max(0, self._open_until.get(name, 0.0) - time.monotonic())
            return ToolResult(
                output=f"Error: tool '{name}' circuit is OPEN. Retry in {remaining:.0f}s. Try a different approach.",
                is_error=True,
                tool_name=name,
            )
        result = await next_fn()
        if result.is_error:
            with self._lock:
                count = self._failures.get(name, 0) + 1
                self._failures[name] = count
                if count >= self._threshold:
                    self._state[name] = CircuitState.OPEN
                    self._open_until[name] = time.monotonic() + self._reset_seconds
                    self._failures[name] = 0
        else:
            with self._lock:
                self._failures[name] = 0
                if self._state_for(name) == CircuitState.HALF_OPEN:
                    self._state[name] = CircuitState.CLOSED
        return result
