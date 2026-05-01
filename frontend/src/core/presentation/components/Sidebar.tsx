import { useState, useMemo } from 'react';
import { useConversationStore } from '../../../features/conversations/presentation/store/conversationStore';
import { PlusIcon, TrashIcon, SearchIcon } from './icons';

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    deleteConversation,
  } = useConversationStore();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lowerQuery = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(lowerQuery));
  }, [conversations, searchQuery]);

  const handleNewChat = () => {
    setActiveConversation(null);
    if (onClose) onClose();
  };

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    if (onClose) onClose();
  };

  return (
    <div className="flex h-full w-full flex-col bg-card border-r border-border text-text">
      <div className="flex flex-col gap-4 p-4">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          New Chat
        </button>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-warm" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-9 py-2 text-sm text-text placeholder-charcoal-warm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="flex flex-col gap-1">
          {filteredConversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-charcoal-warm">
              {searchQuery ? "No matches found" : "No conversations yet"}
            </p>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-charcoal-warm hover:bg-warm-sand hover:text-text'
                }`}
              >
                <button
                  onClick={() => handleSelect(conv.id)}
                  className="flex-1 truncate text-left"
                >
                  {conv.title || 'New Conversation'}
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="ml-2 rounded p-1 text-charcoal-warm opacity-0 transition-all hover:bg-border hover:text-error group-hover:opacity-100"
                  title="Delete conversation"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
