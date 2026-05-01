export class MemoryDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryDomainError';
  }
}

export class MemoryFileNotFoundError extends MemoryDomainError {
  constructor(fileId: string) {
    super(`Memory file with id "${fileId}" not found`);
    this.name = 'MemoryFileNotFoundError';
  }
}

export class MemoryLoadFailure extends MemoryDomainError {
  constructor(cause?: string) {
    super(`Failed to load memory files${cause ? `: ${cause}` : ''}`);
    this.name = 'MemoryLoadFailure';
  }
}
