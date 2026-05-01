import json
from typing import AsyncIterator, Optional

from openai import AsyncOpenAI

from app.config import settings
from app.agent.tools import tool_registry

EVENT_TOOL_CALL_START = "tool_call_start"
EVENT_TOOL_CALL_END = "tool_call_end"
EVENT_TEXT_DELTA = "text_delta"
EVENT_DONE = "done"


class AgentService:
    def __init__(self):
        self._client: AsyncOpenAI | None = None
        if settings.openai_api_key:
            self._client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url or None,
            )

    @property
    def is_ready(self) -> bool:
        return self._client is not None

    async def stream(self, messages: list[dict], model: Optional[str] = None) -> AsyncIterator[str]:
        if not self._client:
            yield json.dumps({"type": "error", "content": "OPENAI_API_KEY not configured"})
            return

        system_msg = {
            "role": "system",
            "content": (
                "You are Kraid, an AI coding assistant. You have access to tools:\n"
                "- canvas: create, read, edit, list documents\n"
                "- memory: read, write, list markdown memory files\n"
                "- fs: read, write, list, search files in the repo\n\n"
                "Use tools when needed. Be concise and helpful."
            ),
        }
        full_messages = [system_msg] + messages
        model_name = model or settings.openai_model
        tools = tool_registry.openai_schemas()
        iteration_count = 0

        while iteration_count < settings.max_tool_iterations:
            iteration_count += 1

            stream = await self._client.chat.completions.create(
                model=model_name,
                messages=full_messages,
                tools=tools if tools else None,
                stream=True,
                stream_options={"include_usage": False},
            )

            tool_calls_buf: dict[int, dict] = {}
            text_buffer = ""
            reasoning_buffer = ""

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta is None:
                    continue

                if delta.content:
                    text_buffer += delta.content
                    yield json.dumps({"type": EVENT_TEXT_DELTA, "content": delta.content})

                reasoning = getattr(delta, "reasoning_content", None)
                if reasoning:
                    reasoning_buffer += reasoning

                if delta.tool_calls:
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_buf:
                            tool_calls_buf[idx] = {
                                "id": tc.id or f"call_{idx}_{iteration_count}",
                                "function": {"name": "", "arguments": ""},
                            }
                        if tc.id:
                            tool_calls_buf[idx]["id"] = tc.id
                        if tc.function:
                            if tc.function.name:
                                tool_calls_buf[idx]["function"]["name"] += tc.function.name
                            if tc.function.arguments:
                                tool_calls_buf[idx]["function"]["arguments"] += tc.function.arguments

            assistant_msg: dict = {"role": "assistant", "content": text_buffer or None}
            if reasoning_buffer:
                assistant_msg["reasoning_content"] = reasoning_buffer

            if not tool_calls_buf:
                full_messages.append(assistant_msg)
                yield json.dumps({"type": EVENT_DONE})
                return

            tool_calls_list = [
                {
                    "id": tool_calls_buf[idx]["id"],
                    "type": "function",
                    "function": {
                        "name": tool_calls_buf[idx]["function"]["name"],
                        "arguments": tool_calls_buf[idx]["function"]["arguments"],
                    },
                }
                for idx in sorted(tool_calls_buf.keys())
            ]
            assistant_msg["tool_calls"] = tool_calls_list
            full_messages.append(assistant_msg)

            for idx in sorted(tool_calls_buf.keys()):
                tc = tool_calls_buf[idx]
                fn_name = tc["function"]["name"]
                fn_args_str = tc["function"]["arguments"]
                fn_args = {}
                if fn_args_str.strip():
                    try:
                        fn_args = json.loads(fn_args_str)
                    except json.JSONDecodeError:
                        fn_args = {"_raw": fn_args_str}
                tc_id = tc["id"]

                yield json.dumps({
                    "type": EVENT_TOOL_CALL_START,
                    "toolCallId": tc_id,
                    "tool": fn_name,
                    "input": fn_args,
                })

                result = await tool_registry.execute(fn_name, fn_args)

                yield json.dumps({
                    "type": EVENT_TOOL_CALL_END,
                    "toolCallId": tc_id,
                    "output": result,
                    "status": "error" if result.startswith("Error") else "success",
                })

                full_messages.append({
                    "role": "tool",
                    "tool_call_id": tc_id,
                    "content": result,
                })

        yield json.dumps({"type": "error", "content": "Max tool iterations reached"})
        yield json.dumps({"type": EVENT_DONE})


agent_service = AgentService()
