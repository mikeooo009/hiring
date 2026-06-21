import { FleetId } from './FleetId';
import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';

export interface VehicleParking {
  fleetId: FleetId;
  plateNumber: VehiclePlateNumber;
  location: Location;
}
