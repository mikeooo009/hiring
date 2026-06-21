import { FleetId } from './FleetId';
import { Location } from './Location';
import { VehiclePlateNumber } from './VehiclePlateNumber';

export interface LocationOccupancy {
  fleetId: FleetId;
  plateNumber: VehiclePlateNumber;
}
