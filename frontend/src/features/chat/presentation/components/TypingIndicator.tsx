import { useState, useEffect } from 'react';
import { Avatar } from '../../../../core/presentation/components/Avatar';

const PROSE = [
  "Thinking...",
  "Analyzing context...",
  "Drafting response...",
  "Almost there..."
];

export const TypingIndicator = () => {
  const [proseIndex, setProseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProseIndex(prev => (prev + 1) % PROSE.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-start gap-3 animate-message-slide-up">
      <Avatar role="assistant" />
      <div className="flex flex-col gap-3 w-full max-w-[85%] mt-1">
        <span className="text-xs font-medium text-warm-silver animate-pulse">
          {PROSE[proseIndex]}
        </span>
        <div className="space-y-2.5 w-full max-w-sm">
          <div className="h-3 w-3/4 rounded bg-border-warm animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-border-warm animate-pulse" />
        </div>
      </div>
    </div>
  );
};
