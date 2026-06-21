import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FleetId } from '../../src/Domain/FleetId';
import { FleetNotFoundError } from '../../src/Domain/errors/FleetNotFoundError';
import { FleetWorld } from '../support/world';

Given('an unknown fleet', function (this: FleetWorld) {
  this.unknownFleetId = new FleetId('unknown-fleet');
});

When('I try to register this vehicle into the unknown fleet', async function (this: FleetWorld) {
  await this.tryRegisterVehicle(this.unknownFleetId, this.plateNumber);
});

When(
  'I try to park my vehicle in the unknown fleet at this location',
  async function (this: FleetWorld) {
    await this.tryParkVehicle(this.unknownFleetId, this.plateNumber, this.location);
  }
);

Then('I should be informed that the fleet was not found', function (this: FleetWorld) {
  assert.ok(this.lastError instanceof FleetNotFoundError);
});
