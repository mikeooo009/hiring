import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { ActionDate } from '../../src/Domain/ActionDate';
import { FleetWorld } from '../support/world';

Then(
  'the registration date of my vehicle should be {string}',
  async function (this: FleetWorld, date: string) {
    const fleet = await this.fleetRepository.findById(this.myFleetId);
    assert.ok(fleet);

    const registrationDate = fleet.getVehicleRegistrationDate(this.plateNumber);
    assert.ok(registrationDate.equals(ActionDate.parse(date)));
  }
);

Then(
  'the parking date of my vehicle should be {string}',
  async function (this: FleetWorld, date: string) {
    const fleet = await this.fleetRepository.findById(this.myFleetId);
    assert.ok(fleet);

    const parkedOn = fleet.getVehicleParkedOn(this.plateNumber);
    assert.ok(parkedOn);
    assert.ok(parkedOn.equals(ActionDate.parse(date)));
  }
);

Then(
  'the parking date of the other vehicle should be {string}',
  async function (this: FleetWorld, date: string) {
    const fleet = await this.fleetRepository.findById(this.myFleetId);
    assert.ok(fleet);

    const parkedOn = fleet.getVehicleParkedOn(this.otherPlateNumber);
    assert.ok(parkedOn);
    assert.ok(parkedOn.equals(ActionDate.parse(date)));
  }
);
