import { create } from 'zustand';
import type { Message, MessagePart } from '../../domain/entities/Message';
import { useConversationStore } from '../../../conversations/presentation/store/conversationStore';
import { conversationRepository } from '../../../conversations/data/repositories/ConversationRepository';
import type { Conversation } from '../../../conversations/domain/entities/Conversation';
import { useAgentStatusStore } from '../../../../core/presentation/store/agentStatusStore';
import { mockStreamingRepository, eventsToParts } from '../../data/repositories/MockStreamingRepository';

interface ChatState {
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingParts: MessagePart[];
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  completeStreaming: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  streamingParts: [],
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

      const assistantId = crypto.randomUUID();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        parts: [],
      };
      convStore.addMessageToActive(assistantMsg);

      set({
        isLoading: false,
        isStreaming: true,
        streamingMessageId: assistantId,
        streamingParts: [],
      });

      const events: import('../../data/repositories/MockStreamingRepository').StreamEvent[] = [];

      const stream = mockStreamingRepository.stream(content);
      for await (const event of stream) {
        events.push(event);

        switch (event.type) {
          case 'thinking_start': {
            useAgentStatusStore.getState().setStatus('thinking');
            break;
          }
          case 'tool_call_start': {
            useAgentStatusStore.getState().setStatus('running_tool');
            useAgentStatusStore.getState().setActiveTool(event.tool);
            break;
          }
          case 'tool_call_end': {
            useAgentStatusStore.getState().setActiveTool(null);
            break;
          }
          case 'text_delta': {
            useAgentStatusStore.getState().setStatus('streaming');
            break;
          }
        }

        const currentParts = eventsToParts(events);
        set({ streamingParts: currentParts });
      }

      const finalParts = eventsToParts(events);
      const fullText = finalParts
        .filter((p): p is Extract<MessagePart, { type: 'text' }> => p.type === 'text')
        .map((p) => p.content)
        .join('');

      const updatedMessage: Message = {
        ...assistantMsg,
        content: fullText,
        parts: finalParts,
      };

      const convState = useConversationStore.getState();
      const convs = convState.conversations;
      const convIdx = convs.findIndex((c) => c.id === currentConvId);
      if (convIdx >= 0) {
        const conv = convs[convIdx];
        const updatedConv: Conversation = {
          ...conv,
          messages: conv.messages.map((m) => (m.id === assistantId ? updatedMessage : m)),
          updatedAt: new Date(),
        };
        conversationRepository.save(updatedConv);
        convState.loadConversations();
      }

      set({
        isStreaming: false,
        streamingMessageId: null,
        streamingParts: [],
      });

      useAgentStatusStore.getState().setStatus('idle');
    } catch {
      set({ error: 'Failed to send message', isLoading: false, isStreaming: false });
      useAgentStatusStore.getState().setStatus('idle');
    }
  },

  completeStreaming: () =>
    set({
      isStreaming: false,
      streamingMessageId: null,
      streamingParts: [],
    }),

  clearError: () => set({ error: null }),
}));
