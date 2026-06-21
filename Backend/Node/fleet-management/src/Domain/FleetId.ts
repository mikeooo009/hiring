export class FleetId {
  constructor(readonly value: string) {
    if (!value.trim()) {
      throw new Error('Fleet id cannot be empty');
    }
  }

  equals(other: FleetId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
