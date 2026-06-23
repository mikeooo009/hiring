import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { FleetAccessDeniedError } from '../../src/Domain/errors/FleetAccessDeniedError';
import { InvalidLocationError } from '../../src/Domain/errors/InvalidLocationError';
import { VehicleNotRegisteredInFleetError } from '../../src/Domain/errors/VehicleNotRegisteredInFleetError';
import { Location } from '../../src/Domain/Location';
import { VehiclePlateNumber } from '../../src/Domain/VehiclePlateNumber';
import { FleetWorld } from '../support/world';

Given('a vehicle with plate {string}', function (this: FleetWorld, plate: string) {
  this.plateNumber = new VehiclePlateNumber(plate);
});

When('I query the location of my vehicle', async function (this: FleetWorld) {
  this.lastKnownLocation = await this.getVehicleLocation(this.myFleetId, this.plateNumber);
});

Then('no location should be known for my vehicle', function (this: FleetWorld) {
  assert.equal(this.lastKnownLocation, null);
});

Then(
  'this vehicle with plate {string} should be part of my fleet',
  async function (this: FleetWorld, plate: string) {
    const fleet = await this.fleetRepository.findById(this.myFleetId);
    assert.ok(fleet);
    assert.ok(fleet.hasVehicle(new VehiclePlateNumber(plate)));
  }
);

When('I try to create an invalid location', function (this: FleetWorld) {
  this.lastError = null;
  try {
    new Location(Number.NaN, 2.3522);
  } catch (error) {
    this.lastError = error as Error;
  }
});

Then('I should be informed that the location is invalid', function (this: FleetWorld) {
  assert.ok(this.lastError instanceof InvalidLocationError);
});

When('the intruder tries to park my vehicle at this location', async function (this: FleetWorld) {
  await this.tryParkVehicle(this.myFleetId, this.plateNumber, this.location, this.intruderUserId);
});

Then('I should be informed that access to the fleet is denied', function (this: FleetWorld) {
  assert.ok(this.lastError instanceof FleetAccessDeniedError);
});

Then(
  'I should be informed that my vehicle is not registered in this fleet',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof VehicleNotRegisteredInFleetError);
  }
);
