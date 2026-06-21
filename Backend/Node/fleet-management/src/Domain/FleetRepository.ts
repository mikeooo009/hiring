import { Fleet } from './Fleet';
import { FleetId } from './FleetId';
import { Location } from './Location';
import { LocationOccupancy } from './LocationOccupancy';

export interface FleetRepository {
  findById(id: FleetId): Promise<Fleet | null>;
  save(fleet: Fleet): Promise<void>;
  findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null>;
}
