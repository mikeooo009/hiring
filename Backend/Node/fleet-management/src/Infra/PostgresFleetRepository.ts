import { randomUUID } from 'node:crypto';
import { DatabaseError, Pool, PoolClient } from 'pg';
import { executeLocalizeVehicleWorkflow } from '../App/localizeVehicleWorkflow';
import { LocalizeVehicleCommand } from '../App/LocalizeVehicleCommand';
import { executeParkVehicleWorkflow } from '../App/parkVehicleWorkflow';
import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { executeRegisterVehicleWorkflow } from '../App/registerVehicleWorkflow';
import { RegisterVehicleCommand } from '../App/RegisterVehicleCommand';
import { ActionDate } from '../Domain/ActionDate';
import { COORDINATE_PRECISION } from '../Domain/coordinates';
import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';
import { FleetVehicle } from '../Domain/FleetVehicle';
import { Location } from '../Domain/Location';
import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { InvalidVehicleStateError } from '../Domain/errors/InvalidVehicleStateError';
import { LocationAlreadyOccupiedError } from '../Domain/errors/LocationAlreadyOccupiedError';
import { LocationOccupancy } from '../Domain/LocationOccupancy';
import { VehicleAlreadyParkedAtAnotherLocationError } from '../Domain/errors/VehicleAlreadyParkedAtAnotherLocationError';
import { VehicleParking } from '../Domain/VehicleParking';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';
import { runWithDeadlockRetry } from './runWithDeadlockRetry';

interface VehicleRow {
  plate_number: string;
  registered_at: string;
  parked_latitude: number | null;
  parked_longitude: number | null;
  parked_on: string | null;
}

type QueryExecutor = Pick<Pool | PoolClient, 'query'>;

const PARKED_PLATE_INDEX = 'idx_fleet_vehicles_parked_plate';
const PARKED_LOCATION_INDEX = 'idx_fleet_vehicles_parked_location';

export class PostgresFleetRepository implements FleetRepository {
  constructor(private readonly pool: Pool) {}

  async create(userId: string): Promise<FleetId> {
    const fleetId = new FleetId(randomUUID());
    await this.assignFleetOwner(fleetId, userId);
    return fleetId;
  }

  async assignFleetOwner(fleetId: FleetId, userId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO fleets (id, user_id) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [fleetId.toString(), userId]
    );
  }

  async getFleetOwnerId(fleetId: FleetId): Promise<string | null> {
    return getFleetOwnerId(this.pool, fleetId);
  }

  async findById(id: FleetId): Promise<Fleet | null> {
    return findFleetById(this.pool, id);
  }

  async save(fleet: Fleet): Promise<void> {
    await runWithDeadlockRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await saveFleet(client, fleet);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  }

  async findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null> {
    return findVehicleAtLocation(this.pool, location);
  }

  async findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null> {
    return findVehicleParking(this.pool, plateNumber);
  }

  async registerVehicle(command: RegisterVehicleCommand): Promise<void> {
    await runWithDeadlockRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await lockPlate(client, command.plateNumber);
        await lockFleet(client, command.fleetId);
        const transactionalRepository = new PostgresFleetRepositoryTxn(client);
        await executeRegisterVehicleWorkflow(transactionalRepository, command);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });
  }

  async parkVehicle(command: ParkVehicleCommand): Promise<void> {
    await runWithDeadlockRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await lockLocation(client, command.location);
        await lockPlate(client, command.plateNumber);
        await lockFleet(client, command.fleetId);

        const transactionalRepository = new PostgresFleetRepositoryTxn(client);
        await executeParkVehicleWorkflow(transactionalRepository, command);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        const domainError = await mapUniqueViolationToDomainError(this.pool, error, command);
        throw domainError ?? error;
      } finally {
        client.release();
      }
    });
  }

  async localizeVehicle(command: LocalizeVehicleCommand): Promise<void> {
    await runWithDeadlockRetry(async () => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        await lockLocation(client, command.location);
        await lockPlate(client, command.plateNumber);
        await lockFleet(client, command.fleetId);

        const transactionalRepository = new PostgresFleetRepositoryTxn(client);
        await executeLocalizeVehicleWorkflow(transactionalRepository, command);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        const domainError = await mapUniqueViolationToDomainError(
          this.pool,
          error,
          command.toParkCommand()
        );
        throw domainError ?? error;
      } finally {
        client.release();
      }
    });
  }
}

