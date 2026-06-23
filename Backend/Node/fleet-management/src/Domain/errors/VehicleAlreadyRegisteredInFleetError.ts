import { DomainError } from './DomainError';
import { VehiclePlateNumber } from '../VehiclePlateNumber';

export class VehicleAlreadyRegisteredInFleetError extends DomainError {
  constructor(plateNumber: VehiclePlateNumber) {
    super(`Vehicle ${plateNumber.toString()} has already been registered into this fleet`);
  }
}
