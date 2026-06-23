import { FleetRepository } from '../Domain/FleetRepository';
import { FleetId } from '../Domain/FleetId';
import { CreateFleetCommand } from './CreateFleetCommand';

export class CreateFleetHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(command: CreateFleetCommand): Promise<FleetId> {
    return this.fleetRepository.create(command.userId);
  }
}
