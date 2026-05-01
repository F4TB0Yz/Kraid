import { create } from 'zustand';
import type { Conversation } from '../../domain/entities/Conversation';
import type { Message } from '../../../chat/domain/entities/Message';
import { conversationRepository } from '../../data/repositories/ConversationRepository';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  loadConversations: () => void;
  setActiveConversation: (id: string | null) => void;
  createNewConversation: (firstMessageContent: string) => Conversation;
  addMessageToActive: (message: Message) => void;
  deleteConversation: (id: string) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: conversationRepository.getAll().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
  activeConversationId: null,

  loadConversations: () => {
    set({
      conversations: conversationRepository.getAll().sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    });
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
  },

  createNewConversation: (firstMessageContent) => {
    const newId = crypto.randomUUID();
    const title = firstMessageContent.slice(0, 30) + (firstMessageContent.length > 30 ? '...' : '');
    const newConv: Conversation = {
      id: newId,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    conversationRepository.save(newConv);
    set((state) => ({
      conversations: [newConv, ...state.conversations],
      activeConversationId: newId,
    }));
    return newConv;
  },

  addMessageToActive: (message) => {
    const { activeConversationId, conversations } = get();
    if (!activeConversationId) return;

    const convIndex = conversations.findIndex((c) => c.id === activeConversationId);
    if (convIndex === -1) return;

    const updatedConv = {
      ...conversations[convIndex],
      messages: [...conversations[convIndex].messages, message],
      updatedAt: new Date(),
    };

    conversationRepository.save(updatedConv);

    const newConversations = [...conversations];
    newConversations[convIndex] = updatedConv;
    newConversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    set({ conversations: newConversations });
  },

  deleteConversation: (id) => {
    conversationRepository.delete(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    }));
  },
}));
