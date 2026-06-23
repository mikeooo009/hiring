import { FleetId } from '../Domain/FleetId';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

export class GetVehicleLocationQuery {
  constructor(
    readonly fleetId: FleetId,
    readonly userId: string,
    readonly plateNumber: VehiclePlateNumber
  ) {}
}
