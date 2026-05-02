export type FileType = 'profile' | 'project' | 'task' | 'note' | 'reference' | 'feedback';

export interface KraidFile {
  slug: string;
  name: string;
  type: FileType;
  content: string;
  tags: string[];
  lastModified: Date;
  wordCount: number;
  links: string[];
  backlinks: string[];
}

export interface FileTreeNode {
  slug: string;
  name: string;
  type: FileType;
  children: FileTreeNode[];
}
