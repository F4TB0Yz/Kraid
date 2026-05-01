import type { Document } from '../../domain/entities/Document';

export interface DocumentRepository {
  getActive(): Promise<Document>;
  updateContent(content: string): Promise<Document>;
}

const DUMMY_DOCUMENT: Document = {
  id: 'doc-1',
  title: 'Welcome Document',
  content:
    '# Welcome to Kraid\n\nThis is a **markdown canvas** where you can view and edit documents.\n\n## Features\n\n- Split screen layout\n- Real-time markdown rendering\n- Clean architecture\n\nStart writing your content here...',
  createdAt: new Date('2024-01-01T10:00:00'),
  updatedAt: new Date('2024-01-01T10:00:00'),
};

export class MockDocumentRepository implements DocumentRepository {
  private document: Document = { ...DUMMY_DOCUMENT };

  async getActive(): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { ...this.document };
  }

  async updateContent(content: string): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    this.document = {
      ...this.document,
      content,
      updatedAt: new Date(),
    };
    return { ...this.document };
  }
}

export const mockDocumentRepository = new MockDocumentRepository();