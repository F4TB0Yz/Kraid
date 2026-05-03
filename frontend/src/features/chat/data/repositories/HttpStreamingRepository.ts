import type { StreamingRepository, StreamEvent } from './StreamingRepository';
import { API_BASE } from '../../../../core/config';

export class HttpStreamingRepository implements StreamingRepository {
  private apiBase: string;

  constructor(apiBase: string = API_BASE) {
    this.apiBase = apiBase;
  }

  async *stream(
    messages: { role: string; content: string }[],
    model?: string,
    sessionId?: string,
    signal?: AbortSignal,
    mode?: 'chat' | 'agent' | 'edit',
  ): AsyncGenerator<StreamEvent> {
    const body: Record<string, unknown> = { messages };
    if (model) {
      body.model = model;
    }
    if (sessionId) {
      body.session_id = sessionId;
    }
    if (mode) {
      body.mode = mode;
    }

    const response = await fetch(`${this.apiBase}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 503) {
        yield { type: 'error', content: 'OPENAI_API_KEY not configured. Set it in backend/.env' };
      } else {
        yield { type: 'error', content: `HTTP ${response.status}: ${text}` };
      }
      yield { type: 'done' };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', content: 'Response body not readable' };
      yield { type: 'done' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr) as StreamEvent;
            yield parsed;
            if (parsed.type === 'done') return;
          } catch {
            // skip malformed JSON
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        const jsonStr = buffer.slice(6).trim();
        if (jsonStr) {
          try {
            const parsed = JSON.parse(jsonStr) as StreamEvent;
            yield parsed;
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      yield { type: 'error', content: String(err) };
    } finally {
      reader.releaseLock();
    }
  }

  async listModels(): Promise<{ id: string; label: string }[]> {
    const response = await fetch(`${this.apiBase}/api/chat/models`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { models: { id: string; label: string }[] };
    return data.models ?? [];
  }
}

export const httpStreamingRepository = new HttpStreamingRepository();
