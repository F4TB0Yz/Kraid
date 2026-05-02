import { useState, useMemo, useCallback } from 'react';
import type { MessagePart, ToolCallStatus } from '../../../domain/entities/Message';
import {
  BrainIcon, CogIcon, CheckIcon, CloseIcon,
  ChevronRightIcon, ChevronDownIcon,
} from '../../../../../core/presentation/components/icons';
import { getToolLabel, getToolKeyArgument } from '../../constants/toolLabels';

interface ActivityLogProps {
  parts: MessagePart[];
  isStreaming: boolean;
}

type SummaryType =
  | { type: 'thinking_progress' }
  | { type: 'thinking_done_tool_running'; thinkingDuration: number; toolLabel: string; toolArg: string }
  | { type: 'tools_mixed'; completedCount: number; runningToolLabel: string }
  | { type: 'all_done'; thinkingDuration: number | null; totalTools: number; erroredCount: number };

function computeSummary(parts: MessagePart[], isStreaming: boolean): SummaryType {
  if (isStreaming && parts.length === 0) {
    return { type: 'thinking_progress' };
  }

  const thinkingParts = parts.filter((p): p is Extract<MessagePart, { type: 'thinking' }> => p.type === 'thinking');
  const toolParts = parts.filter((p): p is Extract<MessagePart, { type: 'tool_call' }> => p.type === 'tool_call');

  const runningTools = toolParts.filter(p => p.status === 'running');
  const completedTools = toolParts.filter(p => p.status === 'success');
  const erroredTools = toolParts.filter(p => p.status === 'error');

  const thinkingDuration = thinkingParts.length > 0 && thinkingParts[0].duration != null
    ? thinkingParts[0].duration : null;

  if (thinkingDuration != null && runningTools.length > 0) {
    const tool = runningTools[0];
    return {
      type: 'thinking_done_tool_running',
      thinkingDuration,
      toolLabel: getToolLabel(tool.tool),
      toolArg: getToolKeyArgument(tool.input),
    };
  }

  if (completedTools.length > 0 && runningTools.length > 0) {
    const tool = runningTools[0];
    return {
      type: 'tools_mixed',
      completedCount: completedTools.length,
      runningToolLabel: getToolLabel(tool.tool),
    };
  }

  return {
    type: 'all_done',
    thinkingDuration,
    totalTools: toolParts.length,
    erroredCount: erroredTools.length,
  };
}

function summaryActionKey(summary: SummaryType): string {
  switch (summary.type) {
    case 'thinking_progress': return 'thinking';
    case 'thinking_done_tool_running': return `tool-${summary.toolLabel}-${summary.toolArg}`;
    case 'tools_mixed': return `tools-mixed-${summary.runningToolLabel}`;
    case 'all_done': return 'done';
  }
}

function StatusIcon({ status, className }: { status: ToolCallStatus; className?: string }) {
  switch (status) {
    case 'running':
      return <CogIcon className={`${className ?? 'h-3.5 w-3.5'} text-stone-gray animate-spin-slow`} />;
    case 'success':
      return <CheckIcon className={`${className ?? 'h-3.5 w-3.5'} text-olive-gray`} />;
    case 'error':
      return <CloseIcon className={`${className ?? 'h-3.5 w-3.5'} text-error`} />;
  }
}

