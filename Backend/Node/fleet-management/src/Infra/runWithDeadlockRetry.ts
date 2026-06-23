import { DatabaseError } from 'pg';

const DEADLOCK_ERROR_CODE = '40P01';
const DEFAULT_MAX_ATTEMPTS = 3;

export async function runWithDeadlockRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isDeadlock(error) || attempt === maxAttempts) {
        throw error;
      }
    }
  }

  throw new Error('Deadlock retry failed unexpectedly');
}

function isDeadlock(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === DEADLOCK_ERROR_CODE;
}
