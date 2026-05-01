import { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore } from '../../../../../core/presentation/store/settingsStore';

export const ModelPicker = () => {
  const { availableModels, selectedModel, isLoadingModels, loadModels, setSelectedModel } =
    useSettingsStore();
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = selectedModel ?? (isLoadingModels ? 'Loading...' : 'Select model');

  useEffect(() => {
    if (open && availableModels.length === 0 && !isLoadingModels) {
      void loadModels();
    }
  }, [open, availableModels.length, isLoadingModels, loadModels]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const clampedIndex = Math.min(selectedIndex, Math.max(0, availableModels.length - 1));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, availableModels.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (availableModels[clampedIndex]) {
          setSelectedModel(availableModels[clampedIndex].id);
          setOpen(false);
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, availableModels, clampedIndex, setSelectedModel],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/15 transition-colors"
      >
        {displayLabel}
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-56 overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-border animate-scale-in">
          {availableModels.length === 0 ? (
            <div className="px-4 py-3 text-xs text-olive-gray">
              {isLoadingModels ? 'Loading models...' : 'No models available'}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto p-1.5">
              {availableModels.map((model, index) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    index === clampedIndex
                      ? 'bg-accent/10 text-accent'
                      : 'text-charcoal-warm hover:bg-warm-sand'
                  }`}
                >
                  <span className="truncate">{model.label}</span>
                  {model.id === selectedModel && (
                    <svg
                      className="ml-auto h-3.5 w-3.5 shrink-0 text-accent"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M3 8l3.5 3.5L13 5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
