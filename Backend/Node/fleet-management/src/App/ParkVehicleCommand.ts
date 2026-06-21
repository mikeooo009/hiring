import { FleetId } from '../Domain/FleetId';
import { Location } from '../Domain/Location';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

export class ParkVehicleCommand {
  constructor(
    readonly fleetId: FleetId,
    readonly plateNumber: VehiclePlateNumber,
    readonly location: Location
  ) {}
}
