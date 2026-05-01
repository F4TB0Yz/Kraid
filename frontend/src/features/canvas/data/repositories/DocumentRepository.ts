import type { Document } from '../../domain/entities/Document';
import { createDocument } from '../../domain/entities/Document';

const DUMMY_DOCUMENT = createDocument(
  'doc-1',
  'Welcome Document',
  `# Welcome to Kraid

This is a **markdown canvas** where you can view and edit documents.

## Features

- Split screen layout
- Real-time markdown rendering
- Clean architecture

## Getting Started

1. Type your message in the chat
2. See the markdown render on the right panel

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`
`
);

export const documentRepository = {
  async getActive(): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { ...DUMMY_DOCUMENT };
  },

  async updateContent(content: string): Promise<Document> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    DUMMY_DOCUMENT.content = content;
    DUMMY_DOCUMENT.updatedAt = new Date();
    return { ...DUMMY_DOCUMENT };
  },
};

export class MockDocumentRepository {
  getActive = documentRepository.getActive;
  updateContent = documentRepository.updateContent;
}
