import { InvalidVehiclePlateNumberError } from './errors/InvalidVehiclePlateNumberError';

export class VehiclePlateNumber {
  constructor(readonly value: string) {
    if (!value.trim()) {
      throw new InvalidVehiclePlateNumberError('Vehicle plate number cannot be empty');
    }
  }

  equals(other: VehiclePlateNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
