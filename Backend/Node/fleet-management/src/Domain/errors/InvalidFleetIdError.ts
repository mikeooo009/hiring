import { DomainError } from './DomainError';

export class InvalidFleetIdError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
