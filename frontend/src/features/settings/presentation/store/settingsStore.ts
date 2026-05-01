import { create } from 'zustand';
import type { Preferences, Theme, AccentColor, FontSize } from '../../domain/entities/Preferences';
import { preferencesRepository } from '../../data/repositories/PreferencesRepository';

interface SettingsState {
  preferences: Preferences;
  isOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  updateTheme: (theme: Theme) => void;
  updateAccentColor: (color: AccentColor) => void;
  updateFontSize: (size: FontSize) => void;
  updateAgentName: (name: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  preferences: preferencesRepository.get(),
  isOpen: false,
  openSettings: () => set({ isOpen: true }),
  closeSettings: () => set({ isOpen: false }),
  
  updateTheme: (theme) => {
    const newPrefs = { ...get().preferences, theme };
    preferencesRepository.save(newPrefs);
    set({ preferences: newPrefs });
  },
  
  updateAccentColor: (accentColor) => {
    const newPrefs = { ...get().preferences, accentColor };
    preferencesRepository.save(newPrefs);
    set({ preferences: newPrefs });
  },
  
  updateFontSize: (fontSize) => {
    const newPrefs = { ...get().preferences, fontSize };
    preferencesRepository.save(newPrefs);
    set({ preferences: newPrefs });
  },
  
  updateAgentName: (agentName) => {
    const newPrefs = { ...get().preferences, agentName };
    preferencesRepository.save(newPrefs);
    set({ preferences: newPrefs });
  },
}));
