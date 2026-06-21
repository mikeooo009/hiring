import { ActionDate } from '../ActionDate';
import { DomainError } from './DomainError';

export class FutureActionDateError extends DomainError {
  constructor(actionDate: ActionDate) {
    super(`Action date ${actionDate.toIsoDate()} cannot be in the future`);
  }
}
