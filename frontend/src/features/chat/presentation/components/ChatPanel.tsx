import React, { useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

export const ChatPanel: React.FC = () => {
  const { messages, isLoading, error, loadMessages, addMessage, clearError } =
    useChatStore();

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = (content: string) => {
    addMessage(content, 'user');
  };

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 text-red-500">
          <p>{error}</p>
          <button onClick={clearError} className="text-sm underline mt-2">
            Dismiss
          </button>
        </div>
        <ChatMessages messages={messages} />
        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatMessages messages={messages} />
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};
