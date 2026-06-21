import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { LocationAlreadyOccupiedError } from '../Domain/errors/LocationAlreadyOccupiedError';
import { FleetRepository } from '../Domain/FleetRepository';
import { ParkVehicleCommand } from './ParkVehicleCommand';

export class ParkVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: ParkVehicleCommand): Promise<void> {
    await this.assertLocationIsFree(command);

    const fleet = await this.fleetRepository.findById(command.fleetId);
    if (!fleet) {
      throw new FleetNotFoundError(command.fleetId);
    }

    fleet.parkVehicle(
      command.plateNumber,
      command.location,
      command.actionDate,
      command.referenceDate
    );
    await this.fleetRepository.save(fleet);
  }

  private async assertLocationIsFree(command: ParkVehicleCommand): Promise<void> {
    const occupancy = await this.fleetRepository.findVehicleAtLocation(command.location);
    if (!occupancy) {
      return;
    }

    const isSameVehicle =
      occupancy.fleetId.equals(command.fleetId) &&
      occupancy.plateNumber.equals(command.plateNumber);

    if (!isSameVehicle) {
      throw new LocationAlreadyOccupiedError(command.location, occupancy.plateNumber);
    }
  }
}
