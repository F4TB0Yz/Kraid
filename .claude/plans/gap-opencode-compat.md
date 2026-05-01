# Gap: cerrar integración agente OpenAI + compatibilidad opencode

## Contexto

Otro agente ya implementó la mayor parte del plan (backend FastAPI con SSE, `AgentService` con loop de tool calling, 11 tools de canvas/memory/fs, frontend `HttpStreamingRepository`, mock eliminado). Falta arreglar bloqueantes y verificar end-to-end.

**Restricción**: Sólo provider **OpenAI Chat Completions API** (`openai.AsyncOpenAI.chat.completions.create` con `tools=[...]` formato function-calling). Esto mantiene compatibilidad con [opencode](https://github.com/sst/opencode) (que también usa Chat Completions / function tools como wire format estándar). **No** usar Responses API, **no** agregar Anthropic / otros providers, **no** introducir abstracciones de provider. Si en el futuro se quiere apuntar al gateway de opencode (`opencode-zen` u otro endpoint OpenAI-compatible), debe alcanzar con cambiar `base_url` en el `AsyncOpenAI(...)` — preverlo aceptando `OPENAI_BASE_URL` en `Settings` y pasándolo al cliente.

## Bugs bloqueantes a arreglar

### 1. Orden de mensajes en loop de tools — `backend/app/agent/service.py`
**Síntoma**: la 2ª iteración del loop tira 400 "messages with role 'tool' must follow assistant with tool_calls".
**Causa**: en líneas ~111-133, los mensajes `role:tool` se appendean a `full_messages` ANTES del `assistant_msg` con `tool_calls`.
**Fix**: armar `assistant_msg = {"role":"assistant", "content": text_buffer or None, "tool_calls": tool_calls_list}` y `full_messages.append(assistant_msg)` **antes** de iterar y appendear los tool messages. La emisión de eventos SSE (`tool_call_start`/`tool_call_end`) puede quedar como está; sólo cambia el orden en `full_messages`.

### 2. Sandbox de fs con prefix-match débil — `backend/app/agent/tools/fs_tools.py:11`
**Síntoma**: `/repo-evil` pasa el check cuando `repo_root=/repo`.
**Fix**: usar `resolved.is_relative_to(root)` (Python 3.9+) en lugar de `str(resolved).startswith(str(root))`. Si no es relativo → `raise PermissionError`.

### 3. Paths relativos resuelven contra CWD del backend — `fs_tools.py` (read/write/list/search)
**Síntoma**: agente llama `fs_read("README.md")` y resuelve contra `backend/`, no contra repo root → "not found".
**Fix**: en `_check_sandbox` (o antes), si `Path(path).is_absolute()` usarlo tal cual; si no, `Path(path) = settings.resolved_repo_root / path`. Después resolver y validar sandbox.

### 4. Canvas router toma query params, rompe frontend — `backend/app/routers/canvas.py:21,29`
**Síntoma**: `update_document(doc_id, content: str)` y `create_document(title, content)` reciben query params; el `DocumentRepository.ts` del frontend manda JSON body → 422.
**Fix**: definir Pydantic models y aceptar body. Ej:
```python
class UpdateBody(BaseModel): content: str
@router.put("/document/{doc_id}")
def update_document(doc_id: str, body: UpdateBody): ...

class CreateBody(BaseModel): title: str; content: str = ""
@router.post("/documents")
def create_document(body: CreateBody): ...
```
Verificar exactamente qué manda `frontend/src/features/canvas/data/repositories/DocumentRepository.ts` y alinear.

### 5. fs_search sin exclusiones — `fs_tools.py:97`
**Síntoma**: recorre `.venv/`, `node_modules/`, `.git/`, `dist/`, `__pycache__/`. Se cuelga.
**Fix**: skip dirs cuyo nombre esté en `{".venv","venv","node_modules",".git","dist","dist-ssr","__pycache__",".vite",".idea",".vscode"}`. Cap resultados a 100 (ya está) y cap tamaño de archivo leído (ej. 500KB).

### 6. memory_write re-resolución sin re-validar — `memory_tools.py:65-67`
**Fix menor**: después de appendear `.md` y reasignar `filepath`, repetir el check `if not str(filepath).startswith(str(mem_dir)): return error`.

## Mejora chica de compat opencode

### 7. Soportar `OPENAI_BASE_URL` opcional — `backend/app/config.py` y `service.py`
- En `Settings`: `openai_base_url: Optional[str] = None`.
- En `AgentService.__init__`: `AsyncOpenAI(api_key=..., base_url=settings.openai_base_url or None)`.
- Agregar línea en `backend/.env.example`: `# OPENAI_BASE_URL=https://gateway.opencode.ai/v1` (comentado).

Esto permite apuntar el mismo cliente a cualquier endpoint OpenAI-compatible (opencode gateway, OpenRouter, Ollama, vLLM) sin cambiar código.

### 8. Status 503 real cuando falta key — `backend/app/routers/chat.py`
El `HttpStreamingRepository` ya tiene branch para `response.status === 503` que hoy nunca se dispara. Hacer:
```python
if not agent_service.is_ready:
    raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")
```
en lugar de devolver SSE con error event.

## Verificación end-to-end (obligatorio antes de entregar)

### Backend
```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt    # confirmar openai, sse-starlette, python-dotenv, pydantic-settings instalados
cp .env.example .env                # editar y poner OPENAI_API_KEY real
python -c "from app.main import app; print('ok')"
uvicorn app.main:app --reload --port 8000
```
En otra terminal:
```bash
# 1) sin tools
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hola"}]}'
# debe stremear text_delta + done

# 2) con fs tool (prueba bug #3)
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Listame los archivos del repo y leeme el README.md"}]}'
# debe disparar fs_list y fs_read("README.md") con éxito

# 3) multi-turn tool (prueba bug #1)
curl -N -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Buscá la palabra TODO en el repo y abrí el primer archivo"}]}'
# debe encadenar fs_search → fs_read sin error 400

# 4) sin key (poner OPENAI_API_KEY="" en .env y reiniciar)
curl -i -X POST http://localhost:8000/api/chat/stream \
  -H 'Content-Type: application/json' -d '{"messages":[]}'
# debe responder HTTP 503
```

### Frontend
```bash
cd frontend
npm run lint && npm run typecheck && npm test && npm run build
npm run dev
```
En el browser:
1. Mandar "leé el README" → ver `ToolCallBlock` con `fs_read` exitoso.
2. Mandar "creá un canvas con título Hola y contenido # Hi" → tab nuevo aparece en canvas.
3. Mandar "guardá en memory que prefiero respuestas cortas" → archivo `.md` nuevo en `memory/`.
4. Borrar key del `.env`, reiniciar backend → toast "OPENAI_API_KEY not configured".
5. Verificar `StatusBar` cicla `thinking → running_tool(<name>) → streaming → idle`.

## Archivos a tocar

- `backend/app/agent/service.py` (bugs 1, 7)
- `backend/app/agent/tools/fs_tools.py` (bugs 2, 3, 5)
- `backend/app/agent/tools/memory_tools.py` (bug 6)
- `backend/app/routers/canvas.py` (bug 4)
- `backend/app/routers/chat.py` (bug 8)
- `backend/app/config.py` (bug 7)
- `backend/.env.example` (bug 7)
- `CHANGELOG.md` (entry "fix(agent): tool-call ordering, fs sandbox, canvas body params; feat: OPENAI_BASE_URL opcional")

## Reglas

- No agregar dependencias nuevas al `requirements.txt` ni a `frontend/package.json` sin confirmar.
- Mantenerse en OpenAI Chat Completions API.
- Seguir AGENTS.md (caveman lite, español, verificación pre-entrega regla 8 y 12).
- No tocar UI ni `chatStore`/`HttpStreamingRepository` salvo que algún fix lo requiera.
