import { create } from 'zustand';

export type WorkspaceTabId =
  | { kind: 'canvas'; documentId: string }
  | { kind: 'memory'; fileId: string }
  | { kind: 'memory-explorer' };

export const tabKey = (id: WorkspaceTabId): string => {
  if (id.kind === 'canvas') return `canvas:${id.documentId}`;
  if (id.kind === 'memory') return `memory:${id.fileId}`;
  return 'memory-explorer';
};

interface WorkspacePanelState {
  isOpen: boolean;
  openTabIds: WorkspaceTabId[];
  activeTabId: WorkspaceTabId | null;

  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  focusTab: (tabId: WorkspaceTabId) => void;
  closeTab: (tabId: WorkspaceTabId) => void;
}

const EXPLORER_TAB: WorkspaceTabId = { kind: 'memory-explorer' };

export const useWorkspacePanelStore = create<WorkspacePanelState>((set) => ({
  isOpen: false,
  openTabIds: [EXPLORER_TAB],
  activeTabId: EXPLORER_TAB,

  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  focusTab: (tabId: WorkspaceTabId) => {
    set((state) => {
      const key = tabKey(tabId);
      const exists = state.openTabIds.some((t) => tabKey(t) === key);
      const newTabs = exists
        ? state.openTabIds
        : [...state.openTabIds, tabId];
      return {
        isOpen: true,
        openTabIds: newTabs,
        activeTabId: tabId,
      };
    });
  },

  closeTab: (tabId: WorkspaceTabId) => {
    set((state) => {
      const key = tabKey(tabId);
      const remainingTabs = state.openTabIds.filter((t) => tabKey(t) !== key);

      let newActive = state.activeTabId;
      if (state.activeTabId && tabKey(state.activeTabId) === key) {
        const currentIndex = state.openTabIds.findIndex((t) => tabKey(t) === key);
        if (remainingTabs.length > 0) {
          newActive = remainingTabs[Math.min(currentIndex, remainingTabs.length - 1)];
        } else {
          newActive = null;
        }
      }

      return {
        openTabIds: remainingTabs,
        activeTabId: newActive,
        isOpen: remainingTabs.length > 0 ? state.isOpen : false,
      };
    });
  },
}));
