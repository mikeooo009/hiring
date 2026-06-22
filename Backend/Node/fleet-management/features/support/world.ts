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
import { getPool } from '../../src/Infra/PostgresConnection';
import { createFleetRepository, usesPostgresRepository } from './repository_factory';

export class FleetWorld extends World {
  fleetRepository: FleetRepository;
  registerVehicleHandler!: RegisterVehicleHandler;
  parkVehicleHandler!: ParkVehicleHandler;
  getVehicleLocationHandler!: GetVehicleLocationHandler;

  today: ActionDate;
  actionDate: ActionDate;
  myFleetId!: FleetId;
  otherFleetId!: FleetId;
  unknownFleetId!: FleetId;
  plateNumber!: VehiclePlateNumber;
  otherPlateNumber!: VehiclePlateNumber;
  location!: Location;
  firstLocation!: Location;
  secondLocation!: Location;
  lastError: Error | null = null;

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
    this.getVehicleLocationHandler = new GetVehicleLocationHandler(this.fleetRepository);
  }

  async createFleet(id: string, userId = 'test-user'): Promise<FleetId> {
    const fleetId = new FleetId(id);

    if (usesPostgresRepository()) {
      await getPool().query(
        'INSERT INTO fleets (id, user_id) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
        [fleetId.toString(), userId]
      );
    }

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
