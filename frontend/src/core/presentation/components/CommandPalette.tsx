import { useState, useEffect, useRef } from 'react';
import { useConversationStore } from '../../../features/conversations/presentation/store/conversationStore';
import { useSettingsStore } from '../../../features/settings/presentation/store/settingsStore';
import { useMemoryStore } from '../../../features/memory/presentation/store/memoryStore';
import { useCanvasStore } from '../../../features/canvas/presentation/store/canvasStore';
import { SearchIcon, CogIcon, PlusIcon, PanelRightIcon, BrainIcon } from './icons';

interface PaletteItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  perform: () => void;
}

export const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { conversations, setActiveConversation, loadConversations } = useConversationStore();
  const { openSettings } = useSettingsStore();
  const { files: memoryFiles } = useMemoryStore();
  const { documents: canvasDocs } = useCanvasStore();

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
          }
          return next;
        });
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const allItems: PaletteItem[] = [
    { id: 'action-new-chat', title: 'New Chat', icon: <PlusIcon className="h-4 w-4" />, perform: () => { setActiveConversation(null); setIsOpen(false); } },
    { id: 'action-settings', title: 'Open Settings', icon: <CogIcon className="h-4 w-4" />, perform: () => { openSettings(); setIsOpen(false); } },
    ...conversations.map((conv) => ({
      id: `conv-${conv.id}`,
      title: conv.title,
      description: 'Conversation',
      icon: <SearchIcon className="h-4 w-4" />,
      perform: () => { setActiveConversation(conv.id); setIsOpen(false); },
    })),
    ...canvasDocs.map((doc) => ({
      id: `canvas-${doc.id}`,
      title: doc.title,
      description: 'Canvas document',
      icon: <PanelRightIcon className="h-4 w-4" />,
      perform: () => { setIsOpen(false); },
    })),
    ...memoryFiles.map((file) => ({
      id: `mem-${file.id}`,
      title: file.title,
      description: `Memory · ${file.type}`,
      icon: <BrainIcon className="h-4 w-4" />,
      perform: () => { setIsOpen(false); },
    })),
  ];

  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    (item.description?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].perform();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-charcoal/40 p-4 pt-[15vh] backdrop-blur-sm">
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-border animate-message-slide-up"
        style={{ animationDuration: '0.15s' }}
      >
        <div className="flex items-center border-b border-border px-4 py-3">
          <SearchIcon className="h-5 w-5 text-olive-gray" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="ml-3 flex-1 bg-transparent text-text outline-none placeholder:text-olive-gray"
          />
          <div className="flex gap-1">
            <kbd className="rounded border border-border bg-bg px-1.5 py-0.5 text-xs font-medium text-olive-gray">esc</kbd>
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredItems.map((item, index) => (
              <button
                key={item.id}
                onClick={item.perform}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                  index === selectedIndex
                    ? 'bg-accent/10 text-accent'
                    : 'text-charcoal-warm hover:bg-warm-sand'
                }`}
              >
                <div className={index === selectedIndex ? 'text-accent' : 'text-stone-gray'}>
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate">{item.title}</div>
                  {item.description && (
                    <div className="truncate text-xs text-olive-gray">{item.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-olive-gray">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
};
