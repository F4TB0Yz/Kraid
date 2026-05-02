import type { FileRepository } from './FileRepository';
import type { KraidFile, FileTreeNode } from '../../domain/entities/KraidFile';
import { API_BASE } from '../../../../core/config';

export class HttpFileRepository implements FileRepository {
  async list(): Promise<Partial<KraidFile>[]> {
    const res = await fetch(`${API_BASE}/api/files`);
    if (!res.ok) throw new Error('Failed to list files');
    const data = await res.json();
    return data.map((f: any) => ({
      ...f,
      lastModified: new Date(f.lastModified),
    }));
  }

  async getTree(): Promise<FileTreeNode[]> {
    const res = await fetch(`${API_BASE}/api/files/tree`);
    if (!res.ok) throw new Error('Failed to fetch tree');
    return res.json();
  }

  async read(slug: string): Promise<KraidFile> {
    const res = await fetch(`${API_BASE}/api/files/${slug}`);
    if (!res.ok) throw new Error(`Failed to read file ${slug}`);
    const data = await res.json();
    return {
      ...data,
      lastModified: new Date(data.lastModified),
    };
  }

  async create(file: Pick<KraidFile, 'slug' | 'name' | 'type' | 'content'>): Promise<KraidFile> {
    const res = await fetch(`${API_BASE}/api/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(file),
    });
    if (!res.ok) throw new Error('Failed to create file');
    const data = await res.json();
    return {
      ...data,
      lastModified: new Date(data.lastModified),
    };
  }

  async update(slug: string, updates: Partial<Pick<KraidFile, 'name' | 'type' | 'content'>>): Promise<KraidFile> {
    const res = await fetch(`${API_BASE}/api/files/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update file');
    const data = await res.json();
    return {
      ...data,
      lastModified: new Date(data.lastModified),
    };
  }

  async delete(slug: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/files/${slug}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete file');
  }
}
