import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FutureActionDateError } from '../../src/Domain/errors/FutureActionDateError';
import { VehicleAlreadyRegisteredInFleetError } from '../../src/Domain/errors/VehicleAlreadyRegisteredInFleetError';
import { VehiclePlateNumber } from '../../src/Domain/VehiclePlateNumber';
import { FleetWorld } from '../support/world';

Given('my fleet', async function (this: FleetWorld) {
  this.myFleetId = await this.createFleet('my-fleet');
});

Given('a vehicle', function (this: FleetWorld) {
  this.plateNumber = new VehiclePlateNumber('ABC-123');
});

Given('I have registered this vehicle into my fleet', async function (this: FleetWorld) {
  await this.registerVehicle(this.myFleetId, this.plateNumber);
});

Given('the fleet of another user', async function (this: FleetWorld) {
  this.otherFleetId = await this.createFleet('other-fleet', this.otherUserId);
});

Given(
  "this vehicle has been registered into the other user's fleet",
  async function (this: FleetWorld) {
    await this.registerVehicle(this.otherFleetId, this.plateNumber, this.otherUserId);
  }
);

When('I register this vehicle into my fleet', async function (this: FleetWorld) {
  this.lastError = null;
  await this.registerVehicle(this.myFleetId, this.plateNumber);
});

When('I try to register this vehicle into my fleet', async function (this: FleetWorld) {
  await this.tryRegisterVehicle(this.myFleetId, this.plateNumber);
});

Then('this vehicle should be part of my vehicle fleet', async function (this: FleetWorld) {
  const fleet = await this.fleetRepository.findById(this.myFleetId);
  assert.ok(fleet);
  assert.ok(fleet.hasVehicle(this.plateNumber));
});

Then(
  'I should be informed this this vehicle has already been registered into my fleet',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof VehicleAlreadyRegisteredInFleetError);
  }
);

Then(
  'I should be informed that the action date cannot be in the future',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof FutureActionDateError);
  }
);
