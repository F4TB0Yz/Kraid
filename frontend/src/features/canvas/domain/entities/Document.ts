export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createDocument = (
  id: string,
  title: string,
  content: string,
  createdAt: Date = new Date(),
  updatedAt: Date = new Date()
): Document => ({ id, title, content, createdAt, updatedAt });
