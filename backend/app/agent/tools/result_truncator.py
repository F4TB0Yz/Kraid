from typing import Any, Callable, Coroutine

from app.config import settings
from app.agent.tools.base import Middleware, ToolResult


class ResultTruncatorMiddleware(Middleware):
    async def execute(
        self, name: str, args: dict[str, Any], next_fn: Callable[[], Coroutine[Any, Any, ToolResult]]
    ) -> ToolResult:
        result = await next_fn()
        max_chars = settings.tool_result_max_chars
        if len(result.output) > max_chars:
            result.original_length = len(result.output)
            result.output = result.output[:max_chars] + f"\n\n[Output truncated: {result.original_length} chars > {max_chars} max. Full output may be needed.]"
            result.truncated = True
        return result
