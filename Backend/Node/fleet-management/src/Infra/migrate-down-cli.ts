import { closePool, registerPoolShutdownHooks } from './PostgresConnection';
import { rollback } from './migrate';

async function main(): Promise<void> {
  registerPoolShutdownHooks();
  await rollback();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
