import { FleetRepository } from '../Domain/FleetRepository';
import { ParkVehicleCommand } from './ParkVehicleCommand';

export class ParkVehicleHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: ParkVehicleCommand): Promise<void> {
    await this.fleetRepository.parkVehicle(command);
  }
}
