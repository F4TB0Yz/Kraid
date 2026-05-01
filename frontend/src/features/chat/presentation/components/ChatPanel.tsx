import { useEffect, useRef, useState, useMemo } from 'react';
import { useChatStore } from '../store/chatStore';
import { useSettingsStore } from '../../../settings/presentation/store/settingsStore';
import { useConversationStore } from '../../../conversations/presentation/store/conversationStore';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from './TypingIndicator';
import { CogIcon, KraidIcon, ArrowDownIcon } from '../../../../core/presentation/components/icons';
import { Avatar } from '../../../../core/presentation/components/Avatar';

const SUGGESTIONS = [
  "Explain how this code works",
  "Help me think through a problem",
  "Summarize the key points",
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const WelcomeScreen = ({ onSuggest, agentName }: { onSuggest: (text: string) => void, agentName: string }) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center animate-message-slide-up">
    <div className="flex flex-col items-center gap-4">
      <Avatar role="assistant" size="lg" />
      <div>
        <h2 className="font-serif text-xl font-medium text-text">{getGreeting()}</h2>
        <p className="mt-1 text-sm text-warm-silver">How can {agentName} help you today?</p>
      </div>
    </div>
    <div className="flex flex-wrap justify-center gap-2 max-w-md mt-2">
      {SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSuggest(suggestion)}
          className="rounded-full border border-border-warm bg-card px-4 py-2 text-sm text-charcoal-warm transition-colors hover:bg-warm-sand hover:text-text"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

export const ChatPanel = () => {
  const { isLoading, error, sendMessage, clearError } = useChatStore();
  const { activeConversationId, conversations, loadConversations } = useConversationStore();
  const { preferences, openSettings } = useSettingsStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const messages = useMemo(() => activeConversation?.messages || [], [activeConversation?.messages]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showScrollFab) {
      scrollToBottom();
    }
  }, [messages, isLoading, showScrollFab]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Show FAB if we are scrolled up more than 100px from the bottom
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollFab(isScrolledUp);
  };

  const statusColor = error ? 'bg-error' : isLoading ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="flex h-full flex-col bg-card relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-cream px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-ivory">
              <KraidIcon className="h-3 w-3" />
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-card ${statusColor}`} />
          </div>
          <h1 className="font-serif text-base font-medium text-text">{preferences.agentName}</h1>
        </div>
        <button
          onClick={openSettings}
          className="rounded-full p-1.5 text-warm-silver transition-colors hover:bg-warm-sand hover:text-charcoal-warm"
          aria-label="Open settings"
        >
          <CogIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between border-b border-border-cream bg-error/10 px-4 py-2 shrink-0">
          <p className="text-xs text-error">{error}</p>
          <button
            onClick={clearError}
            className="text-xs text-error underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Messages area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto px-4 py-5"
      >
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen onSuggest={sendMessage} agentName={preferences.agentName} />
        ) : (
          <div className="flex flex-col gap-6">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollFab && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 animate-message-slide-up" style={{ animationDuration: '0.2s' }}>
          <button
            onClick={scrollToBottom}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-bg shadow-md ring-1 ring-border text-charcoal-warm transition-colors hover:text-accent hover:bg-warm-sand"
            aria-label="Scroll to bottom"
          >
            <ArrowDownIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};
