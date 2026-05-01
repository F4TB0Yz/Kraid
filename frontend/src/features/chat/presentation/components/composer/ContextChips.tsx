import { ModelPicker } from './ModelPicker';

const MODES = ['chat', 'agent', 'edit'] as const;

interface ContextChipsProps {
  mode: 'chat' | 'agent' | 'edit';
  contextFiles: number;
  onModeChange?: (mode: 'chat' | 'agent' | 'edit') => void;
}

export const ContextChips = ({ mode, contextFiles, onModeChange }: ContextChipsProps) => {
  return (
    <div className="flex items-center gap-1.5 px-3 pt-2 pb-1.5">
      <ModelPicker />
      <div className="flex overflow-hidden rounded-md ring-1 ring-border-warm">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => onModeChange?.(m)}
            className={`px-2 py-0.5 text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-accent text-ivory'
                : 'bg-card text-charcoal-warm hover:bg-warm-sand'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      {contextFiles > 0 && (
        <span className="inline-flex items-center gap-1 rounded-md bg-warm-sand px-2 py-0.5 text-xs font-medium text-olive-gray">
          {contextFiles} files
        </span>
      )}
    </div>
  );
};
