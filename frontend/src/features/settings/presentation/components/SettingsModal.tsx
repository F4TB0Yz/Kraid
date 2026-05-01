import { useSettingsStore } from '../store/settingsStore';
import type { Theme, AccentColor, FontSize } from '../../domain/entities/Preferences';
import { CogIcon, CloseIcon } from '../../../../core/presentation/components/icons';

export const SettingsModal = () => {
  const { preferences, isOpen, closeSettings, updateTheme, updateAccentColor, updateFontSize, updateAgentName } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm animate-message-slide-up" style={{ animationDuration: '0.2s' }}>
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CogIcon className="h-5 w-5 text-charcoal-warm" />
            <h2 className="font-serif text-xl font-medium text-text">Settings</h2>
          </div>
          <button onClick={closeSettings} className="rounded-full p-1 text-warm-silver transition-colors hover:bg-warm-sand hover:text-text">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Agent Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal-warm">Agent Name</label>
            <input
              type="text"
              value={preferences.agentName}
              onChange={(e) => updateAgentName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="e.g. Kraid"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal-warm">Theme</label>
            <div className="flex gap-2">
              {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => updateTheme(t)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    preferences.theme === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg text-charcoal-warm hover:bg-warm-sand'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal-warm">Accent Color</label>
            <div className="flex gap-3">
              {(['terracotta', 'sage', 'ocean', 'plum', 'gold'] as AccentColor[]).map((color) => (
                <button
                  key={color}
                  onClick={() => updateAccentColor(color)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    preferences.accentColor === color ? 'scale-110 border-text' : 'border-transparent hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: `var(--color-${color}-preview)`
                  }}
                  aria-label={`Set accent color to ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal-warm">Font Size</label>
            <div className="flex gap-2">
              {(['compact', 'default', 'comfortable'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => updateFontSize(size)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors ${
                    preferences.fontSize === size
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg text-charcoal-warm hover:bg-warm-sand'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={closeSettings}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
