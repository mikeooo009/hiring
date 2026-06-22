#!/usr/bin/env node
import { Command } from 'commander';
import {
  CreateFleetCommand,
  CreateFleetHandler,
  ParkVehicleCommand,
  ParkVehicleHandler,
  RegisterVehicleCommand,
  RegisterVehicleHandler,
} from '../src/App';
import { ActionDate } from '../src/Domain/ActionDate';
import { FleetId } from '../src/Domain/FleetId';
import { Location } from '../src/Domain/Location';
import { VehiclePlateNumber } from '../src/Domain/VehiclePlateNumber';
import { DomainError } from '../src/Domain/errors/DomainError';
import {
  closePool,
  getPool,
  registerPoolShutdownHooks,
} from '../src/Infra/PostgresConnection';
import { PostgresFleetRepository } from '../src/Infra/PostgresFleetRepository';
import { migrate } from '../src/Infra/migrate';

async function main(): Promise<void> {
  registerPoolShutdownHooks();

  try {
    await migrate();
    const repository = new PostgresFleetRepository(getPool());
    const referenceDate = ActionDate.parse(new Date().toISOString().slice(0, 10));

    const program = new Command();
    program.name('fleet').description('Fleet parking management CLI');

    program
      .command('create')
      .argument('<userId>', 'owner user id')
      .description('Create a fleet and print its id')
      .action(async (userId: string) => {
        const handler = new CreateFleetHandler(repository);
        const fleetId = await handler.handle(new CreateFleetCommand(userId));
        console.log(fleetId.toString());
      });

    program
      .command('register-vehicle')
      .arguments('<fleetId> <vehiclePlateNumber>')
      .description('Register a vehicle into a fleet')
      .action(async (fleetId: string, vehiclePlateNumber: string) => {
        const handler = new RegisterVehicleHandler(repository);
        await handler.handle(
          new RegisterVehicleCommand(
            new FleetId(fleetId),
            new VehiclePlateNumber(vehiclePlateNumber),
            referenceDate,
            referenceDate
          )
        );
      });

    program
      .command('localize-vehicle')
      .arguments('<fleetId> <vehiclePlateNumber> <lat> <lng>')
      .description('Park a vehicle at GPS coordinates')
      .action(async (fleetId: string, vehiclePlateNumber: string, lat: string, lng: string) => {
        const handler = new ParkVehicleHandler(repository);
        await handler.handle(
          new ParkVehicleCommand(
            new FleetId(fleetId),
            new VehiclePlateNumber(vehiclePlateNumber),
            new Location(Number(lat), Number(lng)),
            referenceDate,
            referenceDate
          )
        );
      });

    await program.parseAsync(process.argv);
  } finally {
    await closePool();
  }
}

main().catch(async (error: unknown) => {
  if (error instanceof DomainError) {
    console.error(error.message);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unexpected error');
  }
  await closePool();
  process.exit(1);
});
