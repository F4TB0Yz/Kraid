# Changelog

## [Unreleased]

### Added

- **Propagación del modo chat/agent/edit**: El selector de modo (ContextChips) ahora se propaga desde la UI hasta el backend. `StreamRequest.mode` (Literal["chat","agent","edit"]) en backend. Modo `chat` envía `tools=None` a OpenAI (conversación pura). Modo `agent` conserva todas las tools. Modo `edit` preparado para futuras restricciones. Cadena: `ChatInput.onSend(content, mode)` → `chatStore.sendMessage(content, mode)` → `streamResponse(..., mode)` → `HttpStreamingRepository.stream(..., mode)` → payload JSON `mode` → `AgentService.stream(..., mode)` → condiciona `tools=None`.

- **System prompt condicional por modo**: En modo `chat`, el system prompt excluye `BASE_TOOLS_PROMPT` (descripción de herramientas), `AUTO_MEMORY_INSTRUCTIONS` (instrucciones de memoria), e inyecta `CHAT_MODE_INSTRUCTION` que declara explícitamente que el agente no tiene herramientas. En modo `agent`/`edit` el prompt completo permanece intacto. Esto evita que el LLM intente usar herramientas o guardar memoria cuando está en modo conversación pura.

- **ActivityLog consolidado**: Nuevo componente `ActivityLog` que reemplaza el apilamiento individual de `ThinkingBlock` y `ToolCallBlock` por una fila única que se actualiza en tiempo real durante streaming. 4 estados: thinking progress (shimmer), thinking done + tool running, tools mixed (completadas + corriendo), todo completado (collapsible con chevron). Animación `activity-switch` para transiciones de texto. Detalle expandible por item (JSON input/output de tools, contenido de thinking).
- **toolLabels.ts**: Constantes compartidas `TOOL_LABELS`, `getToolLabel()`, `getToolKeyArgument()` extraídas de `ToolCallBlock` a `presentation/constants/toolLabels.ts`. `ToolCallBlock` actualizado para importar desde constantes.
- **Regenerate funcional**: Nuevo método `regenerateMessage()` en `chatStore` que trunca la conversación hasta el mensaje assistant target, crea nuevo placeholder, y relanza streaming completo. Botón Regenerate en `ChatMessage` ahora llama al store real.

### Changed

- **chatStore**: SSE streaming loop extraído a helper modular `streamResponse()` para compartir entre `sendMessage`, `triggerGreeting`, y `regenerateMessage`. Reduce duplicación de ~200 líneas a llamadas de una línea.
- **ChatMessage**: Parts particionados con `useMemo` en `activityParts` (thinking + tool_calls), `contentParts` (text + citations), `questionParts` (ask_user). ActivityLog reemplaza renderizado inline de ThinkingBlock/ToolCallBlock. Fork button removido (placeholder sin valor).
- **PartRenderer**: Casos `tool_call` y `thinking` removidos (redirigidos a ActivityLog). Solo maneja `text` y `citation`.

### Removed

- **Fork button**: Eliminado del toolbar de acciones en `ChatMessage`. `GitForkIcon` import removido.

