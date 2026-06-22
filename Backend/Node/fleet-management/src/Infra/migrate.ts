import fs from 'node:fs';
import path from 'node:path';
import { getPool } from './PostgresConnection';

export async function migrate(): Promise<void> {
  const migrationPath = path.join(__dirname, '../../migrations/001_init.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  await getPool().query(sql);
}

export async function truncateTables(): Promise<void> {
  await getPool().query('TRUNCATE fleet_vehicles, fleets RESTART IDENTITY CASCADE');
}
