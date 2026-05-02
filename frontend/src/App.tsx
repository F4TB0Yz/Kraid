import { useEffect } from 'react';
import { SplitScreenLayout } from './core/presentation/layouts/SplitScreenLayout';
import { ChatPanel } from './features/chat/presentation/components/ChatPanel';
import { ThemeProvider } from './features/settings/presentation/components/ThemeProvider';
import { SettingsModal } from './features/settings/presentation/components/SettingsModal';
import { CommandPalette } from './core/presentation/components/CommandPalette';
import { ToastProvider } from './core/presentation/components/Toast/ToastProvider';
import { useSettingsStore } from './core/presentation/store/settingsStore';
import { useMemoryWatcher } from './features/memory/presentation/hooks/useMemoryWatcher';

function App() {
  const loadModels = useSettingsStore((s) => s.loadModels);
  useMemoryWatcher();

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  return (
    <ThemeProvider>
      <SplitScreenLayout
        leftPanel={<ChatPanel />}
      />
      <SettingsModal />
      <CommandPalette />
      <ToastProvider />
    </ThemeProvider>
  );
}

export default App;
