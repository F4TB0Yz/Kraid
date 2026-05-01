export interface MentionItem {
  id: string;
  label: string;
  type: 'canvas' | 'memory';
}

interface MentionMenuProps {
  open: boolean;
  items: MentionItem[];
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
}

export const MentionMenu = ({ open, items, selectedIndex, onSelect }: MentionMenuProps) => {
  if (!open || items.length === 0) return null;

  return (
    <div className="absolute bottom-full left-2 right-2 z-50 mb-2 overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-border animate-scale-in">
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
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-medium ${
                item.type === 'canvas'
                  ? 'bg-accent/10 text-accent'
                  : 'bg-blue-400/10 text-blue-600'
              }`}
            >
              {item.type === 'canvas' ? 'C' : 'M'}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
