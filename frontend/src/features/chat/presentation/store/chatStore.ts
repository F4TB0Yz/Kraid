import { create } from 'zustand';
import type { Message, MessagePart } from '../../domain/entities/Message';
import { useConversationStore } from '../../../conversations/presentation/store/conversationStore';
import { conversationRepository } from '../../../conversations/data/repositories/ConversationRepository';
import type { Conversation } from '../../../conversations/domain/entities/Conversation';
import { useAgentStatusStore } from '../../../../core/presentation/store/agentStatusStore';
import { useSettingsStore } from '../../../../core/presentation/store/settingsStore';
import { httpStreamingRepository } from '../../data/repositories/HttpStreamingRepository';
import { eventsToParts } from '../../data/repositories/StreamingRepository';

interface ChatState {
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingParts: MessagePart[];
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  triggerGreeting: () => Promise<void>;
  completeStreaming: () => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
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

      // Build full message history for the API
      const convState = useConversationStore.getState();
      const conv = convState.conversations.find((c) => c.id === currentConvId);
      const allMessages = conv?.messages ?? [];
      const apiMessages = allMessages
        .filter((m) => m.id !== assistantId)
        .map((m) => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content,
        }));

      const events: import('../../data/repositories/StreamingRepository').StreamEvent[] = [];

      const selectedModel = useSettingsStore.getState().selectedModel ?? undefined;
      const stream = httpStreamingRepository.stream(apiMessages, selectedModel, currentConvId);
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
          case 'error': {
            useAgentStatusStore.getState().setError(event.content);
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

      const finalConvState = useConversationStore.getState();
      const convs = finalConvState.conversations;
      const convIdx = convs.findIndex((c) => c.id === currentConvId);
      if (convIdx >= 0) {
        const currentConv = convs[convIdx];
        const updatedConv: Conversation = {
          ...currentConv,
          messages: currentConv.messages.map((m) => (m.id === assistantId ? updatedMessage : m)),
          updatedAt: new Date(),
        };
        conversationRepository.save(updatedConv);
        finalConvState.loadConversations();
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

  triggerGreeting: async () => {
    if (get().isStreaming) return;

    set({ isLoading: true, error: null });
    try {
      const convStore = useConversationStore.getState();

      const newId = crypto.randomUUID();
      const newConv: Conversation = {
        id: newId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      conversationRepository.save(newConv);
      convStore.loadConversations();
      convStore.setActiveConversation(newId);

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

      const selectedModel = useSettingsStore.getState().selectedModel ?? undefined;
      const events: import('../../data/repositories/StreamingRepository').StreamEvent[] = [];

      const stream = httpStreamingRepository.stream([], selectedModel, newId);
      for await (const event of stream) {
        events.push(event);

        switch (event.type) {
          case 'thinking_start':
            useAgentStatusStore.getState().setStatus('thinking');
            break;
          case 'tool_call_start':
            useAgentStatusStore.getState().setStatus('running_tool');
            useAgentStatusStore.getState().setActiveTool(event.tool);
            break;
          case 'tool_call_end':
            useAgentStatusStore.getState().setActiveTool(null);
            break;
          case 'text_delta':
            useAgentStatusStore.getState().setStatus('streaming');
            break;
          case 'error':
            useAgentStatusStore.getState().setError(event.content);
            break;
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

      const finalConvState = useConversationStore.getState();
      const convs = finalConvState.conversations;
      const convIdx = convs.findIndex((c) => c.id === newId);
      if (convIdx >= 0) {
        const currentConv = convs[convIdx];
        const updatedConv: Conversation = {
          ...currentConv,
          messages: currentConv.messages.map((m) => (m.id === assistantId ? updatedMessage : m)),
          updatedAt: new Date(),
        };
        conversationRepository.save(updatedConv);
        finalConvState.loadConversations();
      }

      set({
        isStreaming: false,
        streamingMessageId: null,
        streamingParts: [],
      });

      useAgentStatusStore.getState().setStatus('idle');
    } catch {
      set({ error: 'Failed to trigger greeting', isLoading: false, isStreaming: false });
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
