export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const createMessage = (
  id: string,
  role: Message['role'],
  content: string,
  timestamp: Date = new Date()
): Message => ({ id, role, content, timestamp });
