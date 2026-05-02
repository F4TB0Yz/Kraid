import type { MemoryFile, MemoryFileType } from '../../domain/entities/MemoryFile';
import type { MemoryRepository } from './MemoryRepository';

const API_URL = 'http://localhost:8000/api/memory';

export class HttpMemoryRepository implements MemoryRepository {
  async getAll(): Promise<MemoryFile[]> {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to fetch memory files');
    const data = await res.json();
    return data.map((d: { lastModified: string | Date; title: string; filename: string; type: string }) => ({
      ...d,
      lastModified: new Date(d.lastModified)
    }));
  }

  async add(data: { title: string; filename: string; type: MemoryFileType; content: string }): Promise<MemoryFile> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create memory file');
    const d = await res.json();
    return { ...d, lastModified: new Date(d.lastModified) };
  }

  async update(id: string, data: { title?: string; filename?: string; type?: MemoryFileType; content?: string }): Promise<MemoryFile> {
    // id is expected to be type-filename
    const parts = id.split('-');
    const type = parts[0];
    const filename = parts.slice(1).join('-');
    const res = await fetch(`${API_URL}/${type}/${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update memory file');
    const d = await res.json();
    return { ...d, lastModified: new Date(d.lastModified) };
  }
}

export const httpMemoryRepository = new HttpMemoryRepository();
