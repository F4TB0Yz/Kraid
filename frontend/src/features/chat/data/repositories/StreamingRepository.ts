import type { MessagePart } from '../../domain/entities/Message';

export type StreamEvent =
  | { type: 'thinking_start' }
  | { type: 'thinking_delta'; content: string }
  | { type: 'thinking_end'; duration: number }
  | { type: 'tool_call_start'; toolCallId: string; tool: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolCallId: string; output: string; status: 'success' | 'error' }
  | { type: 'text_delta'; content: string }
  | { type: 'error'; content: string }
  | { type: 'done' };

export interface StreamingRepository {
  stream(messages: { role: string; content: string }[], model?: string, sessionId?: string, signal?: AbortSignal, mode?: 'chat' | 'agent' | 'edit'): AsyncGenerator<StreamEvent>;
}

const textDeltasToParts = (events: StreamEvent[]): StreamEvent[] => {
  const result: StreamEvent[] = [];
  let textBuffer = '';
  for (const event of events) {
    if (event.type === 'text_delta') {
      textBuffer += event.content;
    } else {
      if (textBuffer) {
        result.push({ type: 'text_delta', content: textBuffer });
        textBuffer = '';
      }
      result.push(event);
    }
  }
  if (textBuffer) {
    result.push({ type: 'text_delta', content: textBuffer });
  }
  return result;
};

export const eventsToParts = (events: StreamEvent[]): MessagePart[] => {
  const parts: MessagePart[] = [];
  let textBuffer = '';
  let thinkingBuffer = '';
  let thinkingDuration = 0;

  const flushText = () => {
    if (textBuffer) {
      parts.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  };

  for (const event of textDeltasToParts(events)) {
    switch (event.type) {
      case 'text_delta':
        textBuffer += event.content;
        break;
      case 'thinking_start':
        thinkingBuffer = '';
        thinkingDuration = 0;
        flushText();
        break;
      case 'thinking_delta':
        thinkingBuffer += event.content;
        flushText();
        break;
      case 'thinking_end':
        thinkingDuration = event.duration;
        flushText();
        break;
      case 'tool_call_start':
        flushText();
        parts.push({
          type: 'tool_call',
          toolCallId: event.toolCallId,
          tool: event.tool,
          input: event.input,
          status: 'running',
        });
        break;
      case 'tool_call_end': {
        flushText();
        const existingIdx = parts.findIndex(
          (p) => p.type === 'tool_call' && p.toolCallId === event.toolCallId,
        );
        if (existingIdx >= 0) {
          const existing = parts[existingIdx] as Extract<MessagePart, { type: 'tool_call' }>;
          parts[existingIdx] = {
            ...existing,
            status: event.status,
            output: event.output,
          };
        }
        break;
      }
    }
  }

  flushText();

  if (thinkingBuffer) {
    parts.push({
      type: 'thinking',
      content: thinkingBuffer,
      duration: thinkingDuration || undefined,
    });
  }

  return parts;
};
