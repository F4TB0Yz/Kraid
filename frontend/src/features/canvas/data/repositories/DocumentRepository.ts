import type { Document } from '../../domain/entities/Document';
import { createDocument } from '../../domain/entities/Document';

export interface DocumentRepository {
  getAll(): Promise<Document[]>;
  getActive(): Promise<Document>;
  updateContent(id: string, content: string): Promise<Document>;
  addDocument(title: string): Promise<Document>;
  removeDocument(id: string): Promise<void>;
}

const DOCUMENTS: Document[] = [
  createDocument('doc-1', 'Welcome Document', '# Welcome to Kraid\n\nThis is a **markdown canvas** where you can view and edit documents.\n\n## Features\n\n- Split screen layout\n- Real-time markdown rendering\n- Clean architecture\n\nStart writing your content here...', new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:00:00')),
  createDocument('doc-2', 'Architecture Notes', '# Architecture\n\n## Overview\n\nKraid uses Clean Architecture with Feature Slices.\n\n## Stack\n\n- React 19 + TypeScript\n- Zustand for state\n- Tailwind CSS v4\n\n## Pattern\n\n```\nfeature/\n  data/\n  domain/\n  presentation/\n```', new Date('2024-01-02T10:00:00'), new Date('2024-01-02T10:00:00')),
  createDocument('doc-3', 'API Design', '# API Endpoints\n\n## Chat\n\n- `POST /api/chat` — Send message\n- `GET /api/chat/:id` — Get conversation\n\n## Canvas\n\n- `GET /api/canvas` — Get active document\n- `PUT /api/canvas` — Update document\n\n## Memory\n\n- `GET /api/memory` — List files\n- `POST /api/memory` — Create file', new Date('2024-01-03T10:00:00'), new Date('2024-01-03T10:00:00')),
];

export class MockDocumentRepository implements DocumentRepository {
  private documents: Document[] = DOCUMENTS.map((d) => ({ ...d }));
  private activeId = 'doc-1';

  async getAll(): Promise<Document[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.documents.map((d) => ({ ...d }));
  }

  async getActive(): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const doc = this.documents.find((d) => d.id === this.activeId);
    return { ...(doc ?? this.documents[0]) };
  }

  async updateContent(id: string, content: string): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx < 0) throw new Error('Document not found');
    this.documents[idx] = { ...this.documents[idx], content, updatedAt: new Date() };
    return { ...this.documents[idx] };
  }

  async addDocument(title: string): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const doc = createDocument(`doc-${Date.now()}`, title, `# ${title}\n\nStart writing...`);
    this.documents.push(doc);
    this.activeId = doc.id;
    return { ...doc };
  }

  async removeDocument(id: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
    if (this.activeId === id) {
      this.activeId = this.documents[0]?.id ?? '';
    }
  }
}

export const mockDocumentRepository = new MockDocumentRepository();
