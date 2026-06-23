import { BeforeAll, Before, AfterAll } from '@cucumber/cucumber';
import { closePool, registerPoolShutdownHooks } from '../../src/Infra/PostgresConnection';
import { migrate, truncateTables } from '../../src/Infra/migrate';
import { usesPostgresRepository } from './repository_factory';

BeforeAll({ timeout: 30_000 }, async function () {
  if (!usesPostgresRepository()) {
    return;
  }
  registerPoolShutdownHooks();
  await migrate();
});

Before(async function () {
  if (!usesPostgresRepository()) {
    return;
  }
  await truncateTables();
});

AfterAll(async function () {
  if (!usesPostgresRepository()) {
    return;
  }
  await closePool();
});
