import { ActionDate } from '../Domain/ActionDate';
import { FleetId } from '../Domain/FleetId';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

export class RegisterVehicleCommand {
  constructor(
    readonly fleetId: FleetId,
    readonly plateNumber: VehiclePlateNumber,
    readonly actionDate: ActionDate,
    readonly referenceDate: ActionDate
  ) {}
}