export const ActivityLog = ({ parts, isStreaming }: ActivityLogProps) => {
  const [expanded, setExpanded] = useState(false);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);

  const isDone = !isStreaming && parts.length > 0;
  const summary = useMemo(() => computeSummary(parts, isStreaming), [parts, isStreaming]);
  const actionKey = summaryActionKey(summary);

  const toggleExpanded = useCallback(() => {
    if (isDone) {
      setExpanded(e => !e);
    }
  }, [isDone]);

  const toggleDetail = useCallback((index: number) => {
    setDetailIndex(d => d === index ? null : index);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-border-cream transition-all duration-motion-base">
      <button
        onClick={toggleExpanded}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs"
      >
        <span className="flex shrink-0 items-center gap-1">
          {summary.type === 'thinking_progress' && (
            <BrainIcon className="h-3.5 w-3.5 text-warm-silver animate-shimmer" />
          )}
          {(summary.type === 'thinking_done_tool_running' || summary.type === 'tools_mixed') && (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-olive-gray" />
              <span className="text-warm-silver">·</span>
              <CogIcon className="h-3.5 w-3.5 text-stone-gray animate-spin-slow" />
            </>
          )}
          {summary.type === 'all_done' && (
            <CheckIcon className="h-3.5 w-3.5 text-olive-gray" />
          )}
        </span>

        <span key={actionKey} className="animate-activity-switch flex-1 truncate text-left text-charcoal-warm">
          {summary.type === 'thinking_progress' && 'Analizando contexto...'}
          {summary.type === 'thinking_done_tool_running' && (
            <>
              Reflexionó {summary.thinkingDuration.toFixed(1)}s
              <span className="text-warm-silver mx-1">·</span>
              {summary.toolLabel}{summary.toolArg ? ` (${summary.toolArg})` : ''}
            </>
          )}
          {summary.type === 'tools_mixed' && (
            <>
              {summary.completedCount} completadas
              <span className="text-warm-silver mx-1">·</span>
              {summary.runningToolLabel}...
            </>
          )}
          {summary.type === 'all_done' && (
            <>
              {summary.thinkingDuration != null && `Reflexionó ${summary.thinkingDuration.toFixed(1)}s`}
              {summary.totalTools > 0 && (
                <>{summary.thinkingDuration != null && <span className="text-warm-silver mx-1">·</span>}
                  {summary.totalTools} {summary.totalTools === 1 ? 'herramienta' : 'herramientas'}
                </>
              )}
            </>
          )}
        </span>

        {isDone && (
          <span className="shrink-0 text-warm-silver">
            {expanded ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
          </span>
        )}
      </button>

      {isDone && expanded && parts.length > 0 && (
        <div className="border-t border-border-cream">
          {parts.map((part, i) => {
            const isDetailOpen = detailIndex === i;

            if (part.type === 'thinking') {
              return (
                <div key={`act-thinking-${i}`}>
                  <button
                    onClick={() => toggleDetail(i)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-warm-sand/50"
                  >
                    <span className="flex shrink-0 items-center justify-center">
                      <BrainIcon className="h-3.5 w-3.5 text-warm-silver" />
                    </span>
                    <span className="flex-1 font-medium text-charcoal-warm">
                      {part.duration != null && part.duration > 0
                        ? `Reflexionó por ${part.duration.toFixed(1)}s`
                        : 'Analizando contexto...'}
                    </span>
                    <span className="shrink-0 text-warm-silver">
                      {isDetailOpen ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  {isDetailOpen && part.content && (
                    <div className="border-t border-border-cream bg-bg/50 px-4 py-3 animate-scale-in">
                      <p className="text-sm leading-relaxed text-stone-gray">{part.content}</p>
                    </div>
                  )}
                </div>
              );
            }

            if (part.type === 'tool_call') {
              const label = getToolLabel(part.tool);
              const arg = getToolKeyArgument(part.input);

              return (
                <div key={`act-tool-${part.toolCallId}`}>
                  <button
                    onClick={() => toggleDetail(i)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-warm-sand/50"
                  >
                    <span className="flex shrink-0 items-center justify-center">
                      <StatusIcon status={part.status} />
                    </span>
                    <div className="flex flex-1 items-center gap-2 truncate">
                      <span className="font-medium text-charcoal-warm">{label}</span>
                      {arg && <span className="font-mono text-[10px] text-stone-gray truncate">({arg})</span>}
                    </div>
                    <span className="shrink-0 text-warm-silver">
                      {isDetailOpen ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                  {isDetailOpen && (
                    <div className="border-t border-border-cream bg-bg/50 px-4 py-3 animate-scale-in">
                      {part.input && Object.keys(part.input).length > 0 && (
                        <div className="mb-3">
                          <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-warm-silver uppercase">Parámetros (JSON)</div>
                          <pre className="overflow-x-auto rounded-lg ring-1 ring-ring-subtle bg-surface-code p-2.5 font-mono text-[11px] text-warm-silver">
                            {JSON.stringify(part.input, null, 2)}
                          </pre>
                        </div>
                      )}
                      {part.output && (
                        <div>
                          <div className="mb-1.5 text-[10px] font-semibold tracking-wider text-warm-silver uppercase">Resultado</div>
                          <pre className={`overflow-x-auto whitespace-pre-wrap rounded-lg ring-1 ring-ring-subtle p-2.5 font-mono text-[11px] ${part.status === 'error' ? 'bg-error/10 text-error' : 'bg-card text-olive-gray'}`}>
                            {part.output}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
};
