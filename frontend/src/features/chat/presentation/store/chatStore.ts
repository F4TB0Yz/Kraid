import { create } from 'zustand';
import type { Message } from '../../domain/entities/Message';
import { useConversationStore } from '../../../conversations/presentation/store/conversationStore';

interface ChatState {
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  completeStreaming: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  error: null,

  sendMessage: async (content: string) => {
    set({ isLoading: true, error: null });
    try {
      const convStore = useConversationStore.getState();
      
      let currentConvId = convStore.activeConversationId;
      if (!currentConvId) {
        const newConv = convStore.createNewConversation(content);
        currentConvId = newConv.id;
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };
      
      convStore.addMessageToActive(userMsg);

      // Simulate thinking time
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockResponses = [
        "Here's what I found about that.\n\n### Key Points\n- First point is very important\n- Second point helps with understanding\n\nLet me know if you need more details.",
        "I can help with that! Here is a simple code example:\n\n```typescript\nconst x = 42;\nconsole.log('The answer is:', x);\n```\n\nThis should solve your problem.",
        "That's an interesting question. Based on the documentation, you should approach it by breaking it down into smaller steps. First, define the problem. Second, write tests."
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date(),
      };

      convStore.addMessageToActive(assistantMsg);

      set({
        isLoading: false,
        isStreaming: true,
        streamingMessageId: assistantMsg.id,
      });
    } catch {
      set({ error: 'Failed to send message', isLoading: false });
    }
  },

  completeStreaming: () => set({ isStreaming: false, streamingMessageId: null }),

  clearError: () => set({ error: null }),
}));