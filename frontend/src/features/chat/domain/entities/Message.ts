export type MessageRole = 'user' | 'assistant' | 'system';

export type ToolCallStatus = 'running' | 'success' | 'error';

export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; toolCallId: string; tool: string; input: Record<string, unknown>; status: ToolCallStatus; output?: string }
  | { type: 'thinking'; content: string; duration?: number }
  | { type: 'citation'; source: string; text: string; number: number };

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  parts?: MessagePart[];
}

export const createMessage = (
  id: string,
  role: MessageRole,
  content: string,
  timestamp: Date = new Date(),
  parts?: MessagePart[],
): Message => ({ id, role, content, timestamp, parts });

export const createMessagePart = {
  text: (content: string): MessagePart => ({ type: 'text', content }),
  toolCall: (
    toolCallId: string,
    tool: string,
    input: Record<string, unknown>,
    status: ToolCallStatus = 'running',
  ): MessagePart => ({ type: 'tool_call', toolCallId, tool, input, status }),
  thinking: (content: string, duration?: number): MessagePart => ({ type: 'thinking', content, duration }),
  citation: (source: string, text: string, number: number): MessagePart => ({ type: 'citation', source, text, number }),
};
