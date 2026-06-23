import { randomUUID } from 'node:crypto';
import { executeParkVehicleWorkflow } from '../App/parkVehicleWorkflow';
import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';
import { Location } from '../Domain/Location';
import { LocationOccupancy } from '../Domain/LocationOccupancy';
import { VehicleParking } from '../Domain/VehicleParking';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';
import { AsyncMutex } from './AsyncMutex';

export class InMemoryFleetRepository implements FleetRepository {
  private readonly fleets = new Map<string, Fleet>();
  private readonly userIds = new Map<string, string>();
  private readonly parkVehicleMutex = new AsyncMutex();

  async create(userId: string): Promise<FleetId> {
    const fleetId = new FleetId(randomUUID());
    const fleet = new Fleet(fleetId);
    this.fleets.set(fleetId.toString(), fleet);
    this.userIds.set(fleetId.toString(), userId);
    return fleetId;
  }

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

  async findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null> {
    for (const fleet of this.fleets.values()) {
      if (!fleet.hasVehicle(plateNumber)) {
        continue;
      }

      const location = fleet.getVehicleLocation(plateNumber);
      if (location) {
        return { fleetId: fleet.id, plateNumber, location };
      }
    }
    return null;
  }

  async parkVehicle(command: ParkVehicleCommand): Promise<void> {
    await this.parkVehicleMutex.runExclusive(async () => {
      await executeParkVehicleWorkflow(this, command);
    });
  }
}
