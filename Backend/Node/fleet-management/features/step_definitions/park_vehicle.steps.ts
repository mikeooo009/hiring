import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ActionDateBeforeRegistrationError } from '../../src/Domain/errors/ActionDateBeforeRegistrationError';
import { FutureActionDateError } from '../../src/Domain/errors/FutureActionDateError';
import { LocationAlreadyOccupiedError } from '../../src/Domain/errors/LocationAlreadyOccupiedError';
import { VehicleAlreadyParkedAtAnotherLocationError } from '../../src/Domain/errors/VehicleAlreadyParkedAtAnotherLocationError';
import { VehicleAlreadyParkedAtLocationError } from '../../src/Domain/errors/VehicleAlreadyParkedAtLocationError';
import { Location } from '../../src/Domain/Location';
import { VehiclePlateNumber } from '../../src/Domain/VehiclePlateNumber';
import { FleetWorld } from '../support/world';

Given('a location', function (this: FleetWorld) {
  this.location = new Location(48.8566, 2.3522);
});

Given('a first location', function (this: FleetWorld) {
  this.firstLocation = new Location(48.8566, 2.3522);
});

Given('a second location', function (this: FleetWorld) {
  this.secondLocation = new Location(48.8606, 2.3376);
});

Given('my vehicle has been parked at the first location', async function (this: FleetWorld) {
  await this.parkVehicle(this.myFleetId, this.plateNumber, this.firstLocation);
});

Given('my vehicle has been parked into this location', async function (this: FleetWorld) {
  await this.parkVehicle(this.myFleetId, this.plateNumber, this.location);
});

Given('another vehicle registered in my fleet', async function (this: FleetWorld) {
  this.otherPlateNumber = new VehiclePlateNumber('XYZ-789');
  await this.registerVehicle(this.myFleetId, this.otherPlateNumber);
});

Given('the other vehicle has been parked at this location', async function (this: FleetWorld) {
  await this.parkVehicle(this.myFleetId, this.otherPlateNumber, this.location);
});

Given('another vehicle registered in the other fleet', async function (this: FleetWorld) {
  this.otherPlateNumber = new VehiclePlateNumber('XYZ-789');
  await this.registerVehicle(this.otherFleetId, this.otherPlateNumber);
});

Given('the other fleet vehicle has been parked at this location', async function (this: FleetWorld) {
  await this.parkVehicle(this.otherFleetId, this.otherPlateNumber, this.location);
});

When('I park my vehicle at this location', async function (this: FleetWorld) {
  this.lastError = null;
  await this.parkVehicle(this.myFleetId, this.plateNumber, this.location);
});

When('I park the other vehicle at this location', async function (this: FleetWorld) {
  this.lastError = null;
  await this.parkVehicle(this.myFleetId, this.otherPlateNumber, this.location);
});

When('I try to park my vehicle at this location', async function (this: FleetWorld) {
  await this.tryParkVehicle(this.myFleetId, this.plateNumber, this.location);
});

When('I try to park my vehicle at the second location', async function (this: FleetWorld) {
  await this.tryParkVehicle(this.myFleetId, this.plateNumber, this.secondLocation);
});

When(
  'I try to park this vehicle in the other fleet at the second location',
  async function (this: FleetWorld) {
    await this.tryParkVehicle(this.otherFleetId, this.plateNumber, this.secondLocation);
  }
);

Then('the known location of my vehicle should verify this location', async function (this: FleetWorld) {
  const knownLocation = await this.getVehicleLocation(this.myFleetId, this.plateNumber);
  assert.ok(knownLocation);
  assert.ok(knownLocation.equals(this.location));
});

Then(
  'I should be informed that my vehicle is already parked at this location',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof VehicleAlreadyParkedAtLocationError);
  }
);

Then(
  'I should be informed that the action date cannot be before the registration date',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof ActionDateBeforeRegistrationError);
  }
);

Then(
  'I should be informed that this location is already occupied by another vehicle',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof LocationAlreadyOccupiedError);
  }
);

Then(
  'I should be informed that my vehicle is already parked at another location',
  function (this: FleetWorld) {
    assert.ok(this.lastError instanceof VehicleAlreadyParkedAtAnotherLocationError);
  }
);
