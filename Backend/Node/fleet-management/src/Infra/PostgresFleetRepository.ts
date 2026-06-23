import { randomUUID } from 'node:crypto';
import { DatabaseError, Pool, PoolClient } from 'pg';
import { executeParkVehicleWorkflow } from '../App/parkVehicleWorkflow';
import { ParkVehicleCommand } from '../App/ParkVehicleCommand';
import { ActionDate } from '../Domain/ActionDate';
import { COORDINATE_EPSILON } from '../Domain/coordinates';
import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';
import { FleetVehicle } from '../Domain/FleetVehicle';
import { Location } from '../Domain/Location';
import { FleetNotFoundError } from '../Domain/errors/FleetNotFoundError';
import { LocationAlreadyOccupiedError } from '../Domain/errors/LocationAlreadyOccupiedError';
import { LocationOccupancy } from '../Domain/LocationOccupancy';
import { VehicleAlreadyParkedAtAnotherLocationError } from '../Domain/errors/VehicleAlreadyParkedAtAnotherLocationError';
import { VehicleParking } from '../Domain/VehicleParking';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

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
    await this.pool.query('INSERT INTO fleets (id, user_id) VALUES ($1, $2)', [
      fleetId.toString(),
      userId,
    ]);
    return fleetId;
  }

  async findById(id: FleetId): Promise<Fleet | null> {
    return findFleetById(this.pool, id);
  }

  async save(fleet: Fleet): Promise<void> {
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
  }

  async findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null> {
    return findVehicleAtLocation(this.pool, location);
  }

  async findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null> {
    return findVehicleParking(this.pool, plateNumber);
  }

  async parkVehicle(command: ParkVehicleCommand): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `SELECT pg_advisory_xact_lock(
           hashtext(round($1::numeric, 6)::text || ':' || round($2::numeric, 6)::text)
         )`,
        [command.location.latitude, command.location.longitude]
      );

      await client.query(
        `SELECT fleet_id
         FROM fleet_vehicles
         WHERE plate_number = $1
         FOR UPDATE`,
        [command.plateNumber.toString()]
      );

      const fleetLock = await client.query(
        'SELECT 1 FROM fleets WHERE id = $1 FOR UPDATE',
        [command.fleetId.toString()]
      );
      if (fleetLock.rowCount === 0) {
        throw new FleetNotFoundError(command.fleetId);
      }

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
  }
}

class PostgresFleetRepositoryTxn implements FleetRepository {
  constructor(private readonly client: PoolClient) {}

  async create(): Promise<FleetId> {
    throw new Error('create() is not supported inside a parkVehicle transaction');
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

  async parkVehicle(): Promise<void> {
    throw new Error('Nested parkVehicle() calls are not supported');
  }
}

async function findFleetById(executor: QueryExecutor, id: FleetId): Promise<Fleet | null> {
  const fleetResult = await executor.query<{ id: string }>(
    'SELECT id FROM fleets WHERE id = $1',
    [id.toString()]
  );

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
       AND ABS(parked_latitude - $1) <= $3
       AND ABS(parked_longitude - $2) <= $3`,
    [location.latitude, location.longitude, COORDINATE_EPSILON]
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
  let parkedAt: Location | null = null;
  let parkedOn: ActionDate | null = null;

  if (row.parked_latitude !== null && row.parked_longitude !== null) {
    parkedAt = new Location(row.parked_latitude, row.parked_longitude);
    parkedOn = row.parked_on ? ActionDate.parse(row.parked_on) : null;
  }

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
      return new VehicleAlreadyParkedAtAnotherLocationError(
        command.plateNumber,
        parking.location
      );
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
