import { DomainError } from './DomainError';

export class InvalidLocationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
