import { FleetRepository } from '../../src/Domain/FleetRepository';
import { InMemoryFleetRepository } from '../../src/Infra/InMemoryFleetRepository';
import { getPool } from '../../src/Infra/PostgresConnection';
import { PostgresFleetRepository } from '../../src/Infra/PostgresFleetRepository';

export function createFleetRepository(): FleetRepository {
  if (process.env.FLEET_REPOSITORY === 'postgres') {
    return new PostgresFleetRepository(getPool());
  }
  return new InMemoryFleetRepository();
}

export function usesPostgresRepository(): boolean {
  return process.env.FLEET_REPOSITORY === 'postgres';
}
