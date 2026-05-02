import type { KraidFile, FileTreeNode } from '../../domain/entities/KraidFile';

export interface FileRepository {
  list(): Promise<Partial<KraidFile>[]>;
  getTree(): Promise<FileTreeNode[]>;
  read(slug: string): Promise<KraidFile>;
  create(file: Pick<KraidFile, 'slug' | 'name' | 'type' | 'content'>): Promise<KraidFile>;
  update(slug: string, updates: Partial<Pick<KraidFile, 'name' | 'type' | 'content'>>): Promise<KraidFile>;
  delete(slug: string): Promise<void>;
}
