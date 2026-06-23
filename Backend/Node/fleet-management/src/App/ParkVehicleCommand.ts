import { ActionDate } from '../Domain/ActionDate';
import { FleetId } from '../Domain/FleetId';
import { Location } from '../Domain/Location';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

export class ParkVehicleCommand {
  constructor(
    readonly fleetId: FleetId,
    readonly userId: string,
    readonly plateNumber: VehiclePlateNumber,
    readonly location: Location,
    readonly actionDate: ActionDate,
    readonly referenceDate: ActionDate
  ) {}
}
