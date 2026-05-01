import { create } from 'zustand';
import type { Document } from '../../domain/entities/Document';
import type { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { mockDocumentRepository } from '../../data/repositories/DocumentRepository';

interface CanvasState {
  document: Document | null;
  isLoading: boolean;
  error: string | null;
  loadDocument: () => Promise<void>;
  updateContent: (content: string) => Promise<void>;
  clearError: () => void;
}

export const createCanvasStore = (repository: DocumentRepository = mockDocumentRepository) =>
  create<CanvasState>((set) => ({
    document: null,
    isLoading: false,
    error: null,

    loadDocument: async () => {
      set({ isLoading: true, error: null });
      try {
        const document = await repository.getActive();
        set({ document, isLoading: false });
      } catch {
        set({ error: 'Failed to load document', isLoading: false });
      }
    },

    updateContent: async (content: string) => {
      set({ isLoading: true, error: null });
      try {
        const updated = await repository.updateContent(content);
        set({ document: updated, isLoading: false });
      } catch {
        set({ error: 'Failed to update document', isLoading: false });
      }
    },

    clearError: () => set({ error: null }),
  }));

export const useCanvasStore = createCanvasStore();
