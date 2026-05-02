import { create } from 'zustand';

interface SidebarState {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

const STORAGE_KEY = 'kraid:sidebar-state';

const loadPersistedState = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  } catch {
    return false;
  }
};

const persistState = (open: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    // ignore storage errors
  }
};

export const useSidebarStore = create<SidebarState>((set) => ({
  sidebarOpen: loadPersistedState(),

  openSidebar: () => {
    persistState(true);
    set({ sidebarOpen: true });
  },

  closeSidebar: () => {
    persistState(false);
    set({ sidebarOpen: false });
  },

  toggleSidebar: () => {
    set((state) => {
      const next = !state.sidebarOpen;
      persistState(next);
      return { sidebarOpen: next };
    });
  },
}));