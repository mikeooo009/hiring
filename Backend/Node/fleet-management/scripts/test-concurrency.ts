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
import { VehicleAlreadyRegisteredInFleetError } from '../src/Domain/errors/VehicleAlreadyRegisteredInFleetError';
import { LocationAlreadyOccupiedError } from '../src/Domain/errors/LocationAlreadyOccupiedError';
import { getPool, closePool } from '../src/Infra/PostgresConnection';
import { migrate } from '../src/Infra/migrate';
import { PostgresFleetRepository } from '../src/Infra/PostgresFleetRepository';
import { InMemoryFleetRepository } from '../src/Infra/InMemoryFleetRepository';

const USER_ID = 'user-1';

async function runConcurrentParkSameVehicleTest(
  repositoryName: string,
  repository: PostgresFleetRepository | InMemoryFleetRepository
): Promise<void> {
  const createFleet = new CreateFleetHandler(repository);
  const registerVehicle = new RegisterVehicleHandler(repository);
  const parkVehicle = new ParkVehicleHandler(repository);

  const referenceDate = ActionDate.parse('2024-06-01');
  const fleetId = await createFleet.handle(new CreateFleetCommand(USER_ID));
  const plate = new VehiclePlateNumber('ABC-123');
  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, USER_ID, plate, referenceDate, referenceDate)
  );

  const locationA = new Location(48.8566, 2.3522);
  const locationB = new Location(45.764, 4.8357);

  const results = await Promise.allSettled([
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, USER_ID, plate, locationA, referenceDate, referenceDate)
    ),
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, USER_ID, plate, locationB, referenceDate, referenceDate)
    ),
  ]);

  assertOneSuccessOneFailure(
    repositoryName,
    'concurrent park same vehicle',
    results,
    VehicleAlreadyParkedAtAnotherLocationError
  );
}

async function runConcurrentParkSameLocationTest(
  repositoryName: string,
  repository: PostgresFleetRepository | InMemoryFleetRepository
): Promise<void> {
  const createFleet = new CreateFleetHandler(repository);
  const registerVehicle = new RegisterVehicleHandler(repository);
  const parkVehicle = new ParkVehicleHandler(repository);

  const referenceDate = ActionDate.parse('2024-06-01');
  const fleetId = await createFleet.handle(new CreateFleetCommand(USER_ID));
  const location = new Location(43.2965, 5.3698);
  const plateA = new VehiclePlateNumber('XYZ-111');
  const plateB = new VehiclePlateNumber('XYZ-222');

  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, USER_ID, plateA, referenceDate, referenceDate)
  );
  await registerVehicle.handle(
    new RegisterVehicleCommand(fleetId, USER_ID, plateB, referenceDate, referenceDate)
  );

  const results = await Promise.allSettled([
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, USER_ID, plateA, location, referenceDate, referenceDate)
    ),
    parkVehicle.handle(
      new ParkVehicleCommand(fleetId, USER_ID, plateB, location, referenceDate, referenceDate)
    ),
  ]);

  assertOneSuccessOneFailure(
    repositoryName,
    'concurrent park same location',
    results,
    LocationAlreadyOccupiedError
  );
}

async function runConcurrentRegisterSameVehicleTest(
  repositoryName: string,
  repository: PostgresFleetRepository | InMemoryFleetRepository
): Promise<void> {
  const createFleet = new CreateFleetHandler(repository);
  const registerVehicle = new RegisterVehicleHandler(repository);

  const referenceDate = ActionDate.parse('2024-06-01');
  const fleetId = await createFleet.handle(new CreateFleetCommand(USER_ID));
  const plate = new VehiclePlateNumber('REG-001');

  const results = await Promise.allSettled([
    registerVehicle.handle(
      new RegisterVehicleCommand(fleetId, USER_ID, plate, referenceDate, referenceDate)
    ),
    registerVehicle.handle(
      new RegisterVehicleCommand(fleetId, USER_ID, plate, referenceDate, referenceDate)
    ),
  ]);

  assertOneSuccessOneFailure(
    repositoryName,
    'concurrent register same vehicle',
    results,
    VehicleAlreadyRegisteredInFleetError
  );
}

function assertOneSuccessOneFailure(
  repositoryName: string,
  label: string,
  results: PromiseSettledResult<void>[],
  expectedError: new (...args: never[]) => Error
): void {
  const fulfilled = results.filter((result) => result.status === 'fulfilled');
  const rejected = results.filter(
    (result): result is PromiseRejectedResult => result.status === 'rejected'
  );

  if (fulfilled.length !== 1 || rejected.length !== 1) {
    throw new Error(
      `[${repositoryName}] ${label}: expected 1 success and 1 failure, got ${fulfilled.length} success / ${rejected.length} failure`
    );
  }

  if (!(rejected[0].reason instanceof expectedError)) {
    throw new Error(
      `[${repositoryName}] ${label}: expected ${expectedError.name}, got ${String(rejected[0].reason)}`
    );
  }

  console.log(`[${repositoryName}] ${label}: OK`);
}

async function runAllConcurrencyTests(
  repositoryName: string,
  repository: PostgresFleetRepository | InMemoryFleetRepository,
  reset?: () => Promise<void>
): Promise<void> {
  await runConcurrentParkSameVehicleTest(repositoryName, repository);
  await reset?.();
  await runConcurrentParkSameLocationTest(repositoryName, repository);
  await reset?.();
  await runConcurrentRegisterSameVehicleTest(repositoryName, repository);
}

async function main(): Promise<void> {
  await runAllConcurrencyTests('in-memory', new InMemoryFleetRepository());

  if (process.env.FLEET_REPOSITORY === 'postgres') {
    await migrate();
    const pool = getPool();
    const repository = new PostgresFleetRepository(pool);
    const reset = async () => {
      await pool.query('TRUNCATE fleet_vehicles, fleets RESTART IDENTITY CASCADE');
    };
    await reset();
    await runAllConcurrencyTests('postgres', repository, reset);
    await closePool();
  }

  console.log('All concurrency checks passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
