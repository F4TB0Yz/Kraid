import { DEFAULT_PREFERENCES } from '../../domain/entities/Preferences';
import type { Preferences } from '../../domain/entities/Preferences';

const STORAGE_KEY = 'kraid_preferences';

export interface PreferencesRepository {
  get(): Preferences;
  save(preferences: Preferences): void;
}

export class LocalStoragePreferencesRepository implements PreferencesRepository {
  get(): Preferences {
    try {
      const item = localStorage.getItem(STORAGE_KEY);
      if (item) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(item) };
      }
    } catch (e) {
      console.warn('Failed to parse preferences from local storage', e);
    }
    return DEFAULT_PREFERENCES;
  }

  save(preferences: Preferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save preferences to local storage', e);
    }
  }
}

export const preferencesRepository = new LocalStoragePreferencesRepository();
