import asyncio
from typing import Any, Callable, Coroutine

from app.config import settings
from app.agent.tools.base import Middleware, ToolResult


class TimeoutMiddleware(Middleware):
    async def execute(
        self, name: str, args: dict[str, Any], next_fn: Callable[[], Coroutine[Any, Any, ToolResult]]
    ) -> ToolResult:
        timeout = settings.tool_timeout(name)
        try:
            return await asyncio.wait_for(next_fn(), timeout=timeout)
        except asyncio.TimeoutError:
            return ToolResult(
                output=f"Error: tool '{name}' timed out after {timeout}s",
                is_error=True,
                tool_name=name,
            )
