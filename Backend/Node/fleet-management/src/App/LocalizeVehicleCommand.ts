import { ActionDate } from '../Domain/ActionDate';
import { FleetId } from '../Domain/FleetId';
import { Location } from '../Domain/Location';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';
import { ParkVehicleCommand } from './ParkVehicleCommand';

export class LocalizeVehicleCommand {
  constructor(
    readonly fleetId: FleetId,
    readonly userId: string,
    readonly plateNumber: VehiclePlateNumber,
    readonly location: Location,
    readonly actionDate: ActionDate,
    readonly referenceDate: ActionDate
  ) {}

  toParkCommand(): ParkVehicleCommand {
    return new ParkVehicleCommand(
      this.fleetId,
      this.userId,
      this.plateNumber,
      this.location,
      this.actionDate,
      this.referenceDate
    );
  }
}
