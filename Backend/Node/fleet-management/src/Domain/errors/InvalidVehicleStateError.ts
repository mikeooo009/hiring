import { DomainError } from './DomainError';

export class InvalidVehicleStateError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
