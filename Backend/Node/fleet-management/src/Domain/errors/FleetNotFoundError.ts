import { DomainError } from './DomainError';
import { FleetId } from '../FleetId';

export class FleetNotFoundError extends DomainError {
  constructor(fleetId: FleetId) {
    super(`Fleet ${fleetId.toString()} was not found`);
  }
}
