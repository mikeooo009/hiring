import { Location } from '../Location';
import { VehiclePlateNumber } from '../VehiclePlateNumber';
import { DomainError } from './DomainError';

export class LocationAlreadyOccupiedError extends DomainError {
  constructor(location: Location, occupiedBy: VehiclePlateNumber) {
    super(
      `Location (${location.latitude}, ${location.longitude}) is already occupied by vehicle ${occupiedBy.toString()}`
    );
  }
}
