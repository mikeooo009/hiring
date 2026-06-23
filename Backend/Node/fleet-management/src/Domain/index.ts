export { ActionDate } from './ActionDate';
export { Fleet } from './Fleet';
export { FleetId } from './FleetId';
export { FleetRepository } from './FleetRepository';
export { FleetVehicle } from './FleetVehicle';
export { Location } from './Location';
export { VehiclePlateNumber } from './VehiclePlateNumber';
export { VehicleParking } from './VehicleParking';
export { LocationOccupancy } from './LocationOccupancy';
export {
  coordinatesEqual,
  COORDINATE_EPSILON,
  COORDINATE_PRECISION,
  roundCoordinate,
} from './coordinates';
export { DomainError } from './errors/DomainError';
export { FleetAccessDeniedError } from './errors/FleetAccessDeniedError';
export { InvalidFleetIdError } from './errors/InvalidFleetIdError';
export { InvalidLocationError } from './errors/InvalidLocationError';
export { InvalidVehiclePlateNumberError } from './errors/InvalidVehiclePlateNumberError';
export { InvalidVehicleStateError } from './errors/InvalidVehicleStateError';
export { ActionDateBeforeRegistrationError } from './errors/ActionDateBeforeRegistrationError';
export { FleetNotFoundError } from './errors/FleetNotFoundError';
export { FutureActionDateError } from './errors/FutureActionDateError';
export { LocationAlreadyOccupiedError } from './errors/LocationAlreadyOccupiedError';
export { VehicleAlreadyParkedAtAnotherLocationError } from './errors/VehicleAlreadyParkedAtAnotherLocationError';
export { VehicleAlreadyParkedAtLocationError } from './errors/VehicleAlreadyParkedAtLocationError';
export { VehicleAlreadyRegisteredInFleetError } from './errors/VehicleAlreadyRegisteredInFleetError';
export { VehicleNotParkedError } from './errors/VehicleNotParkedError';
export { VehicleNotRegisteredInFleetError } from './errors/VehicleNotRegisteredInFleetError';
