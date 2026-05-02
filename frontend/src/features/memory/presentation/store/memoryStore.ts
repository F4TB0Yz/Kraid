import { create } from 'zustand';
import type { MemoryFile, MemoryFileType } from '../../domain/entities/MemoryFile';
import type { MemoryRepository } from '../../data/repositories/MemoryRepository';
import { httpMemoryRepository } from '../../data/repositories/HttpMemoryRepository';

interface MemoryState {
  files: MemoryFile[];
  selectedFileId: string | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  loadFiles: () => Promise<void>;
  selectFile: (id: string | null) => void;
  addFile: (type: MemoryFileType, title: string) => Promise<void>;
  updateFile: (id: string, data: { title?: string; type?: MemoryFileType; content?: string }) => Promise<void>;
  setEditing: (editing: boolean) => void;
}

export const createMemoryStore = (repository: MemoryRepository = httpMemoryRepository) =>
  create<MemoryState>((set) => ({
    files: [],
    selectedFileId: null,
    isLoading: false,
    error: null,
    isEditing: false,

    loadFiles: async () => {
      set({ isLoading: true, error: null });
      try {
        const files = await repository.getAll();
        set({ files, isLoading: false });
      } catch {
        set({ error: 'Failed to load memory files', isLoading: false });
      }
    },

    selectFile: (id: string | null) => set({ selectedFileId: id, isEditing: false }),

    addFile: async (type: MemoryFileType, title: string) => {
      try {
        const filename = title.toLowerCase().replace(/\s+/g, '_') + '.md';
        const file = await repository.add({ title, filename, type, content: `# ${title}\n\n` });
        set((state) => ({
          files: [...state.files, file],
          selectedFileId: file.id,
          isEditing: true,
        }));
      } catch {
        set({ error: 'Failed to create memory file' });
      }
    },

    updateFile: async (id: string, data: { title?: string; type?: MemoryFileType; content?: string }) => {
      try {
        const updated = await repository.update(id, data);
        set((state) => ({
          files: state.files.map((f) => (f.id === id ? updated : f)),
        }));
      } catch {
        set({ error: 'Failed to update memory file' });
      }
    },

    setEditing: (editing: boolean) => set({ isEditing: editing }),
  }));

export const useMemoryStore = createMemoryStore();
