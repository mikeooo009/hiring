import { DomainError } from './DomainError';
import { VehiclePlateNumber } from '../VehiclePlateNumber';

export class VehicleAlreadyParkedAtLocationError extends DomainError {
  constructor(plateNumber: VehiclePlateNumber) {
    super(`Vehicle ${plateNumber.toString()} is already parked at this location`);
  }
}
