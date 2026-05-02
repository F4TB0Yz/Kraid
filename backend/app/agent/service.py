import json
import time as time_module
import datetime
from typing import AsyncIterator, Optional

from openai import AsyncOpenAI

from app.config import settings
from app.agent.tools import tool_registry
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
                
                # Inject session_id for tools that need it for cache invalidation
                if fn_name in ("file_write", "file_delete", "ask_user", "set_scope") and session_id is not None:
                    fn_args["session_id"] = session_id
                
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