- **Arquitectura Robusta para Tools de Agentes**: Sistema defensivo multicapa para el loop agentico.
  - **ToolResult estructurado**: Reemplazo de `str` por dataclass tipado con `is_error`, `truncated`, `execution_time_ms`, `tool_name`.
  - **Middleware Pipeline**: 3 middlewares componibles en `ToolRegistry` — CircuitBreaker ( OPEN/CLOSED/HALF_OPEN con threshold configurable y reset automático), Timeout (per-tool via `asyncio.wait_for` con defaults por tool), ResultTruncator (corte en `tool_result_max_chars=12000` con sufijo informativo).
  - **Loop Detector**: Sliding window de 6 entradas, SHA256 fingerprint de args, detecta 3+ llamadas idénticas. Inyecta system warning en lugar de hard-block.
  - **Context Compactor**: Compactación determinista al superar 60 mensajes. Preserva system + first user + últimos 20, reemplaza middle con resumen estructural de tools/errors. Hard cap en 80.
  - **Guardrails (Error Budget)**: `max_consecutive_errors=3` inyecta warning, `max_total_errors=8` hard stop. `graceful_exit_reserve=2` últimas iteraciones sin tools para resumen graceful en vez de error genérico.
  - **Ejecución Paralela de Tools**: `asyncio.gather` + `Semaphore(max_concurrency=5)` para tool_calls múltiples. Preserva orden de SSE events (todos los start, luego gather, luego todos los end).
  - **Telemetría**: `IterationMetrics` con tool call records, tool_summary agrupada, log_summetry al finalizar stream. `IterationMetrics.log_summary()` línea estructurada con iteraciones, errores, loops, compactions, exit_reason.
  - **SSE Events nuevos**: `context_compacted`, `loop_detected`, `circuit_open` (aditivos, backward-compat). `done` event mejorado con `metrics: {iterations, toolCalls, errors, elapsed}`.
  - **Config extendida**: `max_tool_iterations=25`, timeouts por tool, circuit breaker, loop detection, context management, parallel execution, error budget. Todas configurables vía env vars.
  - **Archivos nuevos**: `middleware.py`, `circuit_breaker.py`, `result_truncator.py`, `loop_detector.py`, `context/compactor.py`, `guardrails.py`, `telemetry.py`.

- **Context Disambiguation System**: Previene que el agente asocie tareas personales al proyecto activo sin confirmación explícita.
  - **`project` field**: Nuevo campo opcional en frontmatter de archivos. Tasks con `project: null` son independientes. Tasks con `project: "findyourmind"` pertenecen a ese proyecto. Soportado en `FileNode`, `KraidFile`, API REST y tool `file_write`.
  - **`SessionScopeContext`**: Contexto de sesión que rastrea el ámbito actual (proyecto activo vs modo personal). Se inyecta en el system prompt como `<current_scope>`.
  - **`set_scope` tool**: Nueva herramienta para que el agente cambie explícitamente entre modo personal y modo proyecto. Valida que el proyecto exista antes de asignar.
  - **Prompt disambiguation rules**: Nuevas reglas en `DOMAIN_AGENT_PROMPT` que obligan al agente a preguntar antes de vincular, asumir tareas como independientes por defecto, y no mezclar contextos.
  - **`AUTO_MEMORY_INSTRUCTIONS` suavizadas**: Cambiado de "DEBES guardar proactivamente" a "Evalúa si amerita guardarse". Instrucciones explícitas de qué NO guardar (temas personales no relacionados, info efímera).
  - **Validación en `file_write`**: Si una task referencia `[[proyecto]]` en contenido sin asignar `project`, emite advertencia. Si se asigna `project` a un slug que no existe, emite advertencia.

- **Unified Explorer (WorkspacePanel)**: Panel derecho unificado con tabs compartidos para Canvas y Memory. Reemplaza los dos botones separados (Canvas / Memory) por un único `WorkspacePanel` con:
  - **workspacePanelStore**: Store Zustand que gestiona tabs abiertos (`openTabIds`, `activeTabId`) con `focusTab` (abre panel + añade tab + activa) y `closeTab` (cierra tab; si queda vacío cierra panel). Identificación de tabs vía `tabKey()` compuesta.
  - **CanvasDocumentView**: Componente extraído de `MarkdownCanvas` que acepta `documentId` como prop. Contiene controles Preview/Edit/Split, textarea con auto-save 1.5s, y metrics footer. `MarkdownCanvas` queda como wrapper thin backward-compat.
  - **WorkspacePanel**: Componente principal con `WorkspaceTabBar` (tabs con iconos FileIcon/BrainIcon, badge "Agent" para memory, botón cerrar), botón "Consolidate" (exporta canvas al chat como mensaje para que el agente lo guarde en memoria), y `AddTabButton` con dropdown (Canvas Document / Memory File).
  - **MemoryFileContentView**: Componente inline que llama `selectFile(fileId)` en mount y renderiza `MemoryFileContent` con `onBack` para cerrar el tab.
  - **Cross-linking**: `@mentions` en `ChatInput` incluyen todos los docs canvas (no solo el activo). Seleccionar un mention abre el panel y activa el tab correspondiente. `CommandPalette` (Cmd+K) también abre tabs al seleccionar canvas docs o memory files.
