import { ActionDate } from './ActionDate';
import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';
import { VehicleAlreadyParkedAtLocationError } from './errors/VehicleAlreadyParkedAtLocationError';
import { VehicleAlreadyParkedAtAnotherLocationError } from './errors/VehicleAlreadyParkedAtAnotherLocationError';
import { VehicleNotParkedError } from './errors/VehicleNotParkedError';

export class FleetVehicle {
  private parkedAt: Location | null;
  private parkedOn: ActionDate | null;

  constructor(
    readonly plateNumber: VehiclePlateNumber,
    readonly registeredAt: ActionDate,
    parkedAt: Location | null = null,
    parkedOn: ActionDate | null = null
  ) {
    this.parkedAt = parkedAt;
    this.parkedOn = parkedOn;
  }

  parkAt(location: Location, actionDate: ActionDate, referenceDate: ActionDate): void {
    actionDate.assertNotInFuture(referenceDate);
    actionDate.assertNotBeforeRegistration(this.registeredAt);

    if (this.parkedAt?.equals(location)) {
      throw new VehicleAlreadyParkedAtLocationError(this.plateNumber);
    }

    if (this.parkedAt) {
      throw new VehicleAlreadyParkedAtAnotherLocationError(this.plateNumber, this.parkedAt);
    }

    this.parkedAt = location;
    this.parkedOn = actionDate;
  }

  relocateTo(location: Location, actionDate: ActionDate, referenceDate: ActionDate): void {
    actionDate.assertNotInFuture(referenceDate);
    actionDate.assertNotBeforeRegistration(this.registeredAt);

    if (!this.parkedAt) {
      throw new VehicleNotParkedError(this.plateNumber);
    }

    if (this.parkedAt.equals(location)) {
      throw new VehicleAlreadyParkedAtLocationError(this.plateNumber);
    }

    this.parkedAt = location;
    this.parkedOn = actionDate;
  }

  getLocation(): Location | null {
    return this.parkedAt;
  }

  getRegisteredAt(): ActionDate {
    return this.registeredAt;
  }

  getParkedOn(): ActionDate | null {
    return this.parkedOn;
  }

  isParkedAt(location: Location): boolean {
    return this.parkedAt?.equals(location) ?? false;
  }
}
