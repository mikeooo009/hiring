import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { FleetRepository } from '../Domain/FleetRepository';
import { Location } from '../Domain/Location';
import { GetVehicleLocationQuery } from './GetVehicleLocationQuery';

export class GetVehicleLocationHandler {
  constructor(private readonly fleetRepository: FleetRepository) {}

  async handle(query: GetVehicleLocationQuery): Promise<Location | null> {
    const fleet = await this.fleetRepository.findById(query.fleetId);
    if (!fleet) {
      throw new FleetNotFoundError(query.fleetId);
    }

    return fleet.getVehicleLocation(query.plateNumber);
  }
}
