import { DomainError } from './DomainError';

export class InvalidVehiclePlateNumberError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
