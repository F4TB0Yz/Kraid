import { useState } from 'react';
import { BrainIcon } from '../../../../../core/presentation/components/icons';

interface ThinkingBlockProps {
  content: string;
  duration?: number;
}

export const ThinkingBlock = ({ content, duration }: ThinkingBlockProps) => {
  const isStreaming = duration === undefined || duration === 0;
  const [collapsedOverride, setCollapsedOverride] = useState<boolean | null>(null);
  const collapsed = collapsedOverride ?? !isStreaming;

  return (
    <div className="my-3 flex flex-col gap-1.5">
      <button
        onClick={() => setCollapsedOverride(!collapsed)}
        className="group flex w-max items-center gap-2 rounded-full px-2 py-1 text-xs transition-colors hover:bg-warm-sand"
      >
        <BrainIcon className={`h-3.5 w-3.5 text-warm-silver transition-colors group-hover:text-charcoal-warm ${isStreaming ? 'animate-shimmer' : ''}`} />
        <span className={`font-serif italic text-olive-gray ${isStreaming ? 'animate-fade-in' : ''}`}>
          {duration != null && duration > 0 ? `Reflexionó por ${duration.toFixed(1)}s` : 'Analizando contexto...'}
        </span>
      </button>

      {!collapsed && content && (
        <div className="ml-3 animate-scale-in border-l-[1.5px] border-border-cream pl-4 py-1">
          <p className="text-sm leading-relaxed text-stone-gray">{content}</p>
        </div>
      )}
    </div>
  );
};
