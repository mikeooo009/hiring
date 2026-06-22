import { closePool, registerPoolShutdownHooks } from './PostgresConnection';
import { migrate } from './migrate';

async function main(): Promise<void> {
  registerPoolShutdownHooks();
  await migrate();
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
