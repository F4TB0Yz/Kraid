import { create } from 'zustand';
import type { Message } from '../../domain/entities/Message';
import type { MessageRepository } from '../../data/repositories/MessageRepository';
import { MockMessageRepository } from '../../data/repositories/MessageRepository';
import { MessageLoadFailure, ChatDomainError } from '../../domain/errors/ChatErrors';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  loadMessages: () => Promise<void>;
  addMessage: (content: string, role: 'user' | 'assistant') => Promise<void>;
  clearError: () => void;
}

interface ChatStoreConfig {
  repository: MessageRepository;
}

export const createChatStore = (config: ChatStoreConfig) => {
  const { repository } = config;

  return create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    error: null,

    loadMessages: async () => {
      set({ isLoading: true, error: null });
      try {
        const messages = await repository.getAll();
        set({ messages, isLoading: false });
      } catch (err) {
        const error = err instanceof ChatDomainError ? err : new MessageLoadFailure();
        set({ error: error.message, isLoading: false });
      }
    },

    addMessage: async (content: string, role: 'user' | 'assistant') => {
      set({ isLoading: true, error: null });
      try {
        const newMessage = await repository.add({ role, content });
        set((state) => ({
          messages: [...state.messages, newMessage],
          isLoading: false,
        }));
      } catch (err) {
        const error = err instanceof ChatDomainError ? err : new ChatDomainError('Failed to add message');
        set({ error: error.message, isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  }));
};

export const useChatStore = createChatStore({ repository: new MockMessageRepository() });
