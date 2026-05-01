import { SplitScreenLayout } from './core/presentation/layouts/SplitScreenLayout';
import { ChatPanel } from './features/chat/presentation/components/ChatPanel';
import { MarkdownCanvas } from './features/canvas/presentation/components/MarkdownCanvas';
import { ThemeProvider } from './features/settings/presentation/components/ThemeProvider';
import { SettingsModal } from './features/settings/presentation/components/SettingsModal';
import { CommandPalette } from './core/presentation/components/CommandPalette';
import { ToastProvider } from './core/presentation/components/Toast/ToastProvider';

function App() {
  return (
    <ThemeProvider>
      <SplitScreenLayout
        leftPanel={<ChatPanel />}
        rightPanel={<MarkdownCanvas />}
      />
      <SettingsModal />
      <CommandPalette />
      <ToastProvider />
    </ThemeProvider>
  );
}

export default App;
