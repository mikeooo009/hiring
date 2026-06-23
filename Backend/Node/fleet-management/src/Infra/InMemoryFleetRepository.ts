import { randomUUID } from 'node:crypto';
import { executeLocalizeVehicleWorkflow } from '../App/localizeVehicleWorkflow';
import { LocalizeVehicleCommand } from '../App/LocalizeVehicleCommand';
import { executeParkVehicleWorkflow } from '../App/parkVehicleWorkflow';
import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { executeRegisterVehicleWorkflow } from '../App/registerVehicleWorkflow';
import { RegisterVehicleCommand } from '../App/RegisterVehicleCommand';
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
  private readonly writeMutex = new AsyncMutex();

  async create(userId: string): Promise<FleetId> {
    const fleetId = new FleetId(randomUUID());
    await this.assignFleetOwner(fleetId, userId);
    await this.save(new Fleet(fleetId));
    return fleetId;
  }

  async assignFleetOwner(fleetId: FleetId, userId: string): Promise<void> {
    this.userIds.set(fleetId.toString(), userId);
    if (!this.fleets.has(fleetId.toString())) {
      this.fleets.set(fleetId.toString(), new Fleet(fleetId));
    }
  }

  async getFleetOwnerId(fleetId: FleetId): Promise<string | null> {
    return this.userIds.get(fleetId.toString()) ?? null;
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

  async registerVehicle(command: RegisterVehicleCommand): Promise<void> {
    await this.writeMutex.runExclusive(async () => {
      await executeRegisterVehicleWorkflow(this, command);
    });
  }

  async parkVehicle(command: ParkVehicleCommand): Promise<void> {
    await this.writeMutex.runExclusive(async () => {
      await executeParkVehicleWorkflow(this, command);
    });
  }

  async localizeVehicle(command: LocalizeVehicleCommand): Promise<void> {
    await this.writeMutex.runExclusive(async () => {
      await executeLocalizeVehicleWorkflow(this, command);
    });
  }
}
