import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import {
  GetVehicleLocationHandler,
  GetVehicleLocationQuery,
  LocalizeVehicleCommand,
  LocalizeVehicleHandler,
  ParkVehicleCommand,
  ParkVehicleHandler,
  RegisterVehicleCommand,
  RegisterVehicleHandler,
} from '../../src/App';
import { ActionDate } from '../../src/Domain/ActionDate';
import { FleetId } from '../../src/Domain/FleetId';
import { FleetRepository } from '../../src/Domain/FleetRepository';
import { Location } from '../../src/Domain/Location';
import { VehiclePlateNumber } from '../../src/Domain/VehiclePlateNumber';
import { createFleetRepository } from './repository_factory';

export class FleetWorld extends World {
  fleetRepository: FleetRepository;
  registerVehicleHandler!: RegisterVehicleHandler;
  parkVehicleHandler!: ParkVehicleHandler;
  localizeVehicleHandler!: LocalizeVehicleHandler;
  getVehicleLocationHandler!: GetVehicleLocationHandler;

  today: ActionDate;
  actionDate: ActionDate;
  myUserId = 'test-user';
  otherUserId = 'other-user';
  intruderUserId = 'intruder-user';
  myFleetId!: FleetId;
  otherFleetId!: FleetId;
  unknownFleetId!: FleetId;
  plateNumber!: VehiclePlateNumber;
  otherPlateNumber!: VehiclePlateNumber;
  location!: Location;
  firstLocation!: Location;
  secondLocation!: Location;
  lastError: Error | null = null;
  lastKnownLocation: Location | null = null;

  constructor(options: IWorldOptions) {
    super(options);
    this.today = ActionDate.parse('2024-06-21');
    this.actionDate = this.today;
    this.fleetRepository = createFleetRepository();
    this.initializeHandlers();
  }

  initializeHandlers(): void {
    this.registerVehicleHandler = new RegisterVehicleHandler(this.fleetRepository);
    this.parkVehicleHandler = new ParkVehicleHandler(this.fleetRepository);
    this.localizeVehicleHandler = new LocalizeVehicleHandler(this.fleetRepository);
    this.getVehicleLocationHandler = new GetVehicleLocationHandler(this.fleetRepository);
  }

  async createFleet(id: string, userId = this.myUserId): Promise<FleetId> {
    const fleetId = new FleetId(id);
    await this.fleetRepository.assignFleetOwner(fleetId, userId);
    return fleetId;
  }

  async registerVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    userId = this.myUserId
  ): Promise<void> {
    await this.registerVehicleHandler.handle(
      new RegisterVehicleCommand(fleetId, userId, plateNumber, this.actionDate, this.today)
    );
  }

  async tryRegisterVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    userId = this.myUserId
  ): Promise<void> {
    this.lastError = null;
    try {
      await this.registerVehicle(fleetId, plateNumber, userId);
    } catch (error) {
      this.lastError = error as Error;
    }
  }

  async parkVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location,
    userId = this.myUserId
  ): Promise<void> {
    await this.parkVehicleHandler.handle(
      new ParkVehicleCommand(fleetId, userId, plateNumber, location, this.actionDate, this.today)
    );
  }

  async tryParkVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location,
    userId = this.myUserId
  ): Promise<void> {
    this.lastError = null;
    try {
      await this.parkVehicle(fleetId, plateNumber, location, userId);
    } catch (error) {
      this.lastError = error as Error;
    }
  }

  async localizeVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location,
    userId = this.myUserId
  ): Promise<void> {
    await this.localizeVehicleHandler.handle(
      new LocalizeVehicleCommand(
        fleetId,
        userId,
        plateNumber,
        location,
        this.actionDate,
        this.today
      )
    );
  }

  async tryLocalizeVehicle(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    location: Location,
    userId = this.myUserId
  ): Promise<void> {
    this.lastError = null;
    try {
      await this.localizeVehicle(fleetId, plateNumber, location, userId);
    } catch (error) {
      this.lastError = error as Error;
    }
  }

  async getVehicleLocation(
    fleetId: FleetId,
    plateNumber: VehiclePlateNumber,
    userId = this.myUserId
  ): Promise<Location | null> {
    return this.getVehicleLocationHandler.handle(
      new GetVehicleLocationQuery(fleetId, userId, plateNumber)
    );
  }
}

setWorldConstructor(FleetWorld);
