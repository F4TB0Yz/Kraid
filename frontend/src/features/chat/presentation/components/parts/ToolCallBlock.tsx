import { useState } from 'react';
import type { ToolCallStatus } from '../../../domain/entities/Message';
import { CheckIcon, CloseIcon } from '../../../../../core/presentation/components/icons';

interface ToolCallBlockProps {
  tool: string;
  input: Record<string, unknown>;
  status: ToolCallStatus;
  output?: string;
}

const STATUS_CONFIG: Record<ToolCallStatus, { icon: React.ReactNode; label: string; color: string }> = {
  running: {
    icon: <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse" />,
    label: 'Running',
    color: 'text-amber-600',
  },
  success: {
    icon: <CheckIcon className="h-3.5 w-3.5 text-green-600" />,
    label: 'Success',
    color: 'text-green-600',
  },
  error: {
    icon: <CloseIcon className="h-3.5 w-3.5 text-error" />,
    label: 'Failed',
    color: 'text-error',
  },
};

export const ToolCallBlock = ({ tool, input, status, output }: ToolCallBlockProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const config = STATUS_CONFIG[status];

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-border-warm bg-card transition-all">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-warm-sand"
      >
        <span className="flex items-center gap-1.5">
          {config.icon}
          <span className={config.color}>{config.label}</span>
        </span>
        <span className="rounded bg-warm-sand px-1.5 py-0.5 font-mono text-olive-gray">
          {tool}
        </span>
        <span className="ml-auto text-olive-gray">
          {collapsed ? '▶' : '▼'}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-border-warm px-3 py-2">
          {input && Object.keys(input).length > 0 && (
            <div className="mb-2">
              <div className="mb-1 text-xs font-medium text-charcoal-warm">Input</div>
              <pre className="overflow-x-auto rounded bg-surface-code/5 p-2 text-xs text-charcoal-warm">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}
          {output && (
            <div>
              <div className="mb-1 text-xs font-medium text-charcoal-warm">Output</div>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-green-50 p-2 text-xs text-green-800">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
