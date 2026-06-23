import { InvalidVehiclePlateNumberError } from './errors/InvalidVehiclePlateNumberError';

const MAX_PLATE_LENGTH = 50;

export class VehiclePlateNumber {
  readonly value: string;

  constructor(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      throw new InvalidVehiclePlateNumberError('Vehicle plate number cannot be empty');
    }
    if (normalized.length > MAX_PLATE_LENGTH) {
      throw new InvalidVehiclePlateNumberError(
        `Vehicle plate number cannot exceed ${MAX_PLATE_LENGTH} characters`
      );
    }
    this.value = normalized;
  }

  equals(other: VehiclePlateNumber): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
