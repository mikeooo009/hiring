import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { ActionDate } from '../Domain/ActionDate';
import { Fleet } from '../Domain/Fleet';
import { FleetId } from '../Domain/FleetId';
import { FleetRepository } from '../Domain/FleetRepository';
import { FleetVehicle } from '../Domain/FleetVehicle';
import { Location } from '../Domain/Location';
import { LocationOccupancy } from '../Domain/LocationOccupancy';
import { VehicleParking } from '../Domain/VehicleParking';
import { VehiclePlateNumber } from '../Domain/VehiclePlateNumber';

interface VehicleRow {
  plate_number: string;
  registered_at: string;
  parked_latitude: number | null;
  parked_longitude: number | null;
  parked_on: string | null;
}

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
    const fleetResult = await this.pool.query<{ id: string }>(
      'SELECT id FROM fleets WHERE id = $1',
      [id.toString()]
    );

    if (fleetResult.rowCount === 0) {
      return null;
    }

    const vehiclesResult = await this.pool.query<VehicleRow>(
      `SELECT plate_number,
              to_char(registered_at, 'YYYY-MM-DD') AS registered_at,
              parked_latitude,
              parked_longitude,
              to_char(parked_on, 'YYYY-MM-DD') AS parked_on
       FROM fleet_vehicles
       WHERE fleet_id = $1`,
      [id.toString()]
    );

    const vehicles = vehiclesResult.rows.map((row) => this.toFleetVehicle(row));
    return new Fleet(new FleetId(fleetResult.rows[0].id), vehicles);
  }

  async save(fleet: Fleet): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const vehicle of fleet.getVehicles()) {
        const location = vehicle.getLocation();
        const parkedOn = vehicle.getParkedOn();

        await client.query(
          `INSERT INTO fleet_vehicles (
             fleet_id, plate_number, registered_at,
             parked_latitude, parked_longitude, parked_on
           ) VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (fleet_id, plate_number) DO UPDATE SET
             registered_at = EXCLUDED.registered_at,
             parked_latitude = EXCLUDED.parked_latitude,
             parked_longitude = EXCLUDED.parked_longitude,
             parked_on = EXCLUDED.parked_on`,
          [
            fleet.id.toString(),
            vehicle.plateNumber.toString(),
            vehicle.getRegisteredAt().toIsoDate(),
            location?.latitude ?? null,
            location?.longitude ?? null,
            parkedOn?.toIsoDate() ?? null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findVehicleAtLocation(location: Location): Promise<LocationOccupancy | null> {
    const result = await this.pool.query<{ fleet_id: string; plate_number: string }>(
      `SELECT fleet_id, plate_number
       FROM fleet_vehicles
       WHERE parked_latitude = $1 AND parked_longitude = $2`,
      [location.latitude, location.longitude]
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

  async findVehicleParking(plateNumber: VehiclePlateNumber): Promise<VehicleParking | null> {
    const result = await this.pool.query<{
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

  private toFleetVehicle(row: VehicleRow): FleetVehicle {
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
}
