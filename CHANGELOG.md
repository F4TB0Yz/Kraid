# Changelog

## [Unreleased]

### Added

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
