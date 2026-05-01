export class CanvasDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanvasDomainError';
  }
}

export class DocumentNotFoundError extends CanvasDomainError {
  constructor(documentId: string) {
    super(`Document with id "${documentId}" not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class DocumentLoadFailure extends CanvasDomainError {
  constructor(cause?: string) {
    super(`Failed to load document${cause ? `: ${cause}` : ''}`);
    this.name = 'DocumentLoadFailure';
  }
}
