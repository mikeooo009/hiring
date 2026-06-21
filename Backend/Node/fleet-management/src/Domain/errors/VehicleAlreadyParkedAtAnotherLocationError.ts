import { Location } from '../Location';
import { VehiclePlateNumber } from '../VehiclePlateNumber';
import { DomainError } from './DomainError';

export class VehicleAlreadyParkedAtAnotherLocationError extends DomainError {
  constructor(plateNumber: VehiclePlateNumber, currentLocation: Location) {
    super(
      `Vehicle ${plateNumber.toString()} is already parked at (${currentLocation.latitude}, ${currentLocation.longitude}) and cannot be at two locations at the same time`
    );
  }
}
