import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { Location } from '../Domain/Location';
import { FleetRepository } from '../Domain/FleetRepository';
import { assertFleetAccess } from './fleetAccess';
import { GetVehicleLocationQuery } from './GetVehicleLocationQuery';

export class GetVehicleLocationHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(query: GetVehicleLocationQuery): Promise<Location | null> {
    await assertFleetAccess(this.fleetRepository, query.fleetId, query.userId);

    const fleet = await this.fleetRepository.findById(query.fleetId);
    if (!fleet) {
      throw new FleetNotFoundError(query.fleetId);
    }

    return fleet.getVehicleLocation(query.plateNumber);
  }
}
