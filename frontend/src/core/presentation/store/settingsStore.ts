import { create } from 'zustand';
import { httpStreamingRepository } from '../../../features/chat/data/repositories/HttpStreamingRepository';

interface ModelInfo {
  id: string;
  label: string;
}

interface SettingsState {
  availableModels: ModelInfo[];
  selectedModel: string | null;
  isLoadingModels: boolean;
  loadModels: () => Promise<void>;
  setSelectedModel: (id: string) => void;
}

const STORAGE_KEY = 'kraid:selected-model';

const loadPersistedModel = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const persistModel = (id: string | null) => {
  try {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const useSettingsStore = create<SettingsState>((set) => ({
  availableModels: [],
  selectedModel: loadPersistedModel(),
  isLoadingModels: false,

  loadModels: async () => {
    set({ isLoadingModels: true });
    try {
      const models = await httpStreamingRepository.listModels();
      set({
        availableModels: models,
        isLoadingModels: false,
      });
    } catch {
      set({ isLoadingModels: false });
    }
  },

  setSelectedModel: (id) => {
    persistModel(id);
    set({ selectedModel: id });
  },
}));