class PostgresFleetRepositoryTxn implements FleetRepository {
  constructor(private readonly client: PoolClient) {}

  async create(): Promise<FleetId> {
    throw new Error('create() is not supported inside a transaction');
  }

  async assignFleetOwner(): Promise<void> {
    throw new Error('assignFleetOwner() is not supported inside a transaction');
  }

  async getFleetOwnerId(fleetId: FleetId): Promise<string | null> {
    return getFleetOwnerId(this.client, fleetId);
  }

  async findById(id: FleetId): Promise<Fleet | null> {
    return findFleetById(this.client, id);
  }

  async save(fleet: Fleet): Promise<void> {
    await saveFleet(this.client, fleet);
  }

  async findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null> {
    return findVehicleAtLocation(this.client, location);
  }

  async findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null> {
    return findVehicleParking(this.client, plateNumber);
  }

  async registerVehicle(): Promise<void> {
    throw new Error('Nested registerVehicle() calls are not supported');
  }

  async parkVehicle(): Promise<void> {
    throw new Error('Nested parkVehicle() calls are not supported');
  }

  async localizeVehicle(): Promise<void> {
    throw new Error('Nested localizeVehicle() calls are not supported');
  }
}

async function getFleetOwnerId(executor: QueryExecutor, fleetId: FleetId): Promise<string | null> {
  const result = await executor.query<{ user_id: string }>(
    'SELECT user_id FROM fleets WHERE id = $1',
    [fleetId.toString()]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0].user_id;
}

async function lockLocation(client: PoolClient, location: Location): Promise<void> {
  await client.query(
    `SELECT pg_advisory_xact_lock(
       hashtext(round($1::numeric, 6)::text || ':' || round($2::numeric, 6)::text)
     )`,
    [location.latitude, location.longitude]
  );

  await client.query(
    `SELECT fleet_id, plate_number
     FROM fleet_vehicles
     WHERE parked_latitude IS NOT NULL
       AND round(parked_latitude::numeric, $3) = round($1::numeric, $3)
       AND round(parked_longitude::numeric, $3) = round($2::numeric, $3)
     FOR UPDATE`,
    [location.latitude, location.longitude, COORDINATE_PRECISION]
  );
}

async function lockPlate(client: PoolClient, plateNumber: VehiclePlateNumber): Promise<void> {
  await client.query(`SELECT pg_advisory_xact_lock(hashtext('plate:' || $1))`, [
    plateNumber.toString(),
  ]);

  await client.query(
    `SELECT fleet_id
     FROM fleet_vehicles
     WHERE plate_number = $1
     FOR UPDATE`,
    [plateNumber.toString()]
  );
}

async function lockFleet(client: PoolClient, fleetId: FleetId): Promise<void> {
  const fleetLock = await client.query('SELECT 1 FROM fleets WHERE id = $1 FOR UPDATE', [
    fleetId.toString(),
  ]);

  if (fleetLock.rowCount === 0) {
    throw new FleetNotFoundError(fleetId);
  }
}

async function findFleetById(executor: QueryExecutor, id: FleetId): Promise<Fleet | null> {
  const fleetResult = await executor.query<{ id: string }>('SELECT id FROM fleets WHERE id = $1', [
    id.toString(),
  ]);

  if (fleetResult.rowCount === 0) {
    return null;
  }

  const vehiclesResult = await executor.query<VehicleRow>(
    `SELECT plate_number,
            to_char(registered_at, 'YYYY-MM-DD') AS registered_at,
            parked_latitude,
            parked_longitude,
            to_char(parked_on, 'YYYY-MM-DD') AS parked_on
     FROM fleet_vehicles
     WHERE fleet_id = $1`,
    [id.toString()]
  );

  const vehicles = vehiclesResult.rows.map((row) => toFleetVehicle(row));
  return new Fleet(new FleetId(fleetResult.rows[0].id), vehicles);
}

