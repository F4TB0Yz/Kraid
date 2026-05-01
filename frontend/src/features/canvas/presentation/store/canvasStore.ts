import { create } from 'zustand';
import type { Document } from '../../domain/entities/Document';
import type { DocumentRepository } from '../../data/repositories/DocumentRepository';
import { mockDocumentRepository } from '../../data/repositories/DocumentRepository';

interface CanvasState {
  documents: Document[];
  activeDocumentId: string | null;
  isLoading: boolean;
  error: string | null;
  previousContent: string | null;
  loadDocuments: () => Promise<void>;
  addDocument: (title: string) => Promise<void>;
  removeDocument: (id: string) => void;
  setActiveDocument: (id: string) => void;
  updateContent: (content: string) => Promise<void>;
  savePreviousContent: () => void;
  clearError: () => void;
}

export const createCanvasStore = (repository: DocumentRepository = mockDocumentRepository) =>
  create<CanvasState>((set, get) => ({
    documents: [],
    activeDocumentId: null,
    isLoading: false,
    error: null,
    previousContent: null,

    loadDocuments: async () => {
      set({ isLoading: true, error: null });
      try {
        const docs = await repository.getAll();
        const activeId = docs[0]?.id ?? null;
        set({ documents: docs, activeDocumentId: activeId, isLoading: false });
      } catch {
        set({ error: 'Failed to load documents', isLoading: false });
      }
    },

    addDocument: async (title: string) => {
      try {
        const doc = await repository.addDocument(title);
        set((state) => ({
          documents: [...state.documents, doc],
          activeDocumentId: doc.id,
        }));
      } catch {
        set({ error: 'Failed to create document' });
      }
    },

    removeDocument: (id: string) => {
      const { documents, activeDocumentId } = get();
      const newDocs = documents.filter((d) => d.id !== id);
      const newActive = activeDocumentId === id
        ? (newDocs[0]?.id ?? null)
        : activeDocumentId;
      set({ documents: newDocs, activeDocumentId: newActive });
      void repository.removeDocument(id);
    },

    setActiveDocument: (id: string) => set({ activeDocumentId: id, previousContent: null }),

    updateContent: async (content: string) => {
      const { activeDocumentId } = get();
      if (!activeDocumentId) return;
      try {
        const updated = await repository.updateContent(activeDocumentId, content);
        set((state) => ({
          documents: state.documents.map((d) => (d.id === activeDocumentId ? updated : d)),
          isLoading: false,
        }));
      } catch {
        set({ error: 'Failed to update document' });
      }
    },

    savePreviousContent: () => {
      const { documents, activeDocumentId } = get();
      const doc = documents.find((d) => d.id === activeDocumentId);
      set({ previousContent: doc?.content ?? null });
    },

    clearError: () => set({ error: null }),
  }));

export const useCanvasStore = createCanvasStore();

// Backward-compat alias
export const getActiveDocument = () => {
  const state = useCanvasStore.getState();
  return state.documents.find((d) => d.id === state.activeDocumentId) ?? null;
};
