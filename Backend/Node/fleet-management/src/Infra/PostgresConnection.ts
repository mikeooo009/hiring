import { Pool } from 'pg';

let pool: Pool | null = null;
let closing: Promise<void> | null = null;
let shutdownHooksRegistered = false;

export function getPool(): Pool {
  if (closing) {
    throw new Error('Database pool is closing');
  }
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    pool = new Pool({ connectionString });
    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error.message);
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool && !closing) {
    return;
  }

  if (!closing) {
    const activePool = pool;
    pool = null;
    if (!activePool) {
      return;
    }
    closing = activePool.end().finally(() => {
      closing = null;
    });
  }

  await closing;
}

export function registerPoolShutdownHooks(): void {
  if (shutdownHooksRegistered) {
    return;
  }
  shutdownHooksRegistered = true;

  const shutdown = async (exitCode: number): Promise<void> => {
    await closePool();
    process.exit(exitCode);
  };

  process.once('SIGINT', () => {
    void shutdown(130);
  });

  process.once('SIGTERM', () => {
    void shutdown(143);
  });
}