- **Saludo proactivo**: Nuevo sistema de bienvenida automática. El backend (`AgentService.stream()`) inyecta un "Prompt de Activación" cuando `messages` está vacío, aprovechando el contexto de usuario ya construido (`build_user_context_block`). El frontend orquesta el saludo vía `triggerGreeting()` en `chatStore` — crea una conversación, envía `messages: []` al backend, y gestiona la respuesta como primer mensaje. `ChatPanel` dispara el saludo al detectar que no hay conversaciones existentes ni activas, ocultando la `WelcomeScreen` en cuanto el stream comienza.

- **User Context System**: Implementado sistema de memoria auto-generada en `.kraid/`. El backend inyecta `PREFERENCES.md` y metadata de memorias en el system prompt (con caché TTLCache de 30 minutos). Frontend envía `session_id` en peticiones de stream para invalidación. Nuevas tools `user_memory_save` y `user_memory_delete` para guardar contexto (profile, feedback, projects, references) proactivamente.

- **Model picker**: Dropdown en composer con lista dinámica desde gateway OpenAI-compatible vía `GET /api/chat/models`. `ModelPicker` con keyboard-nav (ArrowDown/Up/Enter/Escape), estado vacío "No models" y checkmark en modelo activo. `settingsStore` con persistencia en `localStorage` (`kraid:selected-model`). Caché de modelos en backend 60s.
- **Thinking streaming real**: Backend emite `thinking_start/delta/end` durante fase de reasoning. Frontend acumula contenido en vivo en `eventsToParts`. `ThinkingBlock` auto-expandido durante streaming, auto-colapsa al terminar con duración.
- **Tool call visibility**: `ToolCallBlock` expandido por defecto mientras `running`, auto-colapsa en `success/error`. `ModelPicker` en `ContextChips` reemplaza chip estático de modelo.

### Changed

- **SplitScreenLayout**: Eliminados `rightPanel` y `memoryPanel` props y estado `RightPanelMode`. Dos botones toggle reemplazados por uno solo (`PanelRightIcon`) que llama `togglePanel()`. Panel derecho renderiza `<WorkspacePanel />` directamente.
- **App.tsx**: Eliminados `rightPanel={<MarkdownCanvas />}` y `memoryPanel={<MemoryViewer />}` del JSX. `useMemoryWatcher` permanece.
- **MemoryFileContent**: Nueva prop opcional `onBack?: () => void`. Botón "Back" llama `onBack?.()` si definido, sino `selectFile(null)` (fallback para `MemoryViewer`).
- **NewMemoryModal**: Corregido valor inicial de tipo `'user'` → `'profile'` (bug de tipo). Componente exportado para reuso en `WorkspacePanel`.
- **SplitScreenLayout refactorizado**: Chat como lienzo base (bg-bg transparente). Sidebar y paneles derecho mantienen estilo tarjeta flotante (bg-card, rounded-2xl, ring-border-warm).
- **ChatPanel**: Fondo transparente, área de mensajes con max-w-3xl centrado y pb-48 para间距. Input flotante centrado con pointer-events-none wrapper.
- **ThinkingBlock**: Refactorizado con BrainIcon, tipografía serif italic, shimmer suave de opacidad (animate-shimmer) reemplazando animate-pulse. Auto-expandido durante streaming, auto-colapsa al finalizar.
- **ToolCallBlock**: Rediseñado con traducción humana de tool names (TOOL_LABELS), iconos semánticos sin fondos tintados, ring-1 ring-border-cream en lugar de bordes, collapsible <pre> con Anthropic Mono. CogIcon gira (animate-spin-slow) durante ejecución.
- **StatusBar**: Convertido a elemento flotante (absolute bottom-2 right-4 z-20) con fondo transparente.
- **Viewport dinámico**: `SplitScreenLayout` usa `h-dvh` (dynamic viewport height) en vez de `h-screen`. Evita que toolbars móviles recorten la interfaz inferior al recalcular altura real utilizable.
- **backend/.env.example**: Comentario indicando que `OPENAI_MODEL` es solo default; usuario cambia desde UI.
- **StatusBar**: Lee modelo activo desde `settingsStore.selectedModel` con fallback a `agentStatusStore.modelName`.
- **chatStore**: Pasa `selectedModel` al `httpStreamingRepository.stream()`.
- **HttpStreamingRepository**: `stream()` acepta `model` opcional. Nuevo método `listModels()`.
- **ContextChips**: Eliminada prop `modelName`, renderiza `<ModelPicker />`.
- **ChatInput**: Eliminado prop `modelName` del callsite de `ContextChips`.
- **App.tsx**: `useEffect` montaje dispara `loadModels()`.

