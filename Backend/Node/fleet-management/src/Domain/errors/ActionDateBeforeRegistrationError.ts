import { ActionDate } from '../ActionDate';
import { DomainError } from './DomainError';

export class ActionDateBeforeRegistrationError extends DomainError {
  constructor(actionDate: ActionDate, registrationDate: ActionDate) {
    super(
      `Action date ${actionDate.toIsoDate()} cannot be before the registration date ${registrationDate.toIsoDate()}`
    );
  }
}
