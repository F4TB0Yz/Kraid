from dataclasses import dataclass, field
from typing import Any, Callable, Coroutine, Optional
import time
import hashlib


@dataclass
class ToolResult:
    output: str
    is_error: bool
    truncated: bool = False
    original_length: int = 0
    execution_time_ms: float = 0.0
    tool_name: str = ""


class Middleware:
    async def execute(
        self, name: str, args: dict[str, Any], next_fn: Callable[[], Coroutine[Any, Any, ToolResult]]
    ) -> ToolResult:
        return await next_fn()


NextFn = Callable[[], Coroutine[Any, Any, ToolResult]]


@dataclass
class Tool:
    name: str
    description: str
    parameters: dict[str, Any]
    execute: Callable[..., Coroutine[Any, Any, str]]

    def openai_schema(self) -> dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, Tool] = {}
        self._middleware: list[Middleware] = []

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def openai_schemas(self) -> list[dict[str, Any]]:
        return [t.openai_schema() for t in self._tools.values()]

    def use(self, mw: Middleware) -> None:
        self._middleware.append(mw)

    async def _core_execute(self, name: str, args: dict[str, Any]) -> ToolResult:
        tool = self.get(name)
        if not tool:
            return ToolResult(
                output=f"Error: tool '{name}' not found",
                is_error=True,
                tool_name=name,
            )
        start = time.monotonic()
        try:
            output = await tool.execute(**args)
            elapsed = (time.monotonic() - start) * 1000
            return ToolResult(
                output=output,
                is_error=output.startswith("Error"),
                execution_time_ms=elapsed,
                tool_name=name,
            )
        except Exception as e:
            elapsed = (time.monotonic() - start) * 1000
            return ToolResult(
                output=f"Error executing {name}: {e}",
                is_error=True,
                execution_time_ms=elapsed,
                tool_name=name,
            )

    async def execute(self, name: str, args: dict[str, Any]) -> ToolResult:
        chain = self._middleware[:]
        async def _build(index: int) -> NextFn:
            if index >= len(chain):
                return lambda: self._core_execute(name, args)
            mw = chain[index]
            next_fn = await _build(index + 1)
            return lambda mw=mw, next_fn=next_fn: mw.execute(name, args, next_fn)
        handler = await _build(0)
        return await handler()
