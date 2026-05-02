export type MemoryFileType = 'profile' | 'projects' | 'feedback' | 'references';

export interface MemoryFile {
  id: string;
  filename: string;
  title: string;
  type: MemoryFileType;
  content: string;
  lastModified: Date;
  wordCount: number;
}

export const createMemoryFile = (
  id: string,
  filename: string,
  title: string,
  type: MemoryFileType,
  content: string,
  lastModified: Date = new Date(),
): MemoryFile => ({
  id,
  filename,
  title,
  type,
  content,
  lastModified,
  wordCount: content.trim().split(/\s+/).filter((w) => w.length > 0).length,
});
