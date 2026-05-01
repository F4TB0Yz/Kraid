from dataclasses import dataclass
from typing import Any, Callable, Coroutine, Optional


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

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def openai_schemas(self) -> list[dict[str, Any]]:
        return [t.openai_schema() for t in self._tools.values()]

    async def execute(self, name: str, args: dict[str, Any]) -> str:
        tool = self.get(name)
        if not tool:
            return f"Error: tool '{name}' not found"
        try:
            return await tool.execute(**args)
        except Exception as e:
            return f"Error executing {name}: {e}"
