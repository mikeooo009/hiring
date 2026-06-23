import { FleetAccessDeniedError } from '../Domain/errors/FleetAccessDeniedError';
import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';

export async function assertFleetAccess(
  fleetRepository: FleetRepository,
  fleetId: FleetId,
  userId: string
): Promise<void> {
  const ownerId = await fleetRepository.getFleetOwnerId(fleetId);
  if (!ownerId) {
    throw new FleetNotFoundError(fleetId);
  }

  if (ownerId !== userId) {
    throw new FleetAccessDeniedError(fleetId, userId);
  }
}
