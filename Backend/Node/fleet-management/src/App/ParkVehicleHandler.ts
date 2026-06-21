import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { FleetRepository } from '../Domain/FleetRepository';
import { ParkVehicleCommand } from './ParkVehicleCommand';

export class ParkVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: ParkVehicleCommand): Promise<void> {
    const fleet = await this.fleetRepository.findById(command.fleetId);
    if (!fleet) {
      throw new FleetNotFoundError(command.fleetId);
    }

    fleet.parkVehicle(command.plateNumber, command.location);
    await this.fleetRepository.save(fleet);
  }
}
