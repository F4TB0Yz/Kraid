export const TOOL_LABELS: Record<string, string> = {
  fs_read: 'Leyendo archivo',
  fs_write: 'Escribiendo archivo',
  fs_list: 'Explorando directorio',
  fs_search: 'Buscando en el repositorio',
  canvas_create: 'Creando documento',
  canvas_edit: 'Editando documento',
  file_write: 'Guardando en memoria',
  file_read: 'Consultando memoria',
  file_list: 'Listando archivos',
};

export const STATUS_UI = {
  running: { icon: 'cog-spin', bg: 'bg-warm-sand/50' },
  success: { icon: 'check', bg: 'bg-transparent' },
  error: { icon: 'close', bg: 'bg-error/5' },
} as const;

export function getToolLabel(tool: string): string {
  return TOOL_LABELS[tool] || `Ejecutando ${tool}`;
}

export function getToolKeyArgument(input: Record<string, unknown>): string {
  const val = input?.path || input?.query || input?.slug || input?.title || '';
  return String(val);
}
