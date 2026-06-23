import { FleetRepository } from '../Domain/FleetRepository';
import { LocalizeVehicleCommand } from './LocalizeVehicleCommand';

export class LocalizeVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: LocalizeVehicleCommand): Promise<void> {
    await this.fleetRepository.localizeVehicle(command);
  }
}
