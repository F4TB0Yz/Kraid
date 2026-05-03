import { create } from 'zustand';
import type { Message, MessagePart } from '../../domain/entities/Message';
import { useConversationStore } from '../../../conversations/presentation/store/conversationStore';
import { conversationRepository } from '../../../conversations/data/repositories/ConversationRepository';
import type { Conversation } from '../../../conversations/domain/entities/Conversation';
import { useAgentStatusStore } from '../../../../core/presentation/store/agentStatusStore';
import { useSettingsStore } from '../../../../core/presentation/store/settingsStore';
import { httpStreamingRepository } from '../../data/repositories/HttpStreamingRepository';
import { eventsToParts } from '../../data/repositories/StreamingRepository';
import type { StreamEvent } from '../../data/repositories/StreamingRepository';
import { API_BASE } from '../../../../core/config';

export interface PendingQuestion {
  toolCallId: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'free_text';
  options?: string[];
  placeholder?: string;
}

interface ChatState {
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingParts: MessagePart[];
  pendingQuestion: PendingQuestion | null;
  error: string | null;
  abortController: AbortController | null;
  sendMessage: (content: string, mode?: 'chat' | 'agent' | 'edit') => Promise<void>;
  triggerGreeting: () => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  answerQuestion: (answer: string) => Promise<void>;
  completeStreaming: () => void;
  stopGeneration: () => void;
  clearError: () => void;
}

async function streamResponse(
  apiMessages: { role: 'user' | 'assistant'; content: string }[],
  conversationId: string,
  assistantId: string,
  abortController: AbortController,
  set: (partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>)) => void,
  get: () => ChatState,
  mode: 'chat' | 'agent' | 'edit' = 'agent',
): Promise<void> {
  try {
    const selectedModel = useSettingsStore.getState().selectedModel ?? undefined;
    const events: StreamEvent[] = [];

    const stream = httpStreamingRepository.stream(apiMessages, selectedModel, conversationId, abortController.signal, mode);
    for await (const event of stream) {
      events.push(event);

      switch (event.type) {
        case 'thinking_start':
          useAgentStatusStore.getState().setStatus('thinking');
          break;
        case 'tool_call_start':
          useAgentStatusStore.getState().setStatus('running_tool');
          useAgentStatusStore.getState().setActiveTool(event.tool);
          if (event.tool === 'ask_user') {
            const input = event.input as { question?: string; type?: string; options?: string[]; placeholder?: string };
            set({
              pendingQuestion: {
                toolCallId: event.toolCallId,
                question: input.question ?? '',
                type: (input.type as PendingQuestion['type']) ?? 'free_text',
                options: input.options,
                placeholder: input.placeholder,
              },
            });
            useAgentStatusStore.getState().setStatus('waiting_user');
          }
          break;
        case 'tool_call_end':
          useAgentStatusStore.getState().setActiveTool(null);
          if (get().pendingQuestion?.toolCallId === event.toolCallId) {
            set({ pendingQuestion: null });
          }
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
      id: assistantId,
      role: 'assistant',
      content: fullText,
      timestamp: new Date(),
      parts: finalParts,
    };

    const convState = useConversationStore.getState();
    const convs = convState.conversations;
    const convIdx = convs.findIndex((c) => c.id === conversationId);
    if (convIdx >= 0) {
      const currentConv = convs[convIdx];
      const updatedConv: Conversation = {
        ...currentConv,
        messages: currentConv.messages.map((m) => (m.id === assistantId ? updatedMessage : m)),
        updatedAt: new Date(),
      };
      conversationRepository.save(updatedConv);
      convState.loadConversations();
    }

    set({
      isStreaming: false,
      streamingMessageId: null,
      streamingParts: [],
      abortController: null,
    });

    useAgentStatusStore.getState().setStatus('idle');
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.log('Stream aborted');
    } else {
      set({ error: 'Failed to stream response', isLoading: false, isStreaming: false, abortController: null });
      useAgentStatusStore.getState().setStatus('idle');
    }
  }
}

export const useChatStore = create<ChatState>((set, get) => ({
  isLoading: false,
  isStreaming: false,
  streamingMessageId: null,
  streamingParts: [],
  pendingQuestion: null,
  error: null,
  abortController: null,

  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({
        abortController: null,
        isStreaming: false,
        isLoading: false,
        pendingQuestion: null,
      });
      useAgentStatusStore.getState().setStatus('idle');
    }
  },

  sendMessage: async (content: string, mode?: 'chat' | 'agent' | 'edit') => {
    set({ isLoading: true, error: null });
    const abortController = new AbortController();
    set({ abortController });
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

      const convState = useConversationStore.getState();
      const conv = convState.conversations.find((c) => c.id === currentConvId);
      const allMessages = conv?.messages ?? [];
      const apiMessages = allMessages
        .filter((m) => m.id !== assistantId)
        .map((m) => ({
          role: m.role === 'user' ? 'user' as const : 'assistant' as const,
          content: m.content,
        }));

      await streamResponse(apiMessages, currentConvId, assistantId, abortController, set, get, mode);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        set({ error: 'Failed to send message', isLoading: false, isStreaming: false, abortController: null });
        useAgentStatusStore.getState().setStatus('idle');
      }
    }
  },

  triggerGreeting: async () => {
    if (get().isStreaming) return;

    set({ isLoading: true, error: null });
    const abortController = new AbortController();
    set({ abortController });
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

      await streamResponse([], newId, assistantId, abortController, set, get, 'agent');
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Greeting stream aborted by user');
      } else {
        set({ error: 'Failed to trigger greeting', isLoading: false, isStreaming: false, abortController: null });
        useAgentStatusStore.getState().setStatus('idle');
      }
    }
  },

  regenerateMessage: async (messageId: string) => {
    if (get().isStreaming) return;

    const convStore = useConversationStore.getState();
    const convId = convStore.activeConversationId;
    if (!convId) return;

    const conv = convStore.conversations.find((c) => c.id === convId);
    if (!conv) return;

    const msgIndex = conv.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const abortController = new AbortController();
    set({ abortController, isLoading: true, error: null });

    try {
      const truncatedMessages = conv.messages.slice(0, msgIndex);
      const updatedConv: Conversation = {
        ...conv,
        messages: truncatedMessages,
        updatedAt: new Date(),
      };
      conversationRepository.save(updatedConv);
      convStore.loadConversations();
      convStore.setActiveConversation(convId);

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

      const apiMessages = truncatedMessages.map((m) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

      await streamResponse(apiMessages, convId, assistantId, abortController, set, get, 'agent');
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Regenerate aborted');
      } else {
        set({ error: 'Failed to regenerate', isLoading: false, isStreaming: false, abortController: null });
        useAgentStatusStore.getState().setStatus('idle');
      }
    }
  },

  answerQuestion: async (answer: string) => {
    const convStore = useConversationStore.getState();
    const sessionId = convStore.activeConversationId;
    if (!sessionId) return;

    set({ pendingQuestion: null });

    try {
      await fetch(`${API_BASE}/api/chat/answer/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
    } catch {
      set({ error: 'Failed to submit answer' });
    }
  },

  completeStreaming: () =>
    set({
      isStreaming: false,
      streamingMessageId: null,
      streamingParts: [],
      pendingQuestion: null,
    }),

  clearError: () => set({ error: null }),
}));
