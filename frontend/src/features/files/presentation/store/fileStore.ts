import { create } from 'zustand';
import type { KraidFile, FileTreeNode, FileType } from '../../domain/entities/KraidFile';
import { HttpFileRepository } from '../../data/repositories/HttpFileRepository';

const repository = new HttpFileRepository();

interface FileState {
  files: Partial<KraidFile>[];
  tree: FileTreeNode[];
  selectedSlug: string | null;
  typeFilter: FileType | null;
  searchQuery: string;
  expandedNodes: Set<string>;
  isLoading: boolean;
  error: string | null;
  
  loadFiles: () => Promise<void>;
  loadTree: () => Promise<void>;
  selectFile: (slug: string | null) => void;
  setTypeFilter: (type: FileType | null) => void;
  setSearchQuery: (query: string) => void;
  toggleNode: (slug: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  createFile: (file: Pick<KraidFile, 'slug' | 'name' | 'type' | 'content'>) => Promise<KraidFile>;
  updateFile: (slug: string, updates: Partial<Pick<KraidFile, 'name' | 'type' | 'content'>>) => Promise<KraidFile>;
  deleteFile: (slug: string) => Promise<void>;
  readFile: (slug: string) => Promise<KraidFile>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  tree: [],
  selectedSlug: null,
  typeFilter: null,
  searchQuery: '',
  expandedNodes: new Set<string>(),
  isLoading: false,
  error: null,

  loadFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const files = await repository.list();
      set({ files, isLoading: false });
    } catch {
      set({ error: 'Failed to load files', isLoading: false });
    }
  },

  loadTree: async () => {
    set({ isLoading: true, error: null });
    try {
      const tree = await repository.getTree();
      set({ tree, isLoading: false });
    } catch {
      set({ error: 'Failed to load file tree', isLoading: false });
    }
  },

  selectFile: (slug: string | null) => set({ selectedSlug: slug }),

  setTypeFilter: (type: FileType | null) => set({ typeFilter: type }),

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    if (query) {
      get().expandAll(); // Auto expand on search
    }
  },

  toggleNode: (slug: string) => set((state) => {
    const next = new Set(state.expandedNodes);
    if (next.has(slug)) {
      next.delete(slug);
    } else {
      next.add(slug);
    }
    return { expandedNodes: next };
  }),

  expandAll: () => set((state) => {
    const allSlugs = new Set<string>();
    const walk = (nodes: FileTreeNode[]) => {
      nodes.forEach(n => {
        allSlugs.add(n.slug);
        if (n.children) walk(n.children);
      });
    };
    walk(state.tree);
    return { expandedNodes: allSlugs };
  }),

  collapseAll: () => set({ expandedNodes: new Set() }),

  createFile: async (file) => {
    try {
      const created = await repository.create(file);
      await get().loadTree();
      await get().loadFiles();
      return created;
    } catch {
      set({ error: 'Failed to create file' });
      throw new Error('Failed to create file');
    }
  },

  updateFile: async (slug, updates) => {
    try {
      const updated = await repository.update(slug, updates);
      await get().loadTree();
      await get().loadFiles();
      return updated;
    } catch {
      set({ error: 'Failed to update file' });
      throw new Error('Failed to update file');
    }
  },

  deleteFile: async (slug) => {
    try {
      await repository.delete(slug);
      await get().loadTree();
      await get().loadFiles();
      if (get().selectedSlug === slug) {
        set({ selectedSlug: null });
      }
    } catch {
      set({ error: 'Failed to delete file' });
      throw new Error('Failed to delete file');
    }
  },

  readFile: async (slug) => {
    try {
      return await repository.read(slug);
    } catch {
      set({ error: `Failed to read file ${slug}` });
      throw new Error(`Failed to read file ${slug}`);
    }
  },
}));
