import json
import time as time_module
import datetime
import asyncio
from typing import AsyncIterator, Optional

from openai import AsyncOpenAI

from app.config import settings
from app.agent.tools import tool_registry
from app.agent.tools.loop_detector import LoopDetector
from app.agent.context.compactor import compact_messages
from app.agent.guardrails import ErrorBudget, build_error_warning
from app.agent.telemetry import IterationMetrics, ToolCallRecord
from app.agent.context.user_context import build_user_context_block, build_context_snapshot
from app.agent.context.scope_context import scope_context
from app.agent.prompts import DOMAIN_AGENT_PROMPT

EVENT_TOOL_CALL_START = "tool_call_start"
EVENT_TOOL_CALL_END = "tool_call_end"
EVENT_TEXT_DELTA = "text_delta"
EVENT_THINKING_START = "thinking_start"
EVENT_THINKING_DELTA = "thinking_delta"
EVENT_THINKING_END = "thinking_end"
EVENT_DONE = "done"

BASE_TOOLS_PROMPT = """Tienes acceso a las siguientes categorías de tools:
- canvas: crear, leer, editar y listar documentos del canvas
- file: leer, escribir, listar y eliminar archivos del sistema jerárquico de conocimiento (file_write, file_read, file_list, file_delete)
- fs: leer, escribir, listar y buscar archivos en el repo
- ask: hacer preguntas interactivas al usuario (ask_user)"""

AUTO_MEMORY_INSTRUCTIONS = """
Eres un asistente que aprende de sus interacciones con el usuario de manera continua.
Evalúa si la información que el usuario comparte amerita ser persistida. No todo merece guardarse.

Cuándo SÍ considerar guardar:
- Hechos permanentes o de larga duración sobre el usuario (ej: "uso tabs", "soy dev senior", "no uses emojis").
- Preferencias de comportamiento explícitamente comunicadas.
- Correcciones validadas o feedback confirmado por el usuario.

Cuándo NO guardar:
- Temas personales no relacionados con ningún proyecto o perfil del usuario.
- Información efímera o conversacional sin valor duradero.
- Tareas que el usuario menciona de paso sin estructura clara.
- Tokens de API o secretos.
- Conversaciones enteras o código fuente largo.
- Estados temporales (ej: "estoy reiniciando el server").

Si decides guardar, usa el 'type' correcto:
  - 'profile': Quién es el usuario, su rol, su nivel de experiencia, su stack tecnológico.
  - 'feedback': Reglas de comportamiento, correcciones, aprobaciones validadas.
  - 'project': Iniciativas activas, contexto que trascienda una sesión.
  - 'reference': Enlaces o punteros a sistemas externos (ej: Linear, JIRA, dashboards).

Si no estás seguro si algo amerita guardarse, mejor omítelo. El usuario pedirá guardar si lo considera importante.
"""


