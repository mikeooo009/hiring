import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { FleetRepository } from '../Domain/FleetRepository';
import { assertFleetAccess } from './fleetAccess';
import { RegisterVehicleCommand } from './RegisterVehicleCommand';

export async function executeRegisterVehicleWorkflow(
  fleetRepository: FleetRepository,
  command: RegisterVehicleCommand
): Promise<void> {
  await assertFleetAccess(fleetRepository, command.fleetId, command.userId);

  const fleet = await fleetRepository.findById(command.fleetId);
  if (!fleet) {
    throw new FleetNotFoundError(command.fleetId);
  }

  fleet.registerVehicle(command.plateNumber, command.actionDate, command.referenceDate);
  await fleetRepository.save(fleet);
}
