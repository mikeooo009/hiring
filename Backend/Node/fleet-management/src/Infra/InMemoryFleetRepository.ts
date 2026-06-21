import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';
import { Location } from '../Domain/Location';
import { LocationOccupancy } from '../Domain/LocationOccupancy';

export class InMemoryFleetRepository implements FleetRepository {
  private readonly fleets = new Map<string, Fleet>();

  async findById(id: FleetId): Promise<Fleet | null> {
    return this.fleets.get(id.toString()) ?? null;
  }

  async save(fleet: Fleet): Promise<void> {
    this.fleets.set(fleet.id.toString(), fleet);
  }

  async findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null> {
    for (const fleet of this.fleets.values()) {
      const plateNumber = fleet.findVehicleAtLocation(location);
      if (plateNumber) {
        return { fleetId: fleet.id, plateNumber };
      }
    }
    return null;
  }
}
