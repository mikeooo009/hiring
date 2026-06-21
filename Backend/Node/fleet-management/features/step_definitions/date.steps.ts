import { Given } from '@cucumber/cucumber';
import { ActionDate } from '../../src/Domain/ActionDate';
import { FleetWorld } from '../support/world';

Given('today is {string}', function (this: FleetWorld, date: string) {
  this.today = ActionDate.parse(date);
  this.actionDate = this.today;
});

Given('the action date is {string}', function (this: FleetWorld, date: string) {
  this.actionDate = ActionDate.parse(date);
});
