import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { Fleet } from './Fleet';
import { FleetId } from './FleetId';
import { Location } from './Location';
import { LocationOccupancy } from './LocationOccupancy';
import { VehicleParking } from './VehicleParking';
import { VehiclePlateNumber } from './VehiclePlateNumber';

export interface FleetRepository {
  create(userId: string): Promise<FleetId>;
  findById(id: FleetId): Promise<Fleet | null>;
  save(fleet: Fleet): Promise<void>;
  findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null>;
  findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null>;
  parkVehicle(command: ParkVehicleCommand): Promise<void>;
}
