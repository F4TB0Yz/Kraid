export class ChatDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChatDomainError';
  }
}

export class MessageNotFoundError extends ChatDomainError {
  constructor(messageId: string) {
    super(`Message with id "${messageId}" not found`);
    this.name = 'MessageNotFoundError';
  }
}

export class MessageLoadFailure extends ChatDomainError {
  constructor(cause?: string) {
    super(`Failed to load messages${cause ? `: ${cause}` : ''}`);
    this.name = 'MessageLoadFailure';
  }
}
