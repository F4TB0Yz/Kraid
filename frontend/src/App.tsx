import { SplitScreenLayout } from './core/presentation/layouts/SplitScreenLayout';
import { ChatPanel } from './features/chat/presentation/components/ChatPanel';
import { MarkdownCanvas } from './features/canvas/presentation/components/MarkdownCanvas';

function App() {
  return (
    <SplitScreenLayout
      leftPanel={<ChatPanel />}
      rightPanel={<MarkdownCanvas />}
    />
  );
}

export default App;
