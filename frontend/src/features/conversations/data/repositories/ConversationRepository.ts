import type { Conversation } from '../../domain/entities/Conversation';
import type { Message } from '../../../chat/domain/entities/Message';

const STORAGE_KEY = 'kraid_conversations';

export interface ConversationRepository {
  getAll(): Conversation[];
  save(conversation: Conversation): void;
  delete(id: string): void;
}

export class LocalStorageConversationRepository implements ConversationRepository {
  getAll(): Conversation[] {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        const parsed = JSON.parse(item) as {
          id: string;
          title: string;
          createdAt: string;
          updatedAt: string;
          messages: {
            id: string;
            role: 'user' | 'assistant';
            content: string;
            timestamp: string;
          }[];
        }[];
        return parsed.map((c) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          messages: c.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }) as Message),
        }));
      }
    } catch (e) {
      console.warn('Failed to parse conversations from local storage', e);
    }
    return [];
  }

  save(conversation: Conversation): void {
    const all = this.getAll();
    const index = all.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      all[index] = conversation;
    } else {
      all.push(conversation);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  delete(id: string): void {
    const all = this.getAll();
    const filtered = all.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export const conversationRepository = new LocalStorageConversationRepository();
