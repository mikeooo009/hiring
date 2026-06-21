import { DomainError } from './DomainError';
import { VehiclePlateNumber } from '../VehiclePlateNumber';

export class VehicleNotRegisteredInFleetError extends DomainError {
  constructor(plateNumber: VehiclePlateNumber) {
    super(`Vehicle ${plateNumber.toString()} is not registered in this fleet`);
  }
}