### Fixed

- **Thinking content vacío**: `eventsToParts` ahora acumula `thinking_delta.content` en buffer; emitía part con `content: ''`.
- **StreamingRepository interfaz**: `stream()` ahora acepta `model?: string`.

### Fixed

- **tool-call ordering**: `tool_calls_list` construido antes de `assistant_msg` (estaba referenciado sin definir). `assistant_msg` ahora se construye antes del `if not tool_calls_buf` para ambos paths (con/sin tools).
- **reasoning_content multi-turn**: `getattr(delta, "reasoning_content")` capturado del stream y pasado en `assistant_msg["reasoning_content"]` para compatibilidad con DeepSeek V4 (lanza 400 si no se devuelve en el siguiente turno).
- **fs sandbox prefix-match**: `is_relative_to()` en lugar de `startswith()` para evitar bypass con `/repo-evil` cuando root es `/repo`.
- **fs relative paths**: `_resolve_path()` une paths relativos contra `settings.resolved_repo_root` en lugar de CWD del backend.
- **canvas PUT/POST body**: `UpdateBody`/`CreateBody` Pydantic models en lugar de query params para alinear con `DocumentRepository.ts`.
- **fs_search exclusions**: skip dirs en `{".venv","node_modules",".git","dist","__pycache__",...}`, cap archivo 500KB, cap resultados 100.
- **memory_write re-validation**: re-check sandbox después de appendear `.md` y reasignar filepath.

### Added

- **`OPENAI_BASE_URL`** en `Settings` → `AsyncOpenAI(base_url=...)` para apuntar a cualquier endpoint OpenAI-compatible (opencode gateway, OpenRouter, Ollama, vLLM). Template en `.env.example` comentado.

### Changed

- **503 real sin API key**: `POST /api/chat/stream` lanza `HTTPException(503)` en lugar de devolver SSE con error event.

- **Agente IA real (OpenAI)**: Integración completa con OpenAI vía SDK oficial. `AgentService` ejecuta loop de tool calling con streaming SSE. Backend centraliza la API key, frontend consume eventos en tiempo real.
- **Tools del agente**: `ToolRegistry` con 11 tools: `canvas_list/read/create/edit`, `memory_list/read/write`, `fs_read/write/list/search`. Sandboxing de filesystem contra `repo_root`. Memoria persiste en archivos `.md`. Canvas comparte store con REST API.
- **SSE streaming endpoint**: `POST /api/chat/stream` reemplaza endpoints dummy. Devuelve `EventSourceResponse` con eventos `text_delta`, `tool_call_start/end`, `done`. Sin API key → error 503 con mensaje claro.
- **Canvas store compartido**: `services/canvas_store.py` con `CanvasStore` multi-documento. Usado tanto por REST API como por tools del agente.
- **HttpStreamingRepository**: Nuevo repo frontend que consume SSE vía `fetch` + `ReadableStream`. Implementa `StreamingRepository` interfaz extraída del mock. Envía historial completo de mensajes.
- **StreamingRepository interfaz**: Tipos `StreamEvent` y función `eventsToParts` extraídos a archivo propio. Interfaz `StreamingRepository` con `stream(messages)`.
- **core/config.ts**: `API_BASE` desde `VITE_API_BASE` env var (default `http://localhost:8000`).
- **agentStatusStore.error**: Nuevo campo `error` + `setError()` para mostrar toast cuando falta API key.
- **backend/config.py**: `Settings` con `openai_api_key`, `openai_model`, `repo_root`, `max_tool_iterations`. Carga `.env` con `python-dotenv`.
- **frontend/.env.example** y **backend/.env.example**: Templates de configuración.

### Changed

