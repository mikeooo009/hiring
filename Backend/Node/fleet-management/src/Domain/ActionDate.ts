import { ActionDateBeforeRegistrationError } from './errors/ActionDateBeforeRegistrationError';
import { FutureActionDateError } from './errors/FutureActionDateError';

export class ActionDate {
  constructor(readonly value: Date) {}

  static parse(isoDate: string): ActionDate {
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid date format "${isoDate}", expected YYYY-MM-DD`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const value = new Date(Date.UTC(year, month - 1, day));

    if (
      value.getUTCFullYear() !== year ||
      value.getUTCMonth() !== month - 1 ||
      value.getUTCDate() !== day
    ) {
      throw new Error(`Invalid date "${isoDate}"`);
    }

    return new ActionDate(value);
  }

  assertNotInFuture(referenceDate: ActionDate): void {
    if (this.isAfter(referenceDate)) {
      throw new FutureActionDateError(this);
    }
  }

  assertNotBeforeRegistration(registrationDate: ActionDate): void {
    if (this.isBefore(registrationDate)) {
      throw new ActionDateBeforeRegistrationError(this, registrationDate);
    }
  }

  isAfter(other: ActionDate): boolean {
    return this.toDayIndex() > other.toDayIndex();
  }

  isBefore(other: ActionDate): boolean {
    return this.toDayIndex() < other.toDayIndex();
  }

  equals(other: ActionDate): boolean {
    return this.toDayIndex() === other.toDayIndex();
  }

  toIsoDate(): string {
    const year = this.value.getUTCFullYear();
    const month = String(this.value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(this.value.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDayIndex(): number {
    return Date.UTC(this.value.getUTCFullYear(), this.value.getUTCMonth(), this.value.getUTCDate());
  }
}
