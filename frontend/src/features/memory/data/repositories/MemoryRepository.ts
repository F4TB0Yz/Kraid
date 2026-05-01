import type { MemoryFile } from '../../domain/entities/MemoryFile';
import { createMemoryFile } from '../../domain/entities/MemoryFile';

export interface MemoryRepository {
  getAll(): Promise<MemoryFile[]>;
}

const FILES: MemoryFile[] = [
  createMemoryFile(
    'mem-1',
    'user_profile.md',
    'User Profile',
    'user',
    '# User Profile\n\n## Background\n\nFull-stack developer with 8+ years of experience building web applications. Strong preference for TypeScript, React, and Python. Passionate about clean architecture, developer experience, and well-designed APIs.\n\n## Technical Stack\n\n- **Frontend**: React 19, TypeScript, Tailwind CSS\n- **Backend**: Python, FastAPI\n- **Tools**: Git, VSCode, Neovim\n- **Interests**: System design, DX tooling, open source\n\n## Preferences\n\n- Prefers concise, direct communication\n- Values well-structured code over clever one-liners\n- Enjoys exploring new frameworks and paradigms\n- Works best with clear specifications and iterative feedback',
    new Date('2024-03-15T10:00:00'),
  ),
  createMemoryFile(
    'mem-2',
    'project_kraid.md',
    'Project Kraid',
    'project',
    '# Project Kraid\n\n## Overview\n\nKraid is a full-stack monorepo workspace designed as an AI-assisted development environment. It combines a React frontend with a FastAPI backend to provide a rich interface for code generation, document editing, and conversation management.\n\n## Architecture\n\n- **Monorepo** with `frontend/` and `backend/` directories\n- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS v4\n- **Backend**: FastAPI (Python 3.9+) + Uvicorn\n- **State**: Zustand stores with repository injection\n- **Pattern**: Clean Architecture with Feature Slices\n\n## Roadmap\n\n1. Memory file viewer (current)\n2. Real API integration\n3. Authentication & user sessions\n4. Collaborative editing',
    new Date('2024-03-20T14:00:00'),
  ),
  createMemoryFile(
    'mem-3',
    'feedback_coding_style.md',
    'Feedback: Coding Style',
    'feedback',
    '# Coding Style Feedback\n\n## Strengths\n\n- Clean separation of concerns following feature-slice pattern\n- Consistent error handling with domain-specific error classes\n- Good use of factory functions over classes\n- Proper typing with strict TypeScript configuration\n\n## Areas for Improvement\n\n### 1. File Length\nSome components (MarkdownCanvas) are approaching 200 lines. Consider extracting the footer and header into sub-components.\n\n### 2. Comments\nCodebase is mostly comment-free which is good, but complex logic blocks could benefit from brief inline explanations.\n\n### 3. Testing\nTest coverage is minimal. Core stores and repositories should have unit tests.\n\n### 4. CSS Organization\nTailwind classes are verbose in some components. Consider extracting repeated patterns into reusable components.',
    new Date('2024-04-01T09:00:00'),
  ),
  createMemoryFile(
    'mem-4',
    'feedback_communication.md',
    'Feedback: Communication',
    'feedback',
    '# Communication Feedback\n\n## Session Patterns\n\n- User prefers direct, no-filler responses\n- Technical explanations should be concise: state the problem, show the fix, move on\n- When exploring code, highlight file paths and line numbers\n\n## Response Style\n\n- Use bullet points for multiple items\n- Code blocks should be focused, not whole files\n- When suggesting architecture changes, explain trade-offs briefly\n\n## Preferences\n\n- Cave-man mode acceptable for routine tasks\n- Full explanations needed for security-related decisions\n- User appreciates parallel execution of independent tasks',
    new Date('2024-04-05T16:00:00'),
  ),
  createMemoryFile(
    'mem-5',
    'reference_architecture.md',
    'Reference Architecture',
    'reference',
    '# Kraid Architecture Reference\n\n## Clean Architecture — Feature Slices\n\n```\nfeatures/\n  $feature/\n    data/\n      repositories/\n        NombreRepository.ts\n    domain/\n      entities/\n        Nombre.ts\n      errors/\n        NombreErrors.ts\n    presentation/\n      components/\n        NombreComponente.tsx\n      store/\n        nombreStore.ts\n```\n\n## Dependency Flow\n\n```\npresentation/ -> domain/ <- data/\n```\n\nPresentation depends on domain. Domain depends on nothing. Data implements domain interfaces.\n\n## State Management\n\n- Zustand for per-feature state\n- Factory pattern: `createNombreStore(config)` with repo injection\n- Synchronous state + async actions (`load*`, `add*`, `update*`)\n\n## Conventions\n\n| Type | Convention | Example |\n|------|------------|--------|\n| Components | PascalCase + .tsx | `ChatPanel.tsx` |\n| Stores | camelCase + `Store` suffix | `chatStore.ts` |\n| Entities | PascalCase | `Message.ts` |\n| Errors | PascalCase + `Error` suffix | `DocumentNotFoundError.ts` |\n| Repositories | PascalCase + `Repository` suffix | `MessageRepository.ts` |\n| Factory fn | `create` + Entity name | `createMessage()` |',
    new Date('2024-04-10T12:00:00'),
  ),
];

export class MockMemoryRepository implements MemoryRepository {
  private files: MemoryFile[] = FILES;

  async getAll(): Promise<MemoryFile[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return [...this.files];
  }
}

export const mockMemoryRepository = new MockMemoryRepository();
