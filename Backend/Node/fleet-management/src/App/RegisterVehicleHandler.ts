import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { FleetRepository } from '../Domain/FleetRepository';
import { RegisterVehicleCommand } from './RegisterVehicleCommand';

export class RegisterVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: RegisterVehicleCommand): Promise<void> {
    const fleet = await this.fleetRepository.findById(command.fleetId);
    if (!fleet) {
      throw new FleetNotFoundError(command.fleetId);
    }

    fleet.registerVehicle(command.plateNumber);
    await this.fleetRepository.save(fleet);
  }
}
