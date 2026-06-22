import fs from 'node:fs';
import path from 'node:path';
import { getPool } from './PostgresConnection';

function readMigration(filename: string): string {
  const migrationPath = path.join(__dirname, '../../migrations', filename);
  return fs.readFileSync(migrationPath, 'utf8');
}

export async function migrate(): Promise<void> {
  await getPool().query(readMigration('001_init.sql'));
}

export async function rollback(): Promise<void> {
  await getPool().query(readMigration('001_down.sql'));
}

export async function truncateTables(): Promise<void> {
  await getPool().query('TRUNCATE fleet_vehicles, fleets RESTART IDENTITY CASCADE');
}
