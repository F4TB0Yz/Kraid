import type { MessagePart } from '../../domain/entities/Message';

export type StreamEvent =
  | { type: 'thinking_start' }
  | { type: 'thinking_delta'; content: string }
  | { type: 'thinking_end'; duration: number }
  | { type: 'tool_call_start'; toolCallId: string; tool: string; input: Record<string, unknown> }
  | { type: 'tool_call_end'; toolCallId: string; output: string; status: 'success' | 'error' }
  | { type: 'text_delta'; content: string }
  | { type: 'done' };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const THINKING_DELAYS = [800, 1200, 1600];
const TEXT_CHUNK_DELAY = 30;
const TOOL_DELAYS = [400, 800];

const readFileInput: Record<string, unknown> = { path: 'src/components/App.tsx' };
const editFileInput: Record<string, unknown> = { path: 'src/components/App.tsx', replacement: '...' };
const searchInput: Record<string, unknown> = { query: 'function handleSubmit' };
const runCommandInput: Record<string, unknown> = { command: 'npm run lint' };
const openCanvasInput: Record<string, unknown> = { title: 'New Document' };

const TOOLS = [
  { tool: 'read_file', input: readFileInput, output: '```tsx\nfunction App() {\n  return <div>Hello</div>;\n}\n```' },
  { tool: 'edit_file', input: editFileInput, output: 'Applied edit to 3 lines' },
  { tool: 'search', input: searchInput, output: 'Found 2 matches in src/' },
  { tool: 'run_command', input: runCommandInput, output: '✓ Lint passed (0 errors, 0 warnings)' },
  { tool: 'open_canvas', input: openCanvasInput, output: 'Canvas opened with title "New Document"' },
];

const RESPONSE_TEXTS = [
  "Based on my analysis, here's what I found.\n\nThe key insight is that we need to refactor the component to use proper state management.",
  "I've made the changes you requested. The main modification was in the data flow — now the repository pattern handles all the heavy lifting.",
  "Looking at the code, I can see the issue. The problem is in the useEffect dependency array. Let me fix it.",
];

async function* generateStream(): AsyncGenerator<StreamEvent> {
  const scenario = Math.floor(Math.random() * 4);

  if (scenario === 0 || scenario === 2) {
    await delay(THINKING_DELAYS[Math.floor(Math.random() * THINKING_DELAYS.length)]);
    yield { type: 'thinking_start' };
    const thoughts = [
      'Let me analyze the request carefully.',
      'The user is asking about code changes. I need to understand the current implementation.',
      'Breaking down the problem into smaller steps...',
    ];
    for (const thought of thoughts) {
      await delay(200);
      yield { type: 'thinking_delta', content: thought + '\n' };
    }
    await delay(300);
    yield { type: 'thinking_end', duration: 1.5 + Math.random() * 2 };
  }

  if (scenario >= 2) {
    const toolCount = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < toolCount; i++) {
      const toolConfig = TOOLS[Math.floor(Math.random() * TOOLS.length)];
      const toolCallId = `tc-${Date.now()}-${i}`;

      await delay(TOOL_DELAYS[Math.floor(Math.random() * TOOL_DELAYS.length)]);
      yield { type: 'tool_call_start', toolCallId, tool: toolConfig.tool, input: toolConfig.input };

      const toolDelay = TOOL_DELAYS[Math.floor(Math.random() * TOOL_DELAYS.length)] + 400;
      await delay(toolDelay);

      yield {
        type: 'tool_call_end',
        toolCallId,
        output: toolConfig.output,
        status: Math.random() > 0.1 ? 'success' : 'error',
      };
    }
  }

  await delay(300);

  const text = RESPONSE_TEXTS[Math.floor(Math.random() * RESPONSE_TEXTS.length)];
  for (let i = 0; i < text.length; i += Math.floor(Math.random() * 8) + 3) {
    await delay(TEXT_CHUNK_DELAY);
    yield { type: 'text_delta', content: text.slice(i, i + Math.floor(Math.random() * 8) + 3) };
  }

  yield { type: 'done' };
}

const textDeltasToParts = (events: StreamEvent[]): StreamEvent[] => {
  const result: StreamEvent[] = [];
  let textBuffer = '';
  for (const event of events) {
    if (event.type === 'text_delta') {
      textBuffer += event.content;
    } else {
      if (textBuffer) {
        result.push({ type: 'text_delta', content: textBuffer });
        textBuffer = '';
      }
      result.push(event);
    }
  }
  if (textBuffer) {
    result.push({ type: 'text_delta', content: textBuffer });
  }
  return result;
};

export const eventsToParts = (events: StreamEvent[]): MessagePart[] => {
  const parts: MessagePart[] = [];
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer) {
      parts.push({ type: 'text', content: textBuffer });
      textBuffer = '';
    }
  };

  for (const event of textDeltasToParts(events)) {
    switch (event.type) {
      case 'text_delta':
        textBuffer += event.content;
        break;
      case 'thinking_start':
      case 'thinking_delta':
      case 'thinking_end':
        flushText();
        if (event.type === 'thinking_end') {
          parts.push({ type: 'thinking', content: '', duration: event.duration });
        }
        break;
      case 'tool_call_start':
        flushText();
        parts.push({
          type: 'tool_call',
          toolCallId: event.toolCallId,
          tool: event.tool,
          input: event.input,
          status: 'running',
        });
        break;
      case 'tool_call_end': {
        flushText();
        const existingIdx = parts.findIndex(
          (p) => p.type === 'tool_call' && p.toolCallId === event.toolCallId,
        );
        if (existingIdx >= 0) {
          const existing = parts[existingIdx] as Extract<MessagePart, { type: 'tool_call' }>;
          parts[existingIdx] = {
            ...existing,
            status: event.status,
            output: event.output,
          };
        }
        break;
      }
    }
  }
  flushText();
  return parts;
};

export interface StreamingRepository {
  stream(prompt: string): AsyncGenerator<StreamEvent>;
}

export class MockStreamingRepository implements StreamingRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stream(_prompt: string): AsyncGenerator<StreamEvent> {
    return generateStream();
  }
}

export const mockStreamingRepository = new MockStreamingRepository();
