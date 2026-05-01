import { useChatStore } from '../store/chatStore';
import type { MessagePart } from '../../domain/entities/Message';

interface UseMessageStreamResult {
  parts: MessagePart[];
  isStreaming: boolean;
  cursor: number;
}

export function useMessageStream(messageId: string): UseMessageStreamResult {
  const streamingParts = useChatStore((s) => s.streamingParts);
  const streamingMessageId = useChatStore((s) => s.streamingMessageId);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const isThisStreaming = isStreaming && streamingMessageId === messageId;

  return {
    parts: isThisStreaming ? streamingParts : [],
    isStreaming: isThisStreaming,
    cursor: streamingParts.length,
  };
}
