import { useState } from 'react';
import type { ToolCallStatus } from '../../../domain/entities/Message';
import { CheckIcon, CloseIcon, CogIcon, ChevronRightIcon, ChevronDownIcon } from '../../../../../core/presentation/components/icons';

interface ToolCallBlockProps {
  tool: string;
  input: Record<string, unknown>;
  status: ToolCallStatus;
  output?: string;
}

const TOOL_LABELS: Record<string, string> = {
  fs_read: 'Leyendo archivo',
  fs_write: 'Escribiendo archivo',
  fs_list: 'Explorando directorio',
  fs_search: 'Buscando en el repositorio',
  canvas_create: 'Creando documento',
  canvas_edit: 'Editando documento',
  file_write: 'Guardando en memoria',
  file_read: 'Consultando memoria',
};

const STATUS_UI = {
  running: { icon: <CogIcon className="h-3.5 w-3.5 text-stone-gray animate-spin-slow" />, bg: 'bg-warm-sand/50' },
  success: { icon: <CheckIcon className="h-3.5 w-3.5 text-olive-gray" />, bg: 'bg-transparent' },
  error: { icon: <CloseIcon className="h-3.5 w-3.5 text-error" />, bg: 'bg-error/5' },
};

export const ToolCallBlock = ({ tool, input, status, output }: ToolCallBlockProps) => {
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const isRunning = status === 'running';
  const collapsed = collapsedOverride ?? !isRunning;
  const ui = STATUS_UI[status];
  const humanLabel = TOOL_LABELS[tool] || `Ejecutando ${tool}`;
  const keyArgument = input?.path || input?.query || input?.slug || input?.title || '';

  return (
    <div className={`my-2 overflow-hidden rounded-xl ring-1 ring-border-cream transition-all duration-motion-base ${ui.bg}`}>
      <button
        onClick={() => setCollapsedOverride(!collapsed)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition-colors hover:bg-warm-sand/50"
      >
        <span className="flex shrink-0 items-center justify-center">{ui.icon}</span>
        <div className="flex flex-1 items-center gap-2 truncate">
          <span className="font-medium text-charcoal-warm">{humanLabel}</span>
          {keyArgument && <span className="font-mono text-[10px] text-stone-gray truncate">({keyArgument})</span>}
        </div>
        <span className="text-warm-silver">
          {collapsed ? <ChevronRightIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-border-cream bg-bg/50 px-4 py-3 animate-scale-in">
          {input && Object.keys(input).length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-warm-silver uppercase">Parámetros (JSON)</div>
              <pre className="overflow-x-auto rounded-lg ring-1 ring-ring-subtle bg-surface-code p-2.5 font-mono text-[11px] text-warm-silver">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-warm-silver uppercase">Resultado</div>
              <pre className={`overflow-x-auto whitespace-pre-wrap rounded-lg ring-1 ring-ring-subtle p-2.5 font-mono text-[11px] ${status === 'error' ? 'bg-error/10 text-error' : 'bg-card text-olive-gray'}`}>
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
