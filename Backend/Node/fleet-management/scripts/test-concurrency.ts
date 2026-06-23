import { ActionDate } from '../src/Domain/ActionDate';
import { Location } from '../src/Domain/Location';
import { VehiclePlateNumber } from '../src/Domain/VehiclePlateNumber';
import { ParkVehicleCommand } from '../src/App/ParkVehicleCommand';
import { ParkVehicleHandler } from '../src/App/ParkVehicleHandler';
import { CreateFleetHandler } from '../src/App/CreateFleetHandler';
import { RegisterVehicleHandler } from '../src/App/RegisterVehicleHandler';
import { CreateFleetCommand } from '../src/App/CreateFleetCommand';
import { RegisterVehicleCommand } from '../src/App/RegisterVehicleCommand';
import { VehicleAlreadyParkedAtAnotherLocationError } from '../src/Domain/errors/VehicleAlreadyParkedAtAnotherLocationError';
import { LocationAlreadyOccupiedError } from '../src/Domain/errors/LocationAlreadyOccupiedError';
import { getPool, closePool } from '../src/Infra/PostgresConnection';
import { migrate } from '../src/Infra/migrate';
import { PostgresFleetRepository } from '../src/Infra/PostgresFleetRepository';
import { InMemoryFleetRepository } from '../src/Infra/InMemoryFleetRepository';

async function runConcurrentParkSameVehicleTest(repositoryName: string, repository: PostgresFleetRepository | InMemoryFleetRepository): Promise<void> {
  const createFleet = new CreateFleetHandler(repository);
  const registerVehicle = new RegisterVehicleHandler(repository);
  const parkVehicle = new ParkVehicleHandler(repository);

  const referenceDate = ActionDate.parse('2024-06-01');
  const fleetId = await createFleet.handle(new CreateFleetCommand('user-1'));
  const plate = new VehiclePlateNumber('ABC-123');
  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, plate, referenceDate, referenceDate)
  );

  const locationA = new Location(48.8566, 2.3522);
  const locationB = new Location(45.764, 4.8357);

  const results = await Promise.allSettled([
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, plate, locationA, referenceDate, referenceDate)
    ),
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, plate, locationB, referenceDate, referenceDate)
    ),
  ]);

  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  if (fulfilled.length !== 1 || rejected.length !== 1) {
    throw new Error(
      `[${repositoryName}] expected 1 success and 1 failure, got ${fulfilled.length} success / ${rejected.length} failure`
    );
  }

  const error = rejected[0].reason;
  if (!(error instanceof VehicleAlreadyParkedAtAnotherLocationError)) {
    throw new Error(
      `[${repositoryName}] expected VehicleAlreadyParkedAtAnotherLocationError, got ${String(error)}`
    );
  }

  console.log(`[${repositoryName}] concurrent park same vehicle: OK`);
}

async function runConcurrentParkSameLocationTest(
  repositoryName: string,
  repository: PostgresFleetRepository | InMemoryFleetRepository
): Promise<void> {
  const createFleet = new CreateFleetHandler(repository);
  const registerVehicle = new RegisterVehicleHandler(repository);
  const parkVehicle = new ParkVehicleHandler(repository);

  const referenceDate = ActionDate.parse('2024-06-01');
  const fleetId = await createFleet.handle(new CreateFleetCommand('user-1'));
  const location = new Location(43.2965, 5.3698);
  const plateA = new VehiclePlateNumber('XYZ-111');
  const plateB = new VehiclePlateNumber('XYZ-222');

  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, plateA, referenceDate, referenceDate)
  );
  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, plateB, referenceDate, referenceDate)
  );

  const results = await Promise.allSettled([
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, plateA, location, referenceDate, referenceDate)
    ),
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, plateB, location, referenceDate, referenceDate)
    ),
  ]);

  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  if (fulfilled.length !== 1 || rejected.length !== 1) {
    throw new Error(
      `[${repositoryName}] expected 1 success and 1 failure, got ${fulfilled.length} success / ${rejected.length} failure`
    );
  }

  const error = rejected[0].reason;
  if (!(error instanceof LocationAlreadyOccupiedError)) {
    throw new Error(
      `[${repositoryName}] expected LocationAlreadyOccupiedError, got ${String(error)}`
    );
  }

  console.log(`[${repositoryName}] concurrent park same location: OK`);
}

async function main(): Promise<void> {
  await runConcurrentParkSameVehicleTest('in-memory', new InMemoryFleetRepository());
  await runConcurrentParkSameLocationTest('in-memory', new InMemoryFleetRepository());

  if (process.env.FLEET_REPOSITORY === 'postgres') {
    await migrate();
    const pool = getPool();
    const repository = new PostgresFleetRepository(pool);
    await pool.query('TRUNCATE fleet_vehicles, fleets RESTART IDENTITY CASCADE');
    await runConcurrentParkSameVehicleTest('postgres', repository);
    await pool.query('TRUNCATE fleet_vehicles, fleets RESTART IDENTITY CASCADE');
    await runConcurrentParkSameLocationTest('postgres', repository);
    await closePool();
  }

  console.log('All concurrency checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
