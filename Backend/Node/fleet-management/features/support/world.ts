import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import {
  GetVehicleLocationHandler,
  GetVehicleLocationQuery,
  ParkVehicleCommand,
  ParkVehicleHandler,
  RegisterVehicleCommand,
  RegisterVehicleHandler,
} from '../../src/App';
import { ActionDate } from '../../src/Domain/ActionDate';
import { Fleet } from '../../src/Domain/Fleet';
import { FleetId } from '../../src/Domain/FleetId';
import { FleetRepository } from '../../src/Domain/FleetRepository';
import { Location } from '../../src/Domain/Location';
import { VehiclePlateNumber } from '../../src/Domain/VehiclePlateNumber';
import { InMemoryFleetRepository } from '../../src/Infra';

export class FleetWorld extends World {
  readonly fleetRepository: FleetRepository = new InMemoryFleetRepository();
  readonly registerVehicleHandler = new RegisterVehicleHandler(this.fleetRepository);
  readonly parkVehicleHandler = new ParkVehicleHandler(this.fleetRepository);
  readonly getVehicleLocationHandler = new GetVehicleLocationHandler(this.fleetRepository);

  today: ActionDate;
  actionDate: ActionDate;
  myFleetId!: FleetId;
  otherFleetId!: FleetId;
  plateNumber!: VehiclePlateNumber;
  otherPlateNumber!: VehiclePlateNumber;
  location!: Location;
  lastError: Error | null = null;

  constructor(options: IWorldOptions) {
    super(options);
    this.today = ActionDate.parse('2024-06-21');
    this.actionDate = this.today;
  }

  async createFleet(id: string): Promise<FleetId> {
    const fleetId = new FleetId(id);
    await this.fleetRepository.save(new Fleet(fleetId));
    return fleetId;
  }

  async registerVehicle(fleetId: FleetId, plateNumber: VehiclePlateNumber): Promise<void> {
    await this.registerVehicleHandler.handle(
      new RegisterVehicleCommand(
        fleetId,
        plateNumber,
        this.actionDate,
        this.today
      )
    );
  }

  async tryRegisterVehicle(fleetId: FleetId, plateNumber: VehiclePlateNumber): Promise<void> {
    this.lastError = null;
    try {
      await this.registerVehicle(fleetId, plateNumber);
    } catch (error) {
      this.lastError = error as Error;
    }
  }

  async parkVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location
  ): Promise<void> {
    await this.parkVehicleHandler.handle(
      new ParkVehicleCommand(
        fleetId,
        plateNumber,
        location,
        this.actionDate,
        this.today
      )
    );
  }

  async tryParkVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location
  ): Promise<void> {
    this.lastError = null;
    try {
      await this.parkVehicle(fleetId, plateNumber, location);
    } catch (error) {
      this.lastError = error as Error;
    }
  }

  async getVehicleLocation(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber
  ): Promise<Location | null> {
    return this.getVehicleLocationHandler.handle(
      new GetVehicleLocationQuery(fleetId, plateNumber)
    );
  }
}

setWorldConstructor(FleetWorld);
