import { useAgentStatusStore } from '../store/agentStatusStore';

const STATUS_DOT: Record<string, string> = {
  idle: 'bg-green-500',
  thinking: 'bg-amber-500 animate-pulse',
  running_tool: 'bg-blue-500 animate-pulse',
  streaming: 'bg-accent animate-pulse',
};

const STATUS_LABEL: Record<string, string> = {
  idle: 'Ready',
  thinking: 'Thinking',
  running_tool: 'Running tool',
  streaming: 'Streaming',
};

export const StatusBar = () => {
  const { status, activeTool, modelName, contextFiles, gitBranch } = useAgentStatusStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border-cream bg-card px-3 text-[11px] text-olive-gray">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
          <span>
            {STATUS_LABEL[status]}
            {activeTool && status === 'running_tool' && (
              <span className="ml-1 font-mono text-[10px]">({activeTool})</span>
            )}
          </span>
        </span>

        <span className="text-warm-silver">·</span>

        <span>{modelName}</span>

        {contextFiles > 0 && (
          <>
            <span className="text-warm-silver">·</span>
            <span>{contextFiles} files</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px]">{gitBranch}</span>
        <span className="text-warm-silver">·</span>
        <span className="hidden sm:inline">
          <kbd className="rounded border border-border-cream bg-bg px-1 font-mono">⌘K</kbd> palette
          <span className="mx-1">·</span>
          <kbd className="rounded border border-border-cream bg-bg px-1 font-mono">⌘/</kbd> slash
          <span className="mx-1">·</span>
          <kbd className="rounded border border-border-cream bg-bg px-1 font-mono">⌘⏎</kbd> send
        </span>
      </div>
    </footer>
  );
};