async function saveFleet(executor: QueryExecutor, fleet: Fleet): Promise<void> {
  const vehicles = fleet.getVehicles();
  if (vehicles.length === 0) {
    return;
  }

  const fleetIds: string[] = [];
  const plateNumbers: string[] = [];
  const registeredAts: string[] = [];
  const parkedLatitudes: (number | null)[] = [];
  const parkedLongitudes: (number | null)[] = [];
  const parkedOns: (string | null)[] = [];

  for (const vehicle of vehicles) {
    const location = vehicle.getLocation();
    const parkedOn = vehicle.getParkedOn();

    fleetIds.push(fleet.id.toString());
    plateNumbers.push(vehicle.plateNumber.toString());
    registeredAts.push(vehicle.getRegisteredAt().toIsoDate());
    parkedLatitudes.push(location?.latitude ?? null);
    parkedLongitudes.push(location?.longitude ?? null);
    parkedOns.push(parkedOn?.toIsoDate() ?? null);
  }

  await executor.query(
    `INSERT INTO fleet_vehicles (
       fleet_id, plate_number, registered_at,
       parked_latitude, parked_longitude, parked_on
     )
     SELECT *
     FROM UNNEST(
       $1::varchar[],
       $2::varchar[],
       $3::date[],
       $4::float8[],
       $5::float8[],
       $6::date[]
     )
     ON CONFLICT (fleet_id, plate_number) DO UPDATE SET
       registered_at = EXCLUDED.registered_at,
       parked_latitude = EXCLUDED.parked_latitude,
       parked_longitude = EXCLUDED.parked_longitude,
       parked_on = EXCLUDED.parked_on`,
    [fleetIds, plateNumbers, registeredAts, parkedLatitudes, parkedLongitudes, parkedOns]
  );
}

async function findVehicleAtLocation(
  executor: QueryExecutor,
  location: Location
): Promise<LocationOccupancy | null> {
  const result = await executor.query<{ fleet_id: string; plate_number: string }>(
    `SELECT fleet_id, plate_number
     FROM fleet_vehicles
     WHERE parked_latitude IS NOT NULL
       AND parked_longitude IS NOT NULL
       AND round(parked_latitude::numeric, $3) = round($1::numeric, $3)
       AND round(parked_longitude::numeric, $3) = round($2::numeric, $3)`,
    [location.latitude, location.longitude, COORDINATE_PRECISION]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    fleetId: new FleetId(row.fleet_id),
    plateNumber: new VehiclePlateNumber(row.plate_number),
  };
}

async function findVehicleParking(
  executor: QueryExecutor,
  plateNumber: VehiclePlateNumber
): Promise<VehicleParking | null> {
  const result = await executor.query<{
    fleet_id: string;
    plate_number: string;
    parked_latitude: number;
    parked_longitude: number;
  }>(
    `SELECT fleet_id, plate_number, parked_latitude, parked_longitude
     FROM fleet_vehicles
     WHERE plate_number = $1
       AND parked_latitude IS NOT NULL
     LIMIT 1`,
    [plateNumber.toString()]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    fleetId: new FleetId(row.fleet_id),
    plateNumber: new VehiclePlateNumber(row.plate_number),
    location: new Location(row.parked_latitude, row.parked_longitude),
  };
}

function toFleetVehicle(row: VehicleRow): FleetVehicle {
  const registeredAt = ActionDate.parse(row.registered_at);
  const hasLatitude = row.parked_latitude !== null;
  const hasLongitude = row.parked_longitude !== null;

  if (hasLatitude !== hasLongitude) {
    throw new InvalidVehicleStateError(
      `Vehicle ${row.plate_number} has inconsistent parking coordinates`
    );
  }

  if (!hasLatitude) {
    return new FleetVehicle(new VehiclePlateNumber(row.plate_number), registeredAt);
  }

  if (!row.parked_on) {
    throw new InvalidVehicleStateError(
      `Vehicle ${row.plate_number} is parked but has no parking date`
    );
  }

  const parkedAt = new Location(row.parked_latitude as number, row.parked_longitude as number);
  const parkedOn = ActionDate.parse(row.parked_on);

  return new FleetVehicle(
    new VehiclePlateNumber(row.plate_number),
    registeredAt,
    parkedAt,
    parkedOn
  );
}

async function mapUniqueViolationToDomainError(
  pool: Pool,
  error: unknown,
  command: ParkVehicleCommand
): Promise<Error | null> {
  if (!(error instanceof DatabaseError) || error.code !== '23505') {
    return null;
  }

  if (error.constraint === PARKED_PLATE_INDEX) {
    const parking = await findVehicleParking(pool, command.plateNumber);
    if (parking) {
      return new VehicleAlreadyParkedAtAnotherLocationError(command.plateNumber, parking.location);
    }
  }

  if (error.constraint === PARKED_LOCATION_INDEX) {
    const occupancy = await findVehicleAtLocation(pool, command.location);
    if (occupancy) {
      return new LocationAlreadyOccupiedError(command.location, occupancy.plateNumber);
    }
  }

  return null;
}