- **routers/chat.py**: Reemplazado GET/POST dummy messages por `POST /stream` con SSE.
- **routers/canvas.py**: Refactorizado a usar `CanvasStore` compartido. Endpoints ahora multi-documento con `/{doc_id}`.
- **chatStore**: Inyecta `HttpStreamingRepository` en lugar de mock. `sendMessage` envía historial completo (`messages[]`). Maneja eventos `error` del backend.
- **main.py**: Startup valida `OPENAI_API_KEY`. `/health` expone `agent_ready`.
- **frontend/package.json**: Dependencias frontend sin cambios (vitest sigue siendo gap conocido).

### Removed

- **MockStreamingRepository**: Eliminado. Reemplazado por `HttpStreamingRepository` + `StreamingRepository.ts` (interfaz + tipos extraídos).

### Fixed

- **Python 3.9 compat**: Tipos `Optional[X]` en lugar de `X | None` en todo el backend.

- **Canvas multi-tab**: `canvasStore` migrado a multi-documento con `documents[]`, `activeDocumentId`, `loadDocuments`, `addDocument`, `removeDocument`. `DocumentRepository` extendido con `getAll()`, `addDocument()`, `removeDocument()`. `MarkdownCanvas` rediseñado con tab bar superior (tabs navegables, botón +New), toolbar segmented (Preview/Edit/Split), métricas movidas al panel de edición. Skeleton loading states.
- **Memoria editable**: `memoryStore` extendido con `addFile(type, title)`, `updateFile(id, data)`, `setEditing()`. `MemoryRepository` extendido con `add()`, `update()`. `MemoryFileList` con botón "+ New memory" + modal selector de tipo. `MemoryFileContent` con edición in-place de título + contenido con auto-save 1.5s y empty state ilustrado. Key-based remount para evitar efectos de sincronización.
- **Command Palette ampliado**: `CommandPalette` ahora incluye documentos de Canvas, archivos de memoria, y conversations como items de búsqueda. Descripciones contextuales por tipo.
- **Skeleton component**: Nuevo `Skeleton` y `TextSkeleton` en `core/presentation/components/Skeleton.tsx` para loading states en canvas y memoria.
- **Modelo mensaje extendido**: `Message` entity ahora soporta `parts: MessagePart[]` con tipos `text | tool_call | thinking | citation`. Factory `createMessagePart` con helpers por tipo. Tool call status enum: `running | success | error`.
- **Streaming real**: Nuevo `MockStreamingRepository` con `AsyncGenerator<StreamEvent>` que produce eventos realistas (thinking → tool_call → text → done) con delays variables y 4 escenarios. Función `eventsToParts` convierte eventos a `MessagePart[]`.
- **useMessageStream hook**: Hook que expone `{ parts, isStreaming, cursor }` desde `chatStore.streamingParts`. Integrado en `ChatMessage` para renderizar partes durante streaming con cursor parpadeante CSS (`animate-caret-blink`).
- **Part renderers**: Nuevos componentes en `parts/`: `ToolCallBlock` (colapsable con icono status, input/output JSON, 3 estados), `ThinkingBlock` (colapsable con duración, borde izquierdo), `CitationChip` (chip inline numerado), `DiffView` (tabla unified diff con +/- coloreado warm).
- **Status bar**: Nuevo componente `StatusBar` (footer fijo 28px) con secciones: dot animado de estado agente, modelo activo, archivos en contexto, git branch, shortcuts (⌘K/⌘//⌘⏎). Integrado en `SplitScreenLayout`. Store `agentStatusStore` con estados `idle | thinking | running_tool | streaming`.
- **Toast con acciones**: `toastStore` extendido con `action?: { label, onClick }` opcional. `ToastProvider` renderiza botón de acción + botón dismiss. Auto-dismiss extendido a 4s.
- **Design tokens**: Nuevos tokens CSS `--surface-elevated`, `--surface-sunken`, `--surface-code`, `--text-quiet`, `--text-muted`, `--text-strong`, `--ring-subtle`, `--ring-focus`, `--motion-fast/base/slow` con curva `cubic-bezier(0.2, 0, 0, 1)`. Tipografía: Inter para UI, JetBrains Mono para code via Google Fonts. Animaciones `caret-blink`, `fade-in`, `scale-in`. Soporte `prefers-reduced-motion`.
- **Composer rico**: `ChatInput` convertido a composer con 3 zonas. Toolbar superior `ContextChips` (modelo, modo, archivos), textarea autoexpand con slash commands y @mentions, toolbar inferior (attach, voice placeholder, char counter, send). Nuevos subcomponentes en `composer/`: `SlashMenu`, `MentionMenu`, `AttachmentTray`, `ContextChips`.
- **Slash commands Hook**: `useSlashCommands` detecta `/` al inicio/tras espacio con regex, expone items filtrados + replaceRange. 6 comandos mock: `/clear`, `/canvas`, `/memory`, `/model`, `/help`, `/diff`. Navegación teclado ↑↓ Enter Esc con index clamping seguro.
- **@mentions**: `MentionMenu` lista documentos del CanvasStore + archivos del MemoryStore con filtrado fuzzy. Tipos visuales: canvas badge C, memory badge M.
- **Mensajes pulidos**: `ChatMessage` con timestamp on-hover, barra acciones flotante (copy, Canvas, Regenerate, Fork) en hover. User message: bubble parchment con `ring-ring-subtle`. Assistant: monograma 20px + header nombre/timestamp, prose full-width.
- **Code blocks mejorados**: Nuevo componente `CodeBlock` con header bar (lenguaje + botón copy con feedback visual). Wrapping SyntaxHighlighter con header.
- **Nuevos iconos**: `PaperclipIcon`, `MicIcon`, `RefreshCwIcon`, `GitForkIcon`, `FileIcon` añadidos a `icons.tsx`.

### Changed

- **canvasStore**: Factoría refactorizada a multi-documento. Sección `getActiveDocument` exportada para backward-compat. `ChatInput` actualizado para consumir nuevo shape del store.
- **memoryStore**: Factoría extendida con métodos `addFile`/`updateFile`/`setEditing`. `selectFile` ahora resetea `isEditing`. `MemoryViewer` pasa `key={selectedFileId}` a `MemoryFileContent`.
- **Font size re-scale**: Re-escalados los tres valores `data-font-size` para que `compact` (12px) se sienta denso al estilo Claude Code, `default` (14px) sea el nuevo punto medio, y `comfortable` (16px) siga siendo holgado.
- **SplitScreenLayout**: Paneles convertidos a tarjetas flotantes estilo Claude Code. Outer container ahora tiene `p-2 md:p-3` con fondo parchment visible como "mesa". Paneles envueltos en `rounded-2xl ring-1 ring-border-warm overflow-hidden`. Toolbar subida a `h-14`. Sidebar envuelto en tarjeta flotante. StatusBar integrado como footer fijo.
- **index.css**: Dark theme migrado a paleta warm dedicada (charcoal `#1c1c1a`, ivory dark `#26261f`). `@theme` extendido con surface/text/ring/motion tokens. `font-family` actualizado a Inter. `font-mono` class con JetBrains Mono. Animación `animate-scale-in` añadida.
- **MemoryViewer**: Fondo cambiado de `bg-bg` a `bg-card`.
- **MemoryFileList**: Bordes internos suavizados de `border-border` a `border-border-cream`.
- **MarkdownCanvas**: Header border suavizado de `border-border` a `border-border-cream`.
- **Sidebar**: Eliminado `border-r border-border` redundante.
- **Borders**: Varios componentes migrados de `border-border` a `border-border-cream` para consistencia.

### Fixed

- **Chat scroll jank**: Reemplazado `scrollIntoView({ behavior: 'smooth' })` con instant `scrollTop` + polling a 40ms durante streaming.
- **Chat scroll handler throttled**: Envuelto handleScroll con `requestAnimationFrame`.
- **ChatMessage markdownComponents memoized**: Movido a módulo-level constant.
- **CSS GPU compositing**: `will-change: transform, opacity` en animaciones; `contain-content` en scroll container.
- **useStreamingText optimizado**: Intervalo 30ms→40ms, speed 3→5 chars/frame.
- **SplitScreenLayout transiciones**: `transition-[width]` deshabilitado durante drag; `min-w-0` para flex shrinking.
- **chatStore streaming**: Finalización persiste vía `conversationRepository.save()` antes de `loadConversations()` para evitar desaparición del mensaje tras stream.
