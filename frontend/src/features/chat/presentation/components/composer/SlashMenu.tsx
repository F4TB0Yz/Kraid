import type { SlashCommandItem } from '../../hooks/useSlashCommands';

interface SlashMenuProps {
  open: boolean;
  query: string;
  items: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
}

export const SlashMenu = ({ open, query, items, selectedIndex, onSelect }: SlashMenuProps) => {
  if (!open) return null;

  return (
    <div className="absolute bottom-full left-2 right-2 z-50 mb-2 overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-border animate-scale-in">
      {items.length === 0 ? (
        <div className="px-4 py-3 text-xs text-olive-gray">
          No command matches "{query}"
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto p-1.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-accent/10 text-accent'
                  : 'text-charcoal-warm hover:bg-warm-sand'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-warm-sand text-xs font-mono text-olive-gray">
                /
              </span>
              <div>
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-olive-gray">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
