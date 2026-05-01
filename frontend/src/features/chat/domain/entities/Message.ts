export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export const createMessage = (
  id: string,
  role: MessageRole,
  content: string,
  timestamp: Date = new Date()
): Message => ({ id, role, content, timestamp });