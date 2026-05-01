import { useState } from 'react';

interface ThinkingBlockProps {
  content: string;
  duration?: number;
}

export const ThinkingBlock = ({ content, duration }: ThinkingBlockProps) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="my-2">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-xs text-olive-gray transition-colors hover:text-charcoal-warm"
      >
        <span className="text-warm-silver">{collapsed ? '▶' : '▼'}</span>
        <span>Thought{duration ? ` for ${duration.toFixed(1)}s` : ''}</span>
      </button>
      {!collapsed && content && (
        <div className="mt-1 border-l-2 border-border-warm pl-3">
          <p className="text-sm leading-relaxed text-olive-gray">{content}</p>
        </div>
      )}
    </div>
  );
};