class AgentService:
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        self._models_cache: tuple[list[dict], float] = ([], 0.0)
        if settings.openai_api_key:
            self._client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url or None,
            )

    @property
    def is_ready(self) -> bool:
        return self._client is not None

    async def _execute_tools_parallel(
        self,
        tool_calls_buf: dict[int, dict],
        session_id: Optional[str],
        full_messages: list[dict],
        metrics: IterationMetrics,
        loop_detector: LoopDetector,
        events: list[str],
    ) -> None:
        sorted_indices = sorted(tool_calls_buf.keys())
        parsed: list[tuple[int, str, str, dict]] = []

        for idx in sorted_indices:
            tc = tool_calls_buf[idx]
            fn_name = tc["function"]["name"]
            fn_args_str = tc["function"]["arguments"]
            fn_args: dict = {}
            if fn_args_str.strip():
                try:
                    fn_args = json.loads(fn_args_str)
                except json.JSONDecodeError:
                    fn_args = {"_raw": fn_args_str}

            if fn_name in ("file_write", "file_delete", "ask_user", "set_scope") and session_id is not None:
                fn_args["session_id"] = session_id

            parsed.append((idx, tc["id"], fn_name, fn_args))

            loop_warning = loop_detector.record_and_check(fn_name, fn_args)
            if loop_warning:
                metrics.loop_warnings += 1
                events.append(json.dumps({"type": "loop_detected", "tool": fn_name}))

            events.append(json.dumps({
                "type": EVENT_TOOL_CALL_START,
                "toolCallId": tc["id"],
                "tool": fn_name,
                "input": fn_args,
            }))

        sem = asyncio.Semaphore(settings.parallel_tool_max_concurrency)

        async def exec_one(idx: int, tc_id: str, fn_name: str, fn_args: dict) -> tuple[int, str, bool]:
            if settings.parallel_tool_execution:
                async with sem:
                    result = await tool_registry.execute(fn_name, fn_args)
            else:
                result = await tool_registry.execute(fn_name, fn_args)

            metrics.tool_calls.append(ToolCallRecord(
                tool_name=fn_name,
                is_error=result.is_error,
                execution_time_ms=result.execution_time_ms,
                truncated=result.truncated,
            ))

            if result.is_error:
                metrics.error_count += 1

            if "circuit is OPEN" in result.output:
                events.append(json.dumps({"type": "circuit_open", "tool": fn_name}))

            return idx, result.output, result.is_error

        if settings.parallel_tool_execution and len(parsed) > 1:
            results = await asyncio.gather(*[exec_one(idx, tid, name, args) for idx, tid, name, args in parsed])
        else:
            results = []
            for idx, tid, name, args in parsed:
                r = await exec_one(idx, tid, name, args)
                results.append(r)

        results.sort(key=lambda x: x[0])

        for idx, output, is_error in results:
            tc_id = tool_calls_buf[idx]["id"]
            events.append(json.dumps({
                "type": EVENT_TOOL_CALL_END,
                "toolCallId": tc_id,
                "output": output,
                "status": "error" if is_error else "success",
            }))
            full_messages.append({
                "role": "tool",
                "tool_call_id": tc_id,
                "content": output,
            })

    async def stream(self, messages: list[dict], model: Optional[str] = None, session_id: Optional[str] = None) -> AsyncIterator[str]:
        if not self._client:
            yield json.dumps({"type": "error", "content": "OPENAI_API_KEY not configured"})
            return

        user_context_block = build_user_context_block(session_id)
        today = datetime.date.today().isoformat()
        org_snapshot = build_context_snapshot()
        current_scope = scope_context.get_scope_block(session_id) if session_id else "<current_scope>\nÁmbito: No especificado (sesión anónima)\n</current_scope>"
        domain_prompt = DOMAIN_AGENT_PROMPT.format(TODAY=today, context_snapshot=org_snapshot, current_scope=current_scope)

        system_content = f"{domain_prompt}\n{BASE_TOOLS_PROMPT}\n{AUTO_MEMORY_INSTRUCTIONS}\n{user_context_block}"

        system_msg = {
            "role": "system",
            "content": system_content,
        }

        if not messages:
            activation_prompt = {
                "role": "user",
                "content": "El usuario ha iniciado una nueva sesión. Salúdalo de forma cálida y proactiva basándose en su perfil y proyectos actuales. No menciones que estás leyendo su perfil, simplemente sé útil"
            }
            full_messages = [system_msg, activation_prompt]
        else:
            full_messages = [system_msg] + messages

        model_name = model or settings.openai_model
        tools = tool_registry.openai_schemas()
        iteration_count = 0

        metrics = IterationMetrics()
        loop_detector = LoopDetector()
        error_budget = ErrorBudget(settings.max_consecutive_errors, settings.max_total_errors)
        graceful_exit_done = False

        start_time = time_module.monotonic()

        while iteration_count < settings.max_tool_iterations:
            iteration_count += 1
            metrics.iterations = iteration_count

            compacted = compact_messages(full_messages)
            if compacted[1] > 0:
                full_messages = compacted[0]
                metrics.compactions += 1
                yield json.dumps({
                    "type": "context_compacted",
                    "messagesBefore": compacted[1] + len(full_messages),
                    "messagesAfter": len(full_messages),
                })

            remaining = settings.max_tool_iterations - iteration_count
            if not graceful_exit_done and remaining < settings.graceful_exit_reserve:
                graceful_exit_done = True
                full_messages.append({
                    "role": "system",
                    "content": (
                        f"[System Notice: Has completado {iteration_count} iteraciones. "
                        "Ya no puedes usar tools. Resume lo que lograste y lo que queda pendiente.]"
                    ),
                })
                current_tools = None
            else:
                current_tools = tools if tools else None

            stream = await self._client.chat.completions.create(
                model=model_name,
                messages=full_messages,
                tools=current_tools,
                stream=True,
                stream_options={"include_usage": False},
            )

            tool_calls_buf: dict[int, dict] = {}
            text_buffer = ""
            reasoning_buffer = ""
            thinking_started = False
            thinking_start_time = 0.0

            async for chunk in stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta is None:
                    continue

                reasoning = getattr(delta, "reasoning_content", None)
                if reasoning:
                    if not thinking_started:
                        thinking_started = True
                        thinking_start_time = time_module.monotonic()
                        yield json.dumps({"type": EVENT_THINKING_START})
                    reasoning_buffer += reasoning
                    yield json.dumps({"type": EVENT_THINKING_DELTA, "content": reasoning})

                if delta.content:
                    if thinking_started:
                        elapsed = time_module.monotonic() - thinking_start_time
                        yield json.dumps({"type": EVENT_THINKING_END, "duration": round(elapsed, 1)})
                        thinking_started = False
                    text_buffer += delta.content
                    yield json.dumps({"type": EVENT_TEXT_DELTA, "content": delta.content})

                if delta.tool_calls:
                    if thinking_started:
                        elapsed = time_module.monotonic() - thinking_start_time
                        yield json.dumps({"type": EVENT_THINKING_END, "duration": round(elapsed, 1)})
                        thinking_started = False
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

            if thinking_started:
                elapsed = time_module.monotonic() - thinking_start_time
                yield json.dumps({"type": EVENT_THINKING_END, "duration": round(elapsed, 1)})
                thinking_started = False

            assistant_msg: dict = {"role": "assistant", "content": text_buffer or None}
            if reasoning_buffer:
                assistant_msg["reasoning_content"] = reasoning_buffer

            if not tool_calls_buf:
                full_messages.append(assistant_msg)
                metrics.exit_reason = "completed"
                elapsed = time_module.monotonic() - start_time
                yield json.dumps({
                    "type": EVENT_DONE,
                    "metrics": {
                        "iterations": metrics.iterations,
                        "toolCalls": len(metrics.tool_calls),
                        "errors": metrics.error_count,
                        "elapsed": round(elapsed, 1),
                    },
                })
                metrics.log_summary()
                return

            if current_tools is None and tool_calls_buf:
                full_messages.append(assistant_msg)
                metrics.exit_reason = "graceful_exit_no_tools"
                elapsed = time_module.monotonic() - start_time
                yield json.dumps({
                    "type": "error",
                    "content": "Max tool iterations reached (graceful exit completed)",
                })
                yield json.dumps({
                    "type": EVENT_DONE,
                    "metrics": {
                        "iterations": metrics.iterations,
                        "toolCalls": len(metrics.tool_calls),
                        "errors": metrics.error_count,
                        "elapsed": round(elapsed, 1),
                    },
                })
                metrics.log_summary()
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

            events: list[str] = []

            await self._execute_tools_parallel(
                tool_calls_buf, session_id, full_messages,
                metrics, loop_detector, events,
            )

            for event in events:
                yield event

            any_success = any(not r.is_error for r in metrics.tool_calls[-len(tool_calls_buf):])
            if any_success:
                error_budget.record_success()
            else:
                budget_result = error_budget.record_error()
                if budget_result == "hard_stop":
                    warning = build_error_warning("hard_stop")
                    full_messages.append({"role": "system", "content": warning})
                    metrics.exit_reason = "error_budget_exceeded"
                    yield json.dumps({"type": "error", "content": "Too many errors accumulated"})
                    elapsed = time_module.monotonic() - start_time
                    yield json.dumps({
                        "type": EVENT_DONE,
                        "metrics": {
                            "iterations": metrics.iterations,
                            "toolCalls": len(metrics.tool_calls),
                            "errors": metrics.error_count,
                            "elapsed": round(elapsed, 1),
                        },
                    })
                    metrics.log_summary()
                    return
                elif budget_result == "consecutive_limit":
                    warning = build_error_warning("consecutive_limit")
                    full_messages.append({"role": "system", "content": warning})

        metrics.exit_reason = "max_iterations"
        elapsed = time_module.monotonic() - start_time
        yield json.dumps({
            "type": "error",
            "content": "Max tool iterations reached",
        })
        yield json.dumps({
            "type": EVENT_DONE,
            "metrics": {
                "iterations": metrics.iterations,
                "toolCalls": len(metrics.tool_calls),
                "errors": metrics.error_count,
                "elapsed": round(elapsed, 1),
            },
        })
        metrics.log_summary()

    async def list_models(self) -> list[dict]:
        now = time_module.monotonic()
        cached, timestamp = self._models_cache
        if cached and now - timestamp < 60:
            return cached
        if not self._client:
            return cached
        try:
            response = await self._client.models.list()
            models = [{"id": m.id, "label": m.id} for m in response.data]
            self._models_cache = (models, now)
            return models
        except Exception:
            return cached


agent_service = AgentService()
