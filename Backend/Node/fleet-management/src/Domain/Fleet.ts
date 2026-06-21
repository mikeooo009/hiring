import { FleetId } from './FleetId';
import { FleetVehicle } from './FleetVehicle';
import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';
import { VehicleAlreadyRegisteredInFleetError } from './errors/VehicleAlreadyRegisteredInFleetError';
import { VehicleNotRegisteredInFleetError } from './errors/VehicleNotRegisteredInFleetError';

export class Fleet {
  private readonly vehicles = new Map<string, FleetVehicle>();

  constructor(readonly id: FleetId) {}

  registerVehicle(plateNumber: VehiclePlateNumber): void {
    if (this.hasVehicle(plateNumber)) {
      throw new VehicleAlreadyRegisteredInFleetError(plateNumber);
    }
    this.vehicles.set(plateNumber.toString(), new FleetVehicle(plateNumber));
  }

  parkVehicle(plateNumber: VehiclePlateNumber, location: Location): void {
    this.getVehicle(plateNumber).parkAt(location);
  }

  hasVehicle(plateNumber: VehiclePlateNumber): boolean {
    return this.vehicles.has(plateNumber.toString());
  }

  getVehicleLocation(plateNumber: VehiclePlateNumber): Location | null {
    return this.getVehicle(plateNumber).getLocation();
  }

  private getVehicle(plateNumber: VehiclePlateNumber): FleetVehicle {
    const vehicle = this.vehicles.get(plateNumber.toString());
    if (!vehicle) {
      throw new VehicleNotRegisteredInFleetError(plateNumber);
    }
    return vehicle;
  }
}
