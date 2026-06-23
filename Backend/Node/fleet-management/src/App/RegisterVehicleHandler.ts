import { FleetRepository } from '../Domain/FleetRepository';
import { RegisterVehicleCommand } from './RegisterVehicleCommand';

export class RegisterVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: RegisterVehicleCommand): Promise<void> {
    await this.fleetRepository.registerVehicle(command);
  }
}
