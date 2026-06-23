import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { VehicleAlreadyParkedAtLocationError } from '../Domain/errors/VehicleAlreadyParkedAtLocationError';
import { VehicleNotRegisteredInFleetError } from '../Domain/errors/VehicleNotRegisteredInFleetError';
import { FleetRepository } from '../Domain/FleetRepository';
import { assertFleetAccess } from './fleetAccess';
import { LocalizeVehicleCommand } from './LocalizeVehicleCommand';
import { assertLocationIsFreeForVehicle, executeParkVehicleWorkflow } from './parkVehicleWorkflow';

export async function executeLocalizeVehicleWorkflow(
  fleetRepository: FleetRepository,
  command: LocalizeVehicleCommand
): Promise<void> {
  await assertFleetAccess(fleetRepository, command.fleetId, command.userId);

  const fleet = await fleetRepository.findById(command.fleetId);
  if (!fleet) {
    throw new FleetNotFoundError(command.fleetId);
  }

  if (!fleet.hasVehicle(command.plateNumber)) {
    throw new VehicleNotRegisteredInFleetError(command.plateNumber);
  }

  const currentLocation = fleet.getVehicleLocation(command.plateNumber);
  if (!currentLocation) {
    await executeParkVehicleWorkflow(fleetRepository, command.toParkCommand());
    return;
  }

  if (currentLocation.equals(command.location)) {
    throw new VehicleAlreadyParkedAtLocationError(command.plateNumber);
  }

  await assertLocationIsFreeForVehicle(fleetRepository, command.toParkCommand());

  fleet.relocateVehicle(
    command.plateNumber,
    command.location,
    command.actionDate,
    command.referenceDate
  );
  await fleetRepository.save(fleet);
}
