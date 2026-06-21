import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';

export class InMemoryFleetRepository implements FleetRepository {
  private readonly fleets = new Map<string, Fleet>();

  async findById(id: FleetId): Promise<Fleet | null> {
    return this.fleets.get(id.toString()) ?? null;
  }

  async save(fleet: Fleet): Promise<void> {
    this.fleets.set(fleet.id.toString(), fleet);
  }
}
