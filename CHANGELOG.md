# Changelog

## [Unreleased]

### Changed

- **Font size re-scale**: Re-escalados los tres valores `data-font-size` para que `compact` (12px) se sienta denso al estilo Claude Code, `default` (14px) sea el nuevo punto medio, y `comfortable` (16px) siga siendo holgado. Cambio de 3 líneas en `index.css`.
- **SplitScreenLayout**: Paneles convertidos a tarjetas flotantes estilo Claude Code. Outer container ahora tiene `p-2 md:p-3` con fondo parchment visible como "mesa". Paneles envueltos en `rounded-2xl ring-1 ring-border-warm overflow-hidden`. Toolbar subida a `h-14` con botones `h-9 w-9 rounded-lg`, eliminado `border-b`. Divider reemplazado por handle invisible de 16px con indicador hover sutil (`bg-ring-warm/40`). Sidebar envuelto en tarjeta flotante con `m-2 md:m-3 rounded-2xl ring-1 ring-border-warm`.
- **MemoryViewer**: Fondo cambiado de `bg-bg` a `bg-card` para consistencia con el interior de tarjetas.
- **MemoryFileList**: Bordes internos suavizados de `border-border` a `border-border-cream`.
- **MarkdownCanvas**: Header border suavizado de `border-border` a `border-border-cream`.
- **Sidebar**: Eliminado `border-r border-border` redundante (el ring de la tarjeta contenedora provee el borde exterior).

### Fixed

- **Chat scroll jank**: Reemplazado `scrollIntoView({ behavior: 'smooth' })` con instant `scrollTop` + polling a 40ms durante streaming, smooth solo fuera de streaming. Elimina chasing effect entre smooth scroll y crecimiento de texto.
- **Chat scroll handler throttled**: Envuelto handleScroll con `requestAnimationFrame` para evitar re-renders excesivos en cada evento scroll.
- **ChatMessage markdownComponents memoized**: Movido a módulo-level constant para evitar re-render completo de ReactMarkdown en cada frame de streaming (~40ms).
- **CSS GPU compositing**: Agregado `will-change: transform, opacity` a `.animate-message-slide-up`; agregado `contain-content` al contenedor de scroll para aislar layout.
- **useStreamingText optimizado**: Intervalo de 30ms→40ms, speed default 3→5 caracteres por frame. Reduce re-renders sin afectar percepción.
- **SplitScreenLayout transiciones optimizadas**: `transition-[width]` deshabilitado durante drag; `will-change-[width]` activo solo cuando right panel visible; `min-w-0` agregado para flex shrinking correcto.
