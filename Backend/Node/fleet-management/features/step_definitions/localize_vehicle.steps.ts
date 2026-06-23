import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FleetWorld } from '../support/world';

When('I localize my vehicle at this location', async function (this: FleetWorld) {
  this.lastError = null;
  await this.localizeVehicle(this.myFleetId, this.plateNumber, this.location);
});

When('I localize my vehicle at the second location', async function (this: FleetWorld) {
  this.lastError = null;
  await this.localizeVehicle(this.myFleetId, this.plateNumber, this.secondLocation);
});

Then(
  'the known location of my vehicle should verify the second location',
  async function (this: FleetWorld) {
    const knownLocation = await this.getVehicleLocation(this.myFleetId, this.plateNumber);
    assert.ok(knownLocation);
    assert.ok(knownLocation.equals(this.secondLocation));
  }
);
