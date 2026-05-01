import type { Message } from '../../domain/entities/Message';
import { createMessage } from '../../domain/entities/Message';

export interface MessageRepository {
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message | null>;
  add(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message>;
}

const DUMMY_MESSAGES: Message[] = [
  createMessage('1', 'user', 'Hello, how are you?', new Date('2024-01-01T10:00:00')),
  createMessage('2', 'assistant', 'I am doing great! How can I help you today?', new Date('2024-01-01T10:01:00')),
  createMessage('3', 'user', 'Can you explain what a monorepo is?', new Date('2024-01-01T10:02:00')),
  createMessage('4', 'assistant', 'A monorepo is a single repository that contains multiple projects or packages. It helps manage shared code and dependencies across different projects.', new Date('2024-01-01T10:03:00')),
];

export const messageRepository = {
  async getAll(): Promise<Message[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return [...DUMMY_MESSAGES];
  },

  async getById(id: string): Promise<Message | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return DUMMY_MESSAGES.find((m) => m.id === id) || null;
  },

  async add(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const newMessage = createMessage(
      String(Date.now()),
      message.role,
      message.content
    );
    DUMMY_MESSAGES.push(newMessage);
    return newMessage;
  },
};

export class MockMessageRepository implements MessageRepository {
  getAll = messageRepository.getAll;
  getById = messageRepository.getById;
  add = messageRepository.add;
}
