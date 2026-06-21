import { ActionDate } from './ActionDate';
import { FleetId } from './FleetId';
import { FleetVehicle } from './FleetVehicle';
import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';
import { VehicleAlreadyRegisteredInFleetError } from './errors/VehicleAlreadyRegisteredInFleetError';
import { VehicleNotRegisteredInFleetError } from './errors/VehicleNotRegisteredInFleetError';
import { LocationAlreadyOccupiedError } from './errors/LocationAlreadyOccupiedError';

export class Fleet {
  private readonly vehicles = new Map<string, FleetVehicle>();

  constructor(readonly id: FleetId) {}

  registerVehicle(
    plateNumber: VehiclePlateNumber,
    actionDate: ActionDate,
    referenceDate: ActionDate
  ): void {
    actionDate.assertNotInFuture(referenceDate);

    if (this.hasVehicle(plateNumber)) {
      throw new VehicleAlreadyRegisteredInFleetError(plateNumber);
    }

    this.vehicles.set(
      plateNumber.toString(),
      new FleetVehicle(plateNumber, actionDate)
    );
  }

  parkVehicle(
    plateNumber: VehiclePlateNumber,
    location: Location,
    actionDate: ActionDate,
    referenceDate: ActionDate
  ): void {
    this.assertLocationIsFree(location, plateNumber);
    this.getVehicle(plateNumber).parkAt(location, actionDate, referenceDate);
  }

  findVehicleAtLocation(location: Location): VehiclePlateNumber | null {
    for (const vehicle of this.vehicles.values()) {
      if (vehicle.isParkedAt(location)) {
        return vehicle.plateNumber;
      }
    }
    return null;
  }

  hasVehicle(plateNumber: VehiclePlateNumber): boolean {
    return this.vehicles.has(plateNumber.toString());
  }

  getVehicleLocation(plateNumber: VehiclePlateNumber): Location | null {
    return this.getVehicle(plateNumber).getLocation();
  }

  getVehicleRegistrationDate(plateNumber: VehiclePlateNumber): ActionDate {
    return this.getVehicle(plateNumber).getRegisteredAt();
  }

  private assertLocationIsFree(
    location: Location,
    plateNumber: VehiclePlateNumber
  ): void {
    const occupyingPlate = this.findVehicleAtLocation(location);
    if (occupyingPlate && !occupyingPlate.equals(plateNumber)) {
      throw new LocationAlreadyOccupiedError(location, occupyingPlate);
    }
  }

  private getVehicle(plateNumber: VehiclePlateNumber): FleetVehicle {
    const vehicle = this.vehicles.get(plateNumber.toString());
    if (!vehicle) {
      throw new VehicleNotRegisteredInFleetError(plateNumber);
    }
    return vehicle;
  }
}
