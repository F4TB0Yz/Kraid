import { create } from 'zustand';
import type { MemoryFile } from '../../domain/entities/MemoryFile';
import type { MemoryRepository } from '../../data/repositories/MemoryRepository';
import { mockMemoryRepository } from '../../data/repositories/MemoryRepository';

interface MemoryState {
  files: MemoryFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  error: string | null;
  loadFiles: () => Promise<void>;
  selectFile: (id: string | null) => void;
}

export const createMemoryStore = (repository: MemoryRepository = mockMemoryRepository) =>
  create<MemoryState>((set) => ({
    files: [],
    selectedFileId: null,
    isLoading: false,
    error: null,

    loadFiles: async () => {
      set({ isLoading: true, error: null });
      try {
        const files = await repository.getAll();
        set({ files, isLoading: false });
      } catch {
        set({ error: 'Failed to load memory files', isLoading: false });
      }
    },

    selectFile: (id: string | null) => set({ selectedFileId: id }),
  }));

export const useMemoryStore = createMemoryStore();
