# AGENTS.md — Kraid

## Project Identity

**Kraid** es un monorepo full-stack:

- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 + TypeScript (ES2023)
- **Backend**: FastAPI (Python 3.9) + Uvicorn
- **Package manager**: npm (frontend), pip/venv (backend)

## Commands

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Build para producción |
| `npm run preview` | Preview del build |
| `npm run lint` | ESLint (TypeScript + React Hooks) |
| `npm run typecheck` | TypeScript compiler (tsc --noEmit) |
| `npm test` | Vitest test runner (jsdom + Testing Library) |

### Backend (`backend/`)

```bash
# Activar venv y correr servidor
source backend/.venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

## Architecture

### Clean Architecture — Feature Slices

Cada feature es un módulo vertical con 3 capas:

```
features/
└── $feature/
    ├── data/                    # Capa 1: Acceso a datos
    │   └── repositories/
    │       └── NombreRepository.ts
    ├── domain/                  # Capa 2: Lógica de negocio
    │   ├── entities/
    │   │   └── Nombre.ts
    │   └── errors/
    │       └── NombreErrors.ts
    └── presentation/            # Capa 3: UI + Estado
        ├── components/
        │   └── NombreComponente.tsx
        └── store/
            └── nombreStore.ts
```

**Features actuales**: `chat`, `canvas`
**Core compartido**: `core/presentation/layouts/SplitScreenLayout.tsx`

### State Management

- **Zustand** para estado local de features
- Factory pattern: `createNombreStore(config)` con inyección de repositorio
- Los stores exponen: estado sincrono + acciones asíncronas (`load*`, `add*`, `update*`)

### Data Layer

- Repository pattern con interfaces
- Mock implementations con delays simulados (para desarrollo)
- Fácil swapping a implementaciones reales (API real)

### Dependency Flow

```
presentation/ → domain/ ← data/
```

Presentation depende de domain. Domain no depende de nadie. Data implementa interfaces de domain.

## Code Conventions

### TypeScript

- `verbatimModuleSyntax` habilitado — imports/exports exactos
- `noUnusedLocals: true`, `noUnusedParameters: true`
- Factory functions sobre clases para entidades: `createDocument()`, `createMessage()`
- Never barrel imports desde features hacia el exterior

### Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Componentes React | PascalCase + Sufijo.tsx | `ChatPanel.tsx` |
| Stores Zustand | camelCase + Sufijo `Store` | `chatStore.ts` |
| Entidades | PascalCase | `Message.ts`, `Document.ts` |
| Errores | PascalCase + Sufijo `Error` | `DocumentNotFoundError.ts` |
| Repositorios | PascalCase + Sufijo `Repository` | `MessageRepository.ts` |
| Funciones factory | `create` + Nombre entidad | `createMessage()` |

### Errores de Dominio

Patrón por feature:

```
ChatDomainError (base)
  └── MessageNotFoundError
  └── MessageLoadFailure

CanvasDomainError (base)
  └── DocumentNotFoundError
  └── DocumentLoadFailure
```

### Styling

- **Tailwind CSS v4** con `@tailwindcss/typography` para prose
- Variables CSS para theming en `src/index.css`
- Ring shadows (`0px 0px 0px 1px`) — NO drop shadows
- Prefijo `ring-` de Tailwind para bordes cálidos

### Diseño Visual

Referencia: `claude_design_system.md`

- Paleta cálida: Parchment `#f5f4ed`, Terracotta `#c96442`, Charcoal `#141413`
- Tipografía: Serif headlines, Sans UI, Mono code
- Warm borders: Border Cream `#f0eee6`, Border Warm `#e8e6dc`

## Testing

- **Vitest** + **jsdom** + **@testing-library/react**
- Archivos: `src/**/*.{test,spec}.{ts,tsx}`
- Setup: `src/test/setup.ts` (cleanup + jest-dom matchers)
- Test store logic (useStore), no testar implementación de React a fondo

## Testing Backend

No tests configurados aún. Estructura: `backend/tests/`

## Rules for Agents

1. **Modo Caveman Lite** — Antes de cualquier respuesta, cargar la skill `caveman` en modo `lite`. Responder de forma ultra-comprimida: sin artículos innecesarios, sin relleno, fragmentación permitida, sinónimos cortos. Mantener toda precisión técnica. Solo desactivarlo temporalmente para advertencias de seguridad o confirmaciones de acciones irreversibles. Reanudar tras resolver.

2. **Git status pre-check** — Antes de empezar a trabajar, ejecutar `git status`. Si hay cambios sin commit NO relacionados con la tarea actual (staged o unstaged), notificar al usuario con la lista de archivos y sugerir hacer commit antes de continuar. Esperar instrucciones. No trabajar sobre working tree sucio. Si los cambios SÍ están relacionados, proceder normalmente.

3. **No modificar `package.json`** para agregar dependencias sin confirmar primero

4. **Seguir feature slice pattern** — todo código nuevo va en `features/$feature/` o `core/`

5. **Usar factory functions** para entidades, no clases

6. **Seguir naming conventions** de arriba

7. **Nunca hardcodear URLs de API** — usar el repositorio pattern

8. **Verificar frontend antes de entregar** — después de cambios en `frontend/`, correr en este orden: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Si cualquiera falla, corregir antes de continuar. Si el cambio no toca frontend, omitir.

9. **Mantener consistencia** con los patrones de error existentes (`*DomainError`, `*NotFoundError`, `*LoadFailure`)

10. **No crear archivos de test duplicados** — seguir la estructura `src/test/` que refleja la distribución

11. **No modificar el backend** sin confirmar estructura de directorios

12. **Verificar backend antes de entregar** — después de cambios en `backend/`, activar venv y verificar: `python -m py_compile app/main.py` y `python -c "from app.main import app"`. Si falla, corregir antes de continuar. Si el cambio no toca backend, omitir.

13. **Responder en español**

14. **Pre-entrega final** — antes de marcar tarea como completa, todas las verificaciones relevantes (reglas 8, 12) deben pasar sin errores. Si el cambio es exclusivamente documental (solo archivos `.md`), omitir verificaciones.

15. **Documentar todos los cambios** en el archivo `CHANGELOG.md`

16. **Preguntar si se quiere subir commit**.

## Gaps Conocidos

- `package.json` no tiene: `zustand`, `react-markdown`, `lucide-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `tailwindcss`, `@tailwindcss/typography`, ESLint plugins
- No scripts de `lint`, `typecheck`, `test` en package.json (deben agregarse)
- Backend sin tests, sin base de datos (todo in-memory dummy)
- `frontend/index.html` referencia `main.jsx`, debería ser `main.tsx`
- Existen `vite.config.ts` y `vite.config.js` duplicados

## Design System

Para decisiones de diseño (colores, tipografía, espaciado, sombras), consultar `claude_design_system.md`.

### Quick Reference

| Rol | Color | Hex |
|-----|-------|-----|
| Background | Parchment | `#f5f4ed` |
| CTA / Brand | Terracotta | `#c96442` |
| Card | Ivory | `#faf9f5` |
| Text | Near Black | `#141413` |
| Border | Border Cream | `#f0eee6` |