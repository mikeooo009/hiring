import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { LocalizeVehicleCommand } from '../App/LocalizeVehicleCommand';
import { RegisterVehicleCommand } from '../App/RegisterVehicleCommand';
import { Fleet } from './Fleet';
import { FleetId } from './FleetId';
import { Location } from './Location';
import { LocationOccupancy } from './LocationOccupancy';
import { VehicleParking } from './VehicleParking';
import { VehiclePlateNumber } from './VehiclePlateNumber';

export interface FleetRepository {
  create(userId: string): Promise<FleetId>;
  assignFleetOwner(fleetId: FleetId, userId: string): Promise<void>;
  getFleetOwnerId(fleetId: FleetId): Promise<string | null>;
  findById(id: FleetId): Promise<Fleet | null>;
  save(fleet: Fleet): Promise<void>;
  findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null>;
  findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null>;
  registerVehicle(command: RegisterVehicleCommand): Promise<void>;
  parkVehicle(command: ParkVehicleCommand): Promise<void>;
  localizeVehicle(command: LocalizeVehicleCommand): Promise<void>;
}
