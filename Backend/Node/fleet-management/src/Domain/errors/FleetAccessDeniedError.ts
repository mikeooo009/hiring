import { DomainError } from './DomainError';
import { FleetId } from '../FleetId';

export class FleetAccessDeniedError extends DomainError {
  constructor(fleetId: FleetId, userId: string) {
    super(`User ${userId} is not allowed to access fleet ${fleetId.toString()}`);
  }
}
