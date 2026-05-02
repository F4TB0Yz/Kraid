export class FileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileError';
  }
}

export class FileNotFound extends FileError {
  constructor(slug: string) {
    super(`File with slug ${slug} not found`);
    this.name = 'FileNotFound';
  }
}
