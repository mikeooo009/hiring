import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { LocationAlreadyOccupiedError } from '../Domain/errors/LocationAlreadyOccupiedError';
import { VehicleAlreadyParkedAtAnotherLocationError } from '../Domain/errors/VehicleAlreadyParkedAtAnotherLocationError';
import { FleetRepository } from '../Domain/FleetRepository';
import { ParkVehicleCommand } from './ParkVehicleCommand';

export async function executeParkVehicleWorkflow(
  fleetRepository: FleetRepository,
  command: ParkVehicleCommand
): Promise<void> {
  await assertLocationIsFree(fleetRepository, command);
  await assertVehicleNotParkedElsewhere(fleetRepository, command);

  const fleet = await fleetRepository.findById(command.fleetId);
  if (!fleet) {
    throw new FleetNotFoundError(command.fleetId);
  }

  fleet.parkVehicle(
    command.plateNumber,
    command.location,
    command.actionDate,
    command.referenceDate
  );
  await fleetRepository.save(fleet);
}

async function assertLocationIsFree(
  fleetRepository: FleetRepository,
  command: ParkVehicleCommand
): Promise<void> {
  const occupancy = await fleetRepository.findVehicleAtLocation(command.location);
  if (!occupancy) {
    return;
  }

  const isSameVehicle =
    occupancy.fleetId.equals(command.fleetId) &&
    occupancy.plateNumber.equals(command.plateNumber);

  if (!isSameVehicle) {
    throw new LocationAlreadyOccupiedError(command.location, occupancy.plateNumber);
  }
}

async function assertVehicleNotParkedElsewhere(
  fleetRepository: FleetRepository,
  command: ParkVehicleCommand
): Promise<void> {
  const parking = await fleetRepository.findVehicleParking(command.plateNumber);
  if (!parking) {
    return;
  }

  const isSameParking =
    parking.fleetId.equals(command.fleetId) && parking.location.equals(command.location);

  if (!isSameParking) {
    throw new VehicleAlreadyParkedAtAnotherLocationError(command.plateNumber, parking.location);
  }
}
