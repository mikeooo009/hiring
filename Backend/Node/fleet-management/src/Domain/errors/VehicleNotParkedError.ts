import { DomainError } from './DomainError';
import { VehiclePlateNumber } from '../VehiclePlateNumber';

export class VehicleNotParkedError extends DomainError {
  constructor(plateNumber: VehiclePlateNumber) {
    super(`Vehicle ${plateNumber.toString()} is not parked`);
  }
}
