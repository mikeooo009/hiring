import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';
import { VehicleAlreadyParkedAtLocationError } from './errors/VehicleAlreadyParkedAtLocationError';

export class FleetVehicle {
  private parkedAt: Location | null = null;

  constructor(readonly plateNumber: VehiclePlateNumber) {}

  parkAt(location: Location): void {
    if (this.parkedAt?.equals(location)) {
      throw new VehicleAlreadyParkedAtLocationError(this.plateNumber);
    }
    this.parkedAt = location;
  }

  getLocation(): Location | null {
    return this.parkedAt;
  }

  isParkedAt(location: Location): boolean {
    return this.parkedAt?.equals(location) ?? false;
  }
}
