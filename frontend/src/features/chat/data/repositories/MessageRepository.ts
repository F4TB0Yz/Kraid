import type { Message, MessageRole } from '../../domain/entities/Message';

export interface MessageRepository {
  getAll(): Promise<Message[]>;
  add(role: MessageRole, content: string): Promise<Message>;
}

export class MockMessageRepository implements MessageRepository {
  private messages: Message[] = [];

  async getAll(): Promise<Message[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...this.messages];
  }

  async add(role: MessageRole, content: string): Promise<Message> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newMessage: Message = {
      id: String(this.messages.length + 1),
      role,
      content,
      timestamp: new Date(),
    };
    this.messages.push(newMessage);
    return newMessage;
  }
}

export const mockMessageRepository = new MockMessageRepository();