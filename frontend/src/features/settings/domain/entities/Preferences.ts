export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'terracotta' | 'sage' | 'ocean' | 'plum' | 'gold';
export type FontSize = 'compact' | 'default' | 'comfortable';

export interface Preferences {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  agentName: string;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  accentColor: 'terracotta',
  fontSize: 'default',
  agentName: 'Kraid',
};
