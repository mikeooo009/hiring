import { FleetId } from '../Domain/FleetId';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

export class RegisterVehicleCommand {
  constructor(
    readonly fleetId: FleetId,
    readonly plateNumber: VehiclePlateNumber
  ) {}
}
