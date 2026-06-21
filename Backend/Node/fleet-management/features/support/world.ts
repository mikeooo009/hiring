import { setWorldConstructor, World } from '@cucumber/cucumber';

export class FleetWorld extends World {
  // BDD scenario state — wired up as domain code is implemented
}

setWorldConstructor(FleetWorld);
